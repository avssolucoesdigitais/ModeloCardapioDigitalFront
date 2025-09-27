import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço
function parsePreco(preco) {
  if (typeof preco === "number") {
    return preco;
  }

  if (typeof preco === "string") {
    return parseFloat(preco.replace(",", "."));
  }

  return 0; // Default value if not a number or string
}

export default function PainelPastel() {
  const [docData, setDocData] = useState({
    produtos: [],
    adicionais: [], // Apenas adicionais para o pastel
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "tradicional", // Exemplo de categoria fixada
    adicionais: [], // Para armazenar adicionais
  });

  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Pastel");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Pastel");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      image: "",
      sizes: [],
      prices: {},
      available: true,
      categoria: "tradicional", // Fixando categoria
      adicionais: [],
    });
    setEditingIdx(null);
  }

  // Categorias fixas (se necessário)
  const categorias = ["tradicional", "especial", "doce"];
  const pastelsPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="space-y-10">
      {/* Formulário de cadastro/edição */}
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Lista agrupada */}
      <div className="bg-white rounded-xl shadow-md p-4 space-y-6">
        <h3 className="text-lg font-bold">🥟 Pastéis Cadastrados</h3>

        {pastelsPorCategoria.map(({ nome, itens }) => (
          <div key={nome} className="space-y-3">
            <h4 className="font-semibold capitalize flex items-center gap-2">
              {nome === "tradicional" && "🥟 Tradicionais"}
              {nome === "especial" && "⭐ Especiais"}
              {nome === "doce" && "🍫 Doces"}
            </h4>

            {itens.length > 0 ? (
              itens.map((p) => {
                const realIdx = docData.produtos.indexOf(p);
                return (
                  <div
                    key={p.id || realIdx}
                    className="flex flex-col sm:flex-row gap-4 items-start border rounded-lg p-4 bg-white shadow-sm"
                  >
                    {/* Imagem */}
                    <img
                      src={p.image || "https://via.placeholder.com/100"}
                      alt={p.name}
                      className="w-24 h-24 rounded-md object-cover border"
                    />

                    {/* Infos */}
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{p.name}</h4>
                      <p className="text-sm text-gray-600">{p.description}</p>

                      {/* Tamanhos */}
                      {p.sizes?.length > 0 && (
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          Tamanhos:{" "}
                          {p.sizes
                            .map(
                              (s) =>
                                `${s} (R$ ${
                                  p.prices[s]
                                    ? parsePreco(p.prices[s]).toFixed(2).replace(".", ",")
                                    : "0,00"
                                })`
                            )
                            .join(", ")}
                        </p>
                      )}

                      {/* Adicionais */}
                      {p.adicionais?.length > 0 && (
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          Adicionais:{" "}
                          {p.adicionais
                            .map(
                              (a) =>
                                `${a.nome} (+R$ ${
                                  a.preco
                                    ? parsePreco(a.preco).toFixed(2).replace(".", ",")
                                    : "0,00"
                                })`
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setForm({ ...p, category: "Pastel" }); // Garantir categoria fixada
                          setEditingIdx(realIdx);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este item?")) {
                            const next = {
                              ...docData,
                              produtos: docData.produtos.filter((_, i) => i !== realIdx),
                            };
                            saveDocData(next);
                            setDocData(next);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        🗑️ Excluir
                      </button>

                      <button
                        onClick={() => {
                          const updated = { ...p, available: !p.available, category: "Pastel" };
                          const next = { ...docData };
                          next.produtos[realIdx] = updated;
                          saveDocData(next);
                          setDocData(next);
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          p.available
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }`}
                      >
                        {p.available ? "✅ Disponível" : "❌ Indisponível"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                Nenhum item nessa categoria.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Adicionais */}
      <section>
        <h2 className="text-lg font-bold mb-3">🧀 Adicionais</h2>
        <ItemList
          items={docData.adicionais}
          onChange={(items) => {
            const next = { ...docData, adicionais: items };
            setDocData(next);
            saveDocData(next);
          }}
        />
      </section>
    </div>
  );
}

// Componente para Adicionais
function ItemList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome || !novo.preco) return;

    // Aqui a correção para garantir que o preço será tratado corretamente com vírgula.
    const precoCorreto = parsePreco(novo.preco);

    onChange([...items, { ...novo, preco: precoCorreto, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border p-2 rounded"
        >
          <span>
            {item.nome}{" "}
            {item.preco && (
              <span className="text-green-600">
                +R$ {Number(item.preco).toFixed(2)}
              </span>
            )}
          </span>
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-600 hover:underline"
          >
            Remover
          </button>
        </div>
      ))}

      {/* Novo item */}
      <div className="flex gap-2">
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="border px-2 py-1 rounded flex-1"
        />
        <input
          placeholder="Preço"
          value={novo.preco}
          onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
          className="border px-2 py-1 rounded w-28"
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-3 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}
