import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Pizza } from "lucide-react";

/* --- Helper de Formatação (Mantendo seu padrão) --- */
const formatBRL = (val) => 
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PizzaBuilderModal({ open, onClose, products, baseProduct, onAdd, preset }) {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState("");
  const [tipo, setTipo] = useState("inteira");
  const [sabores, setSabores] = useState([]);
  const [selectedBorda, setSelectedBorda] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  /* ---------- Lógica de Dados ---------- */
  const pizzas = useMemo(() => 
    products.filter(p => p.category?.toLowerCase() === "pizza" && p.available !== false), 
  [products]);

  const extras = useMemo(() => {
    const arr = [...(baseProduct?.adicionais || []), ...sabores.flatMap(s => s.adicionais || [])];
    const map = new Map();
    arr.forEach(a => map.set(a.nome, a));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const bordas = useMemo(() => {
    let arr = baseProduct?.bordas || [];
    sabores.forEach(s => arr = [...arr, ...(s.bordas || [])]);
    const map = new Map();
    arr.forEach(b => map.set(b.nome, b));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const total = useMemo(() => {
    if (!size || sabores.length === 0) return 0;
    let base = 0;
    if (tipo === "meio" && sabores.length > 1) {
      base = sabores.reduce((a, b) => a + Number(b.prices?.[size] || 0), 0) / 2;
    } else {
      base = Number(sabores[0]?.prices?.[size] || 0);
    }
    const addonsTotal = selectedAddons.reduce((acc, nome) => {
      const addon = extras.find(a => a.nome === nome);
      return acc + Number(addon?.preco || 0);
    }, 0);
    const bordaTotal = selectedBorda ? Number(selectedBorda.preco || 0) : 0;
    return (base + addonsTotal + bordaTotal) * qty;
  }, [size, sabores, tipo, selectedAddons, selectedBorda, qty, extras]);

  /* ---------- Efeitos de Reset ---------- */
  useEffect(() => {
    if (!open) return;
    setStep(1); setTipo("inteira"); setSabores([]); setSelectedBorda(null);
    setSelectedAddons([]); setQty(1);
    const keys = Object.keys(baseProduct?.prices || {});
    setSize(preset?.size || (keys.length === 1 ? keys[0] : ""));
  }, [open, baseProduct, preset]);

  useEffect(() => {
    if (!open) return;
    const initialId = preset?.firstFlavorId ?? baseProduct?.id;
    const first = pizzas.find(p => p.id === initialId) || baseProduct;
    if (first) setSabores([first]);
  }, [open, pizzas, preset, baseProduct]);

  if (!open || !baseProduct) return null;

  const handleToggleSabor = (sabor) => {
    if (tipo === "inteira") return setSabores([sabor]);
    const exists = sabores.find(s => s.id === sabor.id);
    if (exists) {
      if (sabores.length > 1) setSabores(sabores.filter(s => s.id !== sabor.id));
      return;
    }
    if (sabores.length < 2) setSabores([...sabores, sabor]);
  };

  const handleConfirm = () => {
    onAdd({
      id: `pizza-${Date.now()}`,
      name: tipo === "inteira" ? sabores[0].name : sabores.map(s => `1/2 ${s.name}`).join(" + "),
      flavors: sabores.map(s => tipo === "meio" ? `1/2 ${s.name}` : s.name),
      size, qty, price: total,
      addons: extras.filter(a => selectedAddons.includes(a.nome)),
      crust: selectedBorda,
      image: sabores[0]?.image || baseProduct.image,
      category: "Pizza"
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          className="w-full max-w-2xl bg-gray-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* HEADER FIXO */}
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Pizza className="text-orange-500" /> Customizar Pizza
              </h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            {/* Stepper Barras */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-orange-500" : "bg-gray-100"}`} />
              ))}
            </div>
          </div>

          {/* CONTEÚDO (SCROLL) */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {step === 1 && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">1. Escolha o Tamanho</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(baseProduct.prices || {}).map(([s, val]) => (
                          <button key={s} onClick={() => setSize(s)} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${size === s ? "border-orange-500 bg-orange-50 ring-4 ring-orange-50" : "border-white bg-white shadow-sm"}`}>
                            <span className="font-bold text-gray-700">{s}</span>
                            <span className="text-orange-600 font-black">{formatBRL(val)}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">2. Formato</h3>
                      <div className="flex gap-3">
                        {["inteira", "meio"].map(t => (
                          <button key={t} onClick={() => setTipo(t)} className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${tipo === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-transparent shadow-sm"}`}>
                            {t === "inteira" ? "Inteira" : "Meio a Meio"}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-4">
                      <p className="text-orange-700 text-sm font-bold">
                        {tipo === "inteira" ? "Selecione o sabor:" : `Selecione 2 sabores (${sabores.length}/2):`}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {pizzas.map(pz => {
                        const isSelected = sabores.some(s => s.id === pz.id);
                        const priceForSize = pz.prices?.[size];
                        if (!priceForSize) return null;
                        return (
                          <button key={pz.id} onClick={() => handleToggleSabor(pz)} className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${isSelected ? "border-orange-500 bg-white shadow-md ring-4 ring-orange-50" : "border-transparent bg-white shadow-sm hover:border-gray-200"}`}>
                            <img src={pz.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-gray-800 leading-tight">{pz.name}</h4>
                              <p className="text-[10px] text-gray-400 line-clamp-1">{pz.description}</p>
                              <p className="text-sm font-black text-orange-600 mt-1">{formatBRL(priceForSize)}</p>
                            </div>
                            {isSelected && <div className="bg-orange-500 text-white p-1 rounded-full"><Check size={14} /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Escolha a Borda</h3>
                    <div className="grid gap-3">
                      <button onClick={() => setSelectedBorda(null)} className={`p-4 rounded-2xl border-2 text-left font-bold ${!selectedBorda ? "border-orange-500 bg-orange-50" : "bg-white border-transparent shadow-sm"}`}>Borda Tradicional</button>
                      {bordas.map((b, i) => (
                        <button key={i} onClick={() => setSelectedBorda(b)} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${selectedBorda?.nome === b.nome ? "border-orange-500 bg-orange-50" : "bg-white border-transparent shadow-sm"}`}>
                          <span className="font-bold text-gray-700">{b.nome}</span>
                          <span className="text-orange-600 font-bold">{Number(b.preco) > 0 ? `+ ${formatBRL(b.preco)}` : "Grátis"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Deseja Adicionais?</h3>
                    <div className="grid gap-3">
                      {extras.map((a, i) => {
                        const isSelected = selectedAddons.includes(a.nome);
                        return (
                          <button key={i} onClick={() => setSelectedAddons(prev => isSelected ? prev.filter(n => n !== a.nome) : [...prev, a.nome])} className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${isSelected ? "border-orange-500 bg-orange-50" : "bg-white border-transparent shadow-sm"}`}>
                            <span className="font-bold text-gray-700">{a.nome}</span>
                            <span className="text-orange-600 font-bold">+ {formatBRL(a.preco)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                      <h3 className="font-black text-gray-900 text-lg mb-4 border-b pb-2 text-center">Resumo da Pizza</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-400">Tamanho:</span><span className="font-bold text-gray-700">{size}</span></div>
                        <div className="flex justify-between text-sm items-start"><span className="text-gray-400">Sabores:</span><span className="font-bold text-gray-700 text-right">{sabores.map(s => s.name).join(" / ")}</span></div>
                        {selectedBorda && <div className="flex justify-between text-sm"><span className="text-gray-400">Borda:</span><span className="font-bold text-gray-700">{selectedBorda.nome}</span></div>}
                        {selectedAddons.length > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">Extras:</span><span className="font-bold text-gray-700">{selectedAddons.join(", ")}</span></div>}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                        <button className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center font-bold text-xl" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                        <span className="w-12 text-center font-black text-lg">{qty}</span>
                        <button className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center font-bold text-xl" onClick={() => setQty(q => q + 1)}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* FOOTER FIXO */}
          <div className="p-6 bg-white border-t flex items-center justify-between gap-4">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="p-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"><ChevronLeft /></button>
            ) : <div className="w-10" />}

            <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Subtotal</span>
              <span className="text-2xl font-black text-gray-900 leading-none">{formatBRL(total)}</span>
            </div>

            <button 
              disabled={(step === 1 && !size) || (step === 2 && ((tipo === "inteira" && sabores.length < 1) || (tipo === "meio" && sabores.length < 2)))}
              onClick={step === 5 ? handleConfirm : () => setStep(s => s + 1)}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-200 transition-all flex items-center gap-2 active:scale-95"
            >
              {step === 5 ? "ADICIONAR" : "PRÓXIMO"} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}