import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço robusto
function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function PainelPastel() {
  const [docData, setDocData] = useState({ produtos: [], adicionais: [] });
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "tradicional",
    adicionais: [],
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
      categoria: "tradicional",
      adicionais: [],
    });
    setEditingIdx(null);
  }

  const categorias = ["tradicional", "especial", "doce"];
  const pastelsPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-12 font-sans pb-20">
      {/* Formulário Reutilizável */}
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Listagem de Pastéis */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            🥟 Cardápio de Pastéis
          </h3>
        </div>

        <div className="p-6 space-y-10">
          {pastelsPorCategoria.map(({ nome, itens }) => (
            <div key={nome} className="space-y-4">
              <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-orange-500">
                <span className="h-px flex-1 bg-orange-100"></span>
                {nome === "tradicional" && "🥟 Pastéis Tradicionais"}
                {nome === "especial" && "🌟 Pastéis Especiais"}
                {nome === "doce" && "🍫 Pastéis Doces"}
                <span className="h-px flex-1 bg-orange-100"></span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {itens.length > 0 ? (
                  itens.map((p) => {
                    const realIdx = docData.produtos.indexOf(p);
                    return (
                      <div
                        key={p.id || realIdx}
                        className={`group flex flex-col md:flex-row gap-5 p-4 rounded-2xl border transition-all ${
                          !p.available 
                            ? "bg-gray-50 border-gray-100 opacity-60" 
                            : "bg-white border-gray-100 hover:border-orange-200 hover:shadow-md"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={p.image || "https://via.placeholder.com/100"}
                            alt={p.name}
                            className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shadow-sm border border-gray-100"
                          />
                          {!p.available && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-white font-black text-xs uppercase tracking-tighter">Indisponível</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-gray-900 text-lg leading-tight truncate">{p.name}</h5>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {p.sizes?.map((s) => (
                              <span key={s} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-[11px] font-bold border border-orange-100">
                                {s}: R$ {parsePreco(p.prices[s]).toFixed(2).replace(".", ",")}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                          <button
                            onClick={() => { setForm({ ...p, category: "Pastel" }); setEditingIdx(realIdx); window.scrollTo({top:0, behavior:'smooth'}); }}
                            className="flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              const updated = { ...p, available: !p.available };
                              const next = { ...docData };
                              next.produtos[realIdx] = updated;
                              saveDocData(next);
                            }}
                            className={`flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-colors ${p.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                          >
                            {p.available ? "✔" : "✖"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Excluir pastel permanentemente?")) {
                                const next = { ...docData, produtos: docData.produtos.filter((_, i) => i !== realIdx) };
                                saveDocData(next);
                              }
                            }}
                            className="flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-sm italic">Nenhum pastel cadastrado nesta categoria.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de Adicionais Minimalista */}
      <section className="max-w-2xl mx-auto">
        <SimpleItemSection
          title="🧀 Adicionais para Pastel"
          items={docData.adicionais}
          onChange={(items) => {
            const next = { ...docData, adicionais: items };
            saveDocData(next);
          }}
        />
      </section>
    </div>
  );
}

function SimpleItemSection({ title, items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome.trim() || !novo.preco) return;
    const precoNormalizado = parsePreco(novo.preco);
    onChange([...items, { ...novo, preco: precoNormalizado, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="font-black text-gray-800 tracking-tight">{title}</h2>
        <span className="text-[10px] font-black bg-white px-2 py-1 rounded-full border border-gray-200 text-gray-400">{items.length} OPÇÕES</span>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-orange-100 hover:bg-white transition-all group">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">{item.nome}</span>
                <span className="text-xs font-black text-orange-600">+ R$ {Number(item.preco).toFixed(2).replace(".", ",")}</span>
              </div>
              <button
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              placeholder="Ex: Queijo Extra"
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              className="h-11 border-2 border-gray-50 rounded-xl px-4 bg-gray-50 focus:bg-white focus:border-orange-300 outline-none transition-all text-sm"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
              <input
                placeholder="0,00"
                value={novo.preco}
                onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
                className="w-full h-11 border-2 border-gray-50 rounded-xl pl-8 pr-4 bg-gray-50 focus:bg-white focus:border-orange-300 outline-none transition-all text-sm font-bold"
              />
            </div>
          </div>
          <button
            onClick={addItem}
            className="w-full h-11 bg-orange-600 text-white rounded-xl font-black text-sm hover:bg-orange-700 shadow-lg shadow-orange-100 active:scale-[0.98] transition-all"
          >
            ADICIONAR COMPLEMENTO
          </button>
        </div>
      </div>
    </div>
  );
}