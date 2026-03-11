import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço
function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function PainelCalzone({ lojaId }) {
  const [docData, setDocData] = useState({
    produtos: [],
    bases: [],
    bordas: [],
    adicionais: [],
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "calzone",
  });

  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "lojas", lojaId, "opcoes", "Calzone");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "lojas", lojaId, "opcoes", "Calzone");
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
      categoria: "calzone",
    });
    setEditingIdx(null);
  }

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

      {/* Listagem de Calzones */}
      <section className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="bg-amber-600 px-6 py-5 flex justify-between items-center text-white">
          <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
            🥟 Calzones no Cardápio
          </h3>
          <span className="bg-amber-900/20 px-3 py-1 rounded-full text-xs font-bold">
            {docData.produtos?.length || 0} Itens
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {docData.produtos?.length > 0 ? (
              docData.produtos.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className={`group flex flex-col md:flex-row gap-5 p-5 rounded-2xl border transition-all ${
                    !p.available 
                      ? "bg-stone-50 border-stone-100 opacity-60" 
                      : "bg-white border-orange-50 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-900/5"
                  }`}
                >
                  <img
                    src={p.image || "https://via.placeholder.com/150"}
                    alt={p.name}
                    className="w-full md:w-32 h-32 rounded-2xl object-cover border border-orange-50 group-hover:rotate-1 transition-transform"
                  />

                  <div className="flex-1">
                    <h4 className="font-black text-stone-800 text-xl">{p.name}</h4>
                    <p className="text-sm text-stone-500 mt-1">{p.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {p.sizes?.map((s) => (
                        <span key={s} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-black border border-amber-100">
                          {s.toUpperCase()} • R$ {parsePreco(p.prices[s]).toFixed(2).replace(".", ",")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-orange-50">
                    <button
                      onClick={() => { setForm({ ...p, categoria: "calzone" }); setEditingIdx(idx); window.scrollTo({top:0, behavior:'smooth'}); }}
                      className="flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        const updated = { ...p, available: !p.available };
                        const next = { ...docData };
                        next.produtos[idx] = updated;
                        saveDocData(next);
                      }}
                      className={`flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all ${p.available ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-stone-200 text-stone-500'}`}
                    >
                      {p.available ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir ${p.name}?`)) {
                          const next = { ...docData, produtos: docData.produtos.filter((_, i) => i !== idx) };
                          saveDocData(next);
                        }
                      }}
                      className="flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-stone-400 font-medium italic border-2 border-dashed border-stone-100 rounded-2xl">
                Nenhum calzone encontrado.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Configurações Extras (Bases, Bordas, Adicionais) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExtraSection 
          title="🍞 Bases" 
          items={docData.bases} 
          icon="amber"
          onSave={(items) => saveDocData({ ...docData, bases: items })} 
        />
        <ExtraSection 
          title="🥖 Bordas" 
          items={docData.bordas} 
          icon="orange"
          onSave={(items) => saveDocData({ ...docData, bordas: items })} 
        />
        <ExtraSection 
          title="🧀 Adicionais" 
          items={docData.adicionais} 
          icon="yellow"
          onSave={(items) => saveDocData({ ...docData, adicionais: items })} 
        />
      </div>
    </div>
  );
}

function ExtraSection({ title, items = [], onSave, icon }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden h-fit">
      <div className={`px-5 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between`}>
        <h4 className="font-black text-stone-700 text-xs uppercase tracking-widest">{title}</h4>
      </div>
      <div className="p-5">
        <ItemList items={items} onChange={onSave} />
      </div>
    </div>
  );
}

function ItemList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome.trim()) return;
    onChange([...items, { ...novo, preco: parsePreco(novo.preco), id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl group transition-colors hover:bg-amber-50">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-700">{item.nome}</span>
              <span className="text-[10px] font-black text-amber-600">+ R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}</span>
            </div>
            <button 
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 transition-all text-xs font-bold uppercase"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="w-full h-10 px-4 bg-stone-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all"
        />
        <div className="flex gap-2">
          <input
            placeholder="R$ 0,00"
            value={novo.preco}
            onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
            className="flex-1 h-10 px-4 bg-stone-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all"
          />
          <button
            onClick={addItem}
            className="px-4 bg-stone-800 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all uppercase"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}