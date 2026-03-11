import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço robusto (Padronizado)
function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function PainelHamburguer({ lojaId }) {
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
      const ref = doc(db, "lojas", lojaId, "opcoes", "Hamburguer");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "lojas", lojaId, "opcoes", "Hamburguer"); // Corrigido para Capitalizado se for o padrão
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

  const categorias = ["tradicional", "especial", "combo"];
  const hamburgueresPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-12 font-sans pb-20">
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Listagem Estilizada */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            🍔 Burger Menu Admin
          </h3>
          <span className="text-xs font-bold bg-rose-500 text-white px-3 py-1 rounded-full uppercase">
            {docData.produtos?.length || 0} Itens
          </span>
        </div>

        <div className="p-6 space-y-10">
          {hamburgueresPorCategoria.map(({ nome, itens }) => (
            <div key={nome} className="space-y-4">
              <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-rose-600">
                {nome === "tradicional" && "🍔 Tradicionais"}
                {nome === "especial" && "✨ Especiais da Casa"}
                {nome === "combo" && "🥤 Combos Completos"}
                <span className="h-px flex-1 bg-rose-100"></span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {itens.length > 0 ? (
                  itens.map((p) => {
                    const realIdx = docData.produtos.indexOf(p);
                    return (
                      <div
                        key={p.id || realIdx}
                        className={`group flex flex-col md:flex-row gap-5 p-5 rounded-2xl border transition-all ${
                          !p.available 
                            ? "bg-gray-50 border-gray-100 opacity-60" 
                            : "bg-white border-gray-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5"
                        }`}
                      >
                        <div className="relative shrink-0 mx-auto md:mx-0">
                          <img
                            src={p.image || "https://via.placeholder.com/150"}
                            alt={p.name}
                            className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm border border-gray-100 group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-center md:text-left">
                          <h5 className="font-black text-slate-800 text-xl leading-tight">{p.name}</h5>
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2 italic">{p.description}</p>
                          
                          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                            {p.sizes?.map((s) => (
                              <div key={s} className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-[11px] font-black border border-slate-200">
                                {s.toUpperCase()} <span className="mx-1 text-rose-500">•</span> R$ {parsePreco(p.prices[s]).toFixed(2).replace(".", ",")}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <button
                            onClick={() => { setForm({ ...p, category: "Hamburguer" }); setEditingIdx(realIdx); window.scrollTo({top:0, behavior:'smooth'}); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Editar"
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
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${p.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}
                            title="Disponibilidade"
                          >
                            {p.available ? "ON" : "OFF"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o burger ${p.name}?`)) {
                                const next = { ...docData, produtos: docData.produtos.filter((_, i) => i !== realIdx) };
                                saveDocData(next);
                              }
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-50 rounded-2xl">
                    Sem itens nesta categoria.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adicionais Estilizados */}
      <section className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase tracking-tighter">🥓 Extras & Toppings</h2>
            <span className="text-xs font-bold text-rose-500">Hamburgueria</span>
          </div>
          <div className="p-6">
            <AdicionaisList
              items={docData.adicionais}
              onChange={(items) => {
                const next = { ...docData, adicionais: items };
                saveDocData(next);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function AdicionaisList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome || !novo.preco) return;
    const precoCorreto = parsePreco(novo.preco);
    onChange([...items, { ...novo, preco: precoCorreto, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group">
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-700">{item.nome}</span>
              <span className="text-xs font-bold text-rose-500">+ R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}</span>
            </div>
            <button
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
        <input
          placeholder="Nome (ex: Bacon Extra)"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="h-11 border-2 border-slate-50 rounded-xl px-4 bg-slate-50 focus:bg-white focus:border-rose-200 outline-none transition-all text-sm font-medium"
        />
        <div className="flex gap-2">
          <input
            placeholder="R$ 0,00"
            value={novo.preco}
            onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
            className="flex-1 h-11 border-2 border-slate-50 rounded-xl px-4 bg-slate-50 focus:bg-white focus:border-rose-200 outline-none transition-all text-sm font-black"
          />
          <button
            onClick={addItem}
            className="px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-rose-600 transition-all uppercase tracking-widest"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}