import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { PlusCircle, Trash2, Upload, Loader2 } from "lucide-react";

export default function PainelHamburguer() {
  const estruturaPadrao = {
    produtos: [],
    artesanais: [],
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
    <div className="space-y-10 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Hambúrgueres Prontos */}
      <Section title="🍔 Hambúrgueres Prontos">
        <ItemList
          items={docData.produtos || []}
          onChange={(items) => updateSection("produtos", items)}
        />
      </Section>

      {/* Hambúrgueres Artesanais */}
      <Section title="🥩 Hambúrgueres Artesanais">
        <ItemList
          items={docData.artesanais || []}
          onChange={(items) => updateSection("artesanais", items)}
        />
      </Section>

      {/* Monte o seu Burger */}
      <Section title="🍳 Monte o Seu Burger">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>
      </Section>
    </div>
  );
}

/* ======================================================
   Helpers
   ====================================================== */
function parsePreco(preco) {
  if (!preco) return 0;
  const num = parseFloat(String(preco).replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

/* ======================================================
   ItemList (hambúrguer pronto/artesanal)
   ====================================================== */
function ItemList({ items = [], onChange }) {
  const [novo, setNovo] = useState({
    name: "",
    description: "",
    preco: "",
    image: "",
    montar: false,
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
    if (!novo.name) return alert("Digite um nome!");
    if (!novo.montar && !novo.preco)
      return alert("Informe um preço para hambúrguer pronto!");

    const precoNormalizado = novo.montar
      ? ""
      : parseFloat(String(novo.preco).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

    onChange([...items, { ...novo, preco: precoNormalizado, id: Date.now() }]);
    setNovo({ name: "", description: "", preco: "", image: "", montar: false });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-4 bg-gray-50 border rounded-xl hover:shadow-md transition"
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center rounded-lg border bg-gray-100 text-gray-400 text-xs">
                sem imagem
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.name}</p>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              {item.preco && (
                <p className="text-blue-600 font-bold">
                  R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}
                </p>
              )}
              {item.montar && (
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  🔧 Cliente pode montar
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            aria-label={`Remover ${item.name}`}
            className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
          >
            <Trash2 size={16} /> Remover
          </button>
        </div>
      ))}

      {/* Novo item */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" /> Novo Hambúrguer
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            placeholder="Nome"
            value={novo.name}
            onChange={(e) => setNovo({ ...novo, name: e.target.value })}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Nome do hambúrguer"
          />
          <input
            placeholder="Preço base"
            disabled={novo.montar}
            value={novo.preco}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.,]/g, "");
              setNovo({ ...novo, preco: val });
            }}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Preço do hambúrguer"
          />
        </div>

        <textarea
          placeholder="Descrição (opcional)"
          value={novo.description}
          onChange={(e) => setNovo({ ...novo, description: e.target.value })}
          className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none mb-3"
          rows={2}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
          <input
            type="checkbox"
            checked={novo.montar}
            onChange={(e) => setNovo({ ...novo, montar: e.target.checked })}
          />
          Permitir cliente montar hambúrguer
        </label>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-blue-600 font-medium">
            <Upload className="w-4 h-4" /> Enviar imagem
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>

          {loading && (
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
            </div>
          )}
        </div>

        {novo.image && (
          <img
            src={novo.image}
            alt="preview"
            className="w-24 h-24 object-cover rounded-lg border mt-3"
          />
        )}

        <button
          onClick={addItem}
          className="mt-4 bg-blue-600 text-white w-full sm:w-auto px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition active:scale-[0.98]"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   OptionList (novo modelo tipo lista moderna)
   ====================================================== */
function OptionList({ title, items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addOption() {
    if (!novo.nome.trim()) return;
    const precoNormalizado =
      parseFloat(String(novo.preco).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

    onChange([...items, { ...novo, preco: precoNormalizado, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  function removeOption(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-200">
        {items.length > 0 ? (
          items.map((op) => (
            <div
              key={op.id}
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-medium text-gray-800">{op.nome}</span>
                {op.preco ? (
                  <span className="text-blue-600 font-semibold text-sm">
                    +R$ {parsePreco(op.preco).toFixed(2).replace(".", ",")}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Grátis</span>
                )}
              </div>

              <button
                onClick={() => removeOption(op.id)}
                className="text-red-500 hover:text-red-700 transition flex items-center gap-1"
                aria-label={`Remover ${op.nome}`}
              >
                <Trash2 size={16} />
                <span className="text-sm">Remover</span>
              </button>
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500 italic">
            Nenhum item adicionado ainda.
          </p>
        )}
      </div>

      {/* Formulário */}
      <div className="bg-gray-50 border-t p-4 flex flex-col sm:flex-row items-center gap-2">
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          placeholder="Preço extra"
          value={novo.preco}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d.,]/g, "");
            setNovo({ ...novo, preco: val });
          }}
          className="border rounded-lg px-3 py-2 w-full sm:w-32 focus:ring-2 focus:ring-blue-500 outline-none text-center"
        />
        <button
          onClick={addOption}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition w-full sm:w-auto"
        >
          +
        </button>
      </div>
    </div>
  );
}