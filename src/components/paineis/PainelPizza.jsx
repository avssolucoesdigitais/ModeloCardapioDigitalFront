import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

export default function PainelPizza() {
  const [docData, setDocData] = useState({ produtos: [], bordas: [], adicionais: [] });
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "",
  });
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Pizza");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Pizza");
    await setDoc(ref, next, { merge: true });
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      image: "",
      sizes: [],
      prices: {},
      available: true,
      categoria: "",
    });
    setEditingIdx(null);
  }

  const categorias = ["tradicional", "especial", "doce"];
  const pizzasPorCategoria = categorias.map((cat) => ({
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

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            🍕 Pizzas no Cardápio
          </h3>
        </div>

        <div className="p-6 space-y-10">
          {pizzasPorCategoria.map(({ nome, itens }) => (
            <div key={nome} className="space-y-4">
              <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-indigo-500">
                <span className="h-px flex-1 bg-indigo-100"></span>
                {nome === "tradicional" && "Pizzas Tradicionais"}
                {nome === "especial" && "Pizzas Especiais"}
                {nome === "doce" && "Pizzas Doces"}
                <span className="h-px flex-1 bg-indigo-100"></span>
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
                            : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={p.image || "https://via.placeholder.com/100"}
                            alt={p.name}
                            className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shadow-sm"
                          />
                          {!p.available && (
                             <span className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl text-white font-black text-xs">OFF</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-gray-900 text-lg leading-tight truncate">{p.name}</h5>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {p.sizes?.map((s) => (
                              <span key={s} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[11px] font-bold border border-gray-200">
                                {s}: <span className="text-indigo-600">R$ {Number(String(p.prices[s]).replace(",",".").replace(/[^\d.]/g, "") || 0).toFixed(2)}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                          <button
                            onClick={() => { setForm({ ...p, category: "Pizza" }); setEditingIdx(realIdx); window.scrollTo({top:0, behavior:'smooth'}); }}
                            className="flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            title="Editar"
                          >
                            ✏️ <span className="md:hidden ml-2 font-bold text-sm text-amber-700">Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              const updated = { ...p, available: !p.available };
                              const next = { ...docData };
                              next.produtos[realIdx] = updated;
                              saveDocData(next); setDocData(next);
                            }}
                            className={`flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-colors ${p.available ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400'}`}
                            title={p.available ? "Pausar Vendas" : "Ativar Vendas"}
                          >
                            {p.available ? "✔" : "✖"} <span className="md:hidden ml-2 font-bold text-sm text-gray-500">{p.available ? 'Pausar' : 'Ativar'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Excluir pizza permanentemente?")) {
                                const next = { ...docData, produtos: docData.produtos.filter((_, i) => i !== realIdx) };
                                saveDocData(next); setDocData(next);
                              }
                            }}
                            className="flex-1 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            🗑️ <span className="md:hidden ml-2 font-bold text-sm text-red-700">Excluir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 px-6 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-sm">Nenhum item em {nome}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção Bordas e Adicionais Lado a Lado no Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SimpleItemSection
          title="🥖 Bordas Recheadas"
          items={docData.bordas}
          color="amber"
          onChange={(items) => {
            const next = { ...docData, bordas: items };
            setDocData(next); saveDocData(next);
          }}
        />

        <SimpleItemSection
          title="🧀 Adicionais Extras"
          items={docData.adicionais}
          color="blue"
          onChange={(items) => {
            const next = { ...docData, adicionais: items };
            setDocData(next); saveDocData(next);
          }}
        />
      </div>
    </div>
  );
}

function SimpleItemSection({ title, items, onChange, color }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });
  const colors = {
    amber: "bg-amber-50 text-amber-700 border-amber-100 focus:ring-amber-500",
    blue: "bg-blue-50 text-blue-700 border-blue-100 focus:ring-blue-500"
  };

  function addItem() {
    if (!novo.nome.trim()) return;
    const precoNormalizado = parseFloat(String(novo.preco).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
    onChange([...items, { nome: novo.nome, preco: precoNormalizado, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="font-black text-gray-800 tracking-tight">{title}</h2>
        <span className="text-[10px] font-black bg-white px-2 py-1 rounded-full border border-gray-200 text-gray-400">{items.length} ITENS</span>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-2 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
          {items.map((item) => (
            <div key={item.id} className="group flex items-center justify-between border border-gray-50 rounded-xl p-3 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">{item.nome}</span>
                <span className={`text-xs font-black ${color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`}>
                  + R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <button
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-6 text-xs text-gray-400 italic">Lista vazia</p>}
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
          <input
            placeholder="Nome (ex: Catupiry)"
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            className="w-full h-11 border-2 border-gray-50 rounded-xl px-4 bg-gray-50 focus:bg-white focus:border-gray-200 outline-none transition-all text-sm font-medium"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
              <input
                placeholder="0,00"
                value={novo.preco}
                onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
                className="w-full h-11 border-2 border-gray-50 rounded-xl pl-8 pr-4 bg-gray-50 focus:bg-white focus:border-gray-200 outline-none transition-all text-sm font-bold"
              />
            </div>
            <button
              onClick={addItem}
              className="px-6 bg-gray-900 text-white rounded-xl font-black text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-lg shadow-gray-200"
            >
              ADC
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}