import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

export default function PainelHamburguer() {
  const estruturaPadrao = {
    produtos: [],      // Hambúrgueres prontos
    artesanais: [],    // Hambúrgueres especiais/artesanais
    paes: [],
    carnes: [],
    queijos: [],
    molhos: [],
    complementos: [],
    acompanhamentos: [],
    bebidas: [],
    sobremesas: [],
  };

  const [docData, setDocData] = useState(estruturaPadrao);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Hamburguer");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDocData({ ...estruturaPadrao, ...snap.data() });
      } else {
        await setDoc(ref, estruturaPadrao);
        setDocData(estruturaPadrao);
      }
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Hamburguer");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function updateSection(section, value) {
    setDocData((prev) => {
      const updated = { ...prev, [section]: value };
      saveDocData(updated);
      return updated;
    });
  }

  return (
    <div className="space-y-10">
      {/* Hambúrgueres prontos */}
      <section>
        <h2 className="text-xl font-bold mb-3">🍔 Hambúrgueres Prontos</h2>
        <ItemList
          items={docData.produtos || []}
          onChange={(items) => updateSection("produtos", items)}
        />
      </section>

      {/* Hambúrgueres artesanais */}
      <section>
        <h2 className="text-xl font-bold mb-3">🥩 Hambúrgueres Artesanais</h2>
        <ItemList
          items={docData.artesanais || []}
          onChange={(items) => updateSection("artesanais", items)}
        />
      </section>

      {/* Monte o Seu Burger */}
      <section>
        <h2 className="text-xl font-bold mb-3">🍳 Monte o Seu Burger</h2>
        <OptionList
          title="Pães"
          items={docData.paes || []}
          onChange={(items) => updateSection("paes", items)}
        />
        <OptionList
          title="Carnes"
          items={docData.carnes || []}
          onChange={(items) => updateSection("carnes", items)}
        />
        <OptionList
          title="Queijos"
          items={docData.queijos || []}
          onChange={(items) => updateSection("queijos", items)}
        />
        <OptionList
          title="Molhos"
          items={docData.molhos || []}
          onChange={(items) => updateSection("molhos", items)}
        />
        <OptionList
          title="Complementos"
          items={docData.complementos || []}
          onChange={(items) => updateSection("complementos", items)}
        />
      </section>

      {/* Acompanhamentos */}
      <section>
        <h2 className="text-xl font-bold mb-3">🍟 Acompanhamentos</h2>
        <ItemList
          items={docData.acompanhamentos || []}
          onChange={(items) => updateSection("acompanhamentos", items)}
        />
      </section>
    </div>
  );
}

/* ======================================================
   Helpers
   ====================================================== */
function parsePreco(preco) {
  if (!preco) return 0;
  return Number(String(preco).replace(",", "."));
}

/* ======================================================
   Componentes auxiliares
   ====================================================== */

// Lista de produtos (hambúrguer pronto ou artesanal)
function ItemList({ items = [], onChange }) {
  const [novo, setNovo] = useState({
    name: "",
    description: "",
    preco: "",
    image: "",
    montar: false, // flag montar
  });
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      setNovo((prev) => ({ ...prev, image: url }));
    } catch (err) {
      alert("Erro no upload: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    if (!novo.name) {
      alert("Digite um nome!");
      return;
    }

    if (!novo.montar && !novo.preco) {
      alert("Informe um preço para hambúrguer pronto!");
      return;
    }

    onChange([...items, { ...novo, id: Date.now() }]);
    setNovo({ name: "", description: "", preco: "", image: "", montar: false });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row items-center sm:justify-between border p-3 rounded-lg shadow-sm bg-white"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">{item.name}</p>
              {item.description && (
                <p className="text-sm text-gray-500">{item.description}</p>
              )}
              <p className="text-green-600 font-bold text-base">
                R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}
              </p>
              {item.montar && (
                <p className="text-xs text-blue-600 font-semibold">
                  🔧 Cliente pode montar
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-600 hover:underline mt-2 sm:mt-0"
          >
            Remover
          </button>
        </div>
      ))}

      {/* Novo item */}
      <div className="flex flex-col gap-2 border rounded-lg p-4 bg-gray-50">
        <input
          placeholder="Nome"
          value={novo.name}
          onChange={(e) => setNovo({ ...novo, name: e.target.value })}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          placeholder="Descrição"
          value={novo.description}
          onChange={(e) => setNovo({ ...novo, description: e.target.value })}
          className="border px-3 py-2 rounded w-full"
        />

        {!novo.montar && (
          <input
            placeholder="Preço base"
            value={novo.preco}
            onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={novo.montar}
            onChange={(e) => setNovo({ ...novo, montar: e.target.checked })}
          />
          Permitir cliente montar hambúrguer
        </label>

        <input type="file" accept="image/*" onChange={handleUpload} />
        {loading && <p className="text-sm text-gray-500">Enviando imagem...</p>}
        {novo.image && (
          <img
            src={novo.image}
            alt="preview"
            className="w-24 h-24 object-cover rounded-md self-center"
          />
        )}
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Lista de opções (para monteSeu)
function OptionList({ title, items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addOption() {
    if (!novo.nome) return;
    onChange([...items, { ...novo, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  function removeOption(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="mb-4">
      <h3 className="font-semibold">{title}</h3>
      {items.map((op) => (
        <div
          key={op.id}
          className="flex flex-col sm:flex-row items-center justify-between border p-2 rounded mb-1 bg-white"
        >
          <span>
            {op.nome}{" "}
            {op.preco && (
              <span className="text-green-600">
                +R$ {parsePreco(op.preco).toFixed(2).replace(".", ",")}
              </span>
            )}
          </span>
          <button
            onClick={() => removeOption(op.id)}
            className="text-red-600 hover:underline mt-2 sm:mt-0"
          >
            Remover
          </button>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="border px-3 py-2 rounded flex-1"
        />
        <input
          placeholder="Preço extra"
          value={novo.preco}
          onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
          className="border px-3 py-2 rounded w-full sm:w-32"
        />
        <button
          onClick={addOption}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition"
        >
          +
        </button>
      </div>
    </div>
  );
}
