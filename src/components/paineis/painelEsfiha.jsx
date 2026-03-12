import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";
import BotoesAcao from "../BotoesAcao";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function PainelEsfiha({ lojaId }) {
  const formRef = useRef(null);
  const [docData, setDocData] = useState({ produtos: [], adicionais: [] });
  const [form, setForm] = useState({ name: "", description: "", image: "", sizes: [], prices: {}, available: true, categoria: "tradicional", adicionais: [] });
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "lojas", lojaId, "opcoes", "Esfiha");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "lojas", lojaId, "opcoes", "Esfiha");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setForm({ name: "", description: "", image: "", sizes: [], prices: {}, available: true, categoria: "tradicional", adicionais: [] });
    setEditingIdx(null);
  }

  const categorias = ["tradicional", "especial", "doce"];
  const esfihasPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-12 font-sans pb-20">
      <div ref={formRef}>
      <FormProduto form={form} setForm={setForm} resetForm={resetForm}
        editingIdx={editingIdx} docData={docData} setDocData={setDocData} saveDocData={saveDocData} />
      </div>

      <section className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="bg-emerald-900 px-6 py-5 border-b border-emerald-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-emerald-50 flex items-center gap-2 uppercase tracking-tighter">🥙 Gestão de Esfihas</h3>
        </div>

        <div className="p-6 space-y-12">
          {esfihasPorCategoria.map(({ nome, itens }) => (
            <div key={nome} className="space-y-5">
              <h4 className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-emerald-600/70">
                {nome === "tradicional" && "🧂 Tradicionais"}
                {nome === "especial" && "👑 Especiais"}
                {nome === "doce" && "🍯 Delícias Doces"}
                <span className="h-[1px] flex-1 bg-emerald-50"></span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {itens.length > 0 ? itens.map((p) => {
                  const realIdx = docData.produtos.indexOf(p);
                  return (
                    <div key={p.id || realIdx} className={`flex flex-col sm:flex-row gap-5 p-4 rounded-2xl border transition-all duration-300 ${!p.available ? "bg-stone-50 border-stone-100 opacity-60" : "bg-white border-stone-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"}`}>
                      <img src={p.image || "https://via.placeholder.com/120"} alt={p.name}
                        className="w-full sm:w-28 h-28 rounded-xl object-cover border border-stone-50" />

                      <div className="flex-1">
                        <h4 className="font-black text-stone-800 text-lg leading-tight">{p.name}</h4>
                        <p className="text-sm text-stone-500 mt-1 line-clamp-2">{p.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {p.sizes?.map((s) => (
                            <div key={s} className="px-3 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-600">
                              {s}: <span className="text-emerald-600 font-black text-xs ml-1">R$ {parsePreco(p.prices[s]).toFixed(2).replace(".", ",")}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 justify-end items-center border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-50">
                        <BotoesAcao
                formRef={formRef}
                          disponivel={p.available}
                          onEditar={() => { setForm({ ...p, categoria: "Esfiha" }); setEditingIdx(realIdx); }}
                          onToggle={() => { const next = { ...docData }; next.produtos[realIdx] = { ...p, available: !p.available }; saveDocData(next); }}
                          onExcluir={() => { if (confirm(`Remover "${p.name}" permanentemente?`)) { const next = { ...docData, produtos: docData.produtos.filter((_, i) => i !== realIdx) }; saveDocData(next); } }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-8 text-center bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-100 text-stone-400 text-xs font-bold uppercase tracking-widest">
                    Nenhum item em {nome}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
            <h2 className="font-black text-stone-800 text-sm uppercase tracking-widest">🧂 Complementos de Esfiha</h2>
          </div>
          <div className="p-6">
            <OptionList items={docData.adicionais}
              onChange={(items) => { const next = { ...docData, adicionais: items }; saveDocData(next); }} />
          </div>
        </div>
      </section>
    </div>
  );
}

function OptionList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome.trim() || !novo.preco) return;
    onChange([...items, { ...novo, preco: parsePreco(novo.preco), id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-transparent hover:bg-white hover:border-emerald-100 transition-all group">
            <span className="text-sm font-bold text-stone-700">{item.nome} <span className="ml-2 text-emerald-600 font-black">+ R$ {Number(item.preco).toFixed(2).replace(".", ",")}</span></span>
            <button onClick={() => onChange(items.filter((i) => i.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors font-bold text-xs uppercase">Remover</button>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-stone-100 grid grid-cols-1 gap-2">
        <input placeholder="Ex: Limão Extra" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="h-11 bg-stone-50 rounded-xl px-4 border-2 border-transparent focus:bg-white focus:border-emerald-200 outline-none text-sm transition-all" />
        <div className="flex gap-2">
          <input placeholder="Preço R$" value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
            className="flex-1 h-11 bg-stone-50 rounded-xl px-4 border-2 border-transparent focus:bg-white focus:border-emerald-200 outline-none text-sm font-bold" />
          <button onClick={addItem} className="px-6 bg-emerald-700 text-white rounded-xl font-black text-xs hover:bg-emerald-800 transition-all uppercase tracking-tighter shadow-lg shadow-emerald-900/10">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}