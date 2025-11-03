import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

// Helper para preço com vírgula ou ponto
function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelBebida() {
  const [docData, setDocData] = useState({ produtos: [] });
  const [editingIdx, setEditingIdx] = useState(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    description: "",
    preco: "",
    image: "",
    available: true,
    categoria: "tradicional",
    sizes: [],
    prices: {},
  });

  const categorias = ["tradicional", "especial", "doce"];
  const produtosPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Bebida");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Bebida");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setNovoProduto({
      nome: "",
      description: "",
      preco: "",
      image: "",
      available: true,
      categoria: "tradicional",
      sizes: [],
      prices: {},
    });
    setEditingIdx(null);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file);
      setNovoProduto((prev) => ({ ...prev, image: url }));
    } catch (err) {
      alert("Erro no upload: " + err.message);
    }
  }

  function addOrUpdateProduto() {
    if (!novoProduto.nome || !novoProduto.preco) return;

    const precoCorreto = parsePreco(novoProduto.preco);
    const produtoAtualizado = { ...novoProduto, preco: precoCorreto, id: Date.now() };

    let novosProdutos;
    if (editingIdx !== null) {
      novosProdutos = [...docData.produtos];
      novosProdutos[editingIdx] = { ...produtoAtualizado, id: docData.produtos[editingIdx].id };
    } else {
      novosProdutos = [...docData.produtos, produtoAtualizado];
    }

    saveDocData({ ...docData, produtos: novosProdutos });
    resetForm();
  }

  function removeProduto(id) {
    saveDocData({ ...docData, produtos: docData.produtos.filter((p) => p.id !== id) });
  }

  function toggleDisponivel(idx) {
    const next = { ...docData };
    next.produtos[idx].available = !next.produtos[idx].available;
    saveDocData(next);
  }

  return (
    <div className="space-y-10">

      {/* Formulário Bebida */}
      <section className="border p-4 rounded-md bg-gray-50 space-y-3">
        <h2 className="text-xl font-bold mb-2"> Bebida</h2>
        <input
          placeholder="Nome"
          value={novoProduto.nome}
          onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          placeholder="Descrição"
          value={novoProduto.description}
          onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })}
          className="border px-2 py-1 rounded w-full"
        />
        <input
          placeholder="Preço"
          value={novoProduto.preco}
          onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
          className="border px-2 py-1 rounded w-full"
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {novoProduto.image && <img src={novoProduto.image} alt="preview" className="w-24 h-24 object-cover rounded" />}
        <button
          onClick={addOrUpdateProduto}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
        >
          {editingIdx !== null ? "Atualizar" : "Adicionar"}
        </button>
      </section>

      {/* Lista de produtos por categoria */}
      {produtosPorCategoria.map(({ nome, itens }) => (
        <section key={nome} className="space-y-3">
        
          {itens.map((p) => {
            const idx = docData.produtos.indexOf(p);
            return (
              <div key={p.id} className="flex flex-col sm:flex-row gap-4 items-start border rounded-lg p-3 bg-white shadow-sm">
                {p.image && <img src={p.image} alt={p.nome} className="w-20 h-20 object-cover rounded" />}
                <div className="flex-1">
                  <p className="font-semibold">{p.nome}</p>
                  {p.description && <p className="text-sm text-gray-600">{p.description}</p>}
                  <p className="text-green-600 font-bold">R$ {parsePreco(p.preco).toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNovoProduto({ ...p, preco: p.preco.toString() });
                      setEditingIdx(idx);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeProduto(p.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => toggleDisponivel(idx)}
                    className={`px-3 py-1 rounded ${p.available ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}
                  >
                    {p.available ? "✅" : "❌"}
                  </button>
                </div>
              </div>
            );
          })}
          {itens.length === 0 && <p className="text-sm text-gray-500">Nenhum item nessa categoria.</p>}
        </section>
      ))}
    </div>
  );
}


