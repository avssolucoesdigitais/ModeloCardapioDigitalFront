import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/* ======================================================
   MODAL DE MONTAGEM DE PIZZA
   ====================================================== */
export default function PizzaBuilderModal({
  open,
  onClose,
  products,
  baseProduct,
  onAdd,
  preset, // { size?: string, firstFlavorId?: string }
}) {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState("");
  const [tipo, setTipo] = useState("inteira");
  const [sabores, setSabores] = useState([]);
  const [selectedBorda, setSelectedBorda] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  /* ---------- Listas calculadas ---------- */
  const pizzas = useMemo(
    () =>
      products.filter(
        (p) => p.category?.toLowerCase() === "pizza" && p.available !== false
      ),
    [products]
  );

  const extras = useMemo(() => {
    const arr = [
      ...(baseProduct?.adicionais || []),
      ...sabores.flatMap((s) => s.adicionais || []),
    ];
    const map = new Map();
    arr.forEach((a) => map.set(a.nome, a));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const bordas = useMemo(() => {
    let arr = baseProduct?.bordas || [];
    sabores.forEach((s) => (arr = [...arr, ...(s.bordas || [])]));
    const map = new Map();
    arr.forEach((b) => map.set(b.nome, b));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const precoBase = useMemo(() => {
    if (!size || sabores.length === 0) return 0;
    if (tipo === "meio" && sabores.length > 1) {
      const prices = sabores.map((s) => Number(s.prices?.[size] || 0));
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    return Number(sabores[0]?.prices?.[size] || 0);
  }, [size, sabores, tipo]);

  const precoAddons = selectedAddons.reduce((acc, nome) => {
    const addon = extras.find((a) => a.nome === nome);
    return acc + Number(addon?.preco || 0);
  }, 0);

  const precoBorda = selectedBorda ? Number(selectedBorda.preco || 0) : 0;
  const total = (precoBase + precoAddons + precoBorda) * qty;

  /* ---------- Efeitos ---------- */
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTipo("inteira");
    setSabores([]);
    setSelectedBorda(null);
    setSelectedAddons([]);
    setQty(1);

    const keys = Object.keys(baseProduct?.prices || {});
    const onlyOne = keys.length === 1 ? keys[0] : "";
    const presetSize =
      preset?.size && keys.includes(preset.size) ? preset.size : "";
    setSize(presetSize || onlyOne || "");
  }, [open, baseProduct, preset]);

  useEffect(() => {
    if (!open) return;
    const initialFlavorId = preset?.firstFlavorId ?? baseProduct?.id ?? null;
    if (initialFlavorId) {
      const first = pizzas.find((p) => p.id === initialFlavorId) || baseProduct;
      if (first) setSabores([first]);
    }
  }, [open, pizzas, preset, baseProduct]);

  if (!open || !baseProduct) return null;

  const pinnedFirstId =
    tipo === "meio" ? (preset?.firstFlavorId ?? baseProduct?.id ?? null) : null;

  /* ---------- Manipuladores ---------- */
  const handleToggleSabor = (sabor) => {
    if (tipo === "inteira") {
      setSabores([sabor]);
      return;
    }

    const exists = sabores.find((s) => s.id === sabor.id);
    if (exists) {
      if (pinnedFirstId && sabor.id === pinnedFirstId) return;
      setSabores(sabores.filter((s) => s.id !== sabor.id));
      return;
    }

    if (sabores.length >= 2) {
      alert("Você só pode escolher 2 sabores no meio a meio.");
      return;
    }

    setSabores([...sabores, sabor]);
  };

  const handleConfirm = () => {
    if (!size) return alert("Escolha um tamanho!");
    if (tipo === "inteira" && sabores.length !== 1)
      return alert("Escolha 1 sabor!");
    if (tipo === "meio" && sabores.length < 2)
      return alert("Escolha os 2 sabores!");

    const item = {
      id: `pizza-${tipo}-${Date.now()}`,
      name:
        tipo === "inteira"
          ? sabores[0].name
          : sabores.map((s) => `1/2 ${s.name}`).join(" + "),
      flavors:
        tipo === "meio"
          ? sabores.map((s) => `1/2 ${s.name}`)
          : sabores.map((s) => s.name),
      size,
      qty,
      price: total,
      addons: extras.filter((a) => selectedAddons.includes(a.nome)),
      crust: selectedBorda
        ? { nome: selectedBorda.nome, preco: precoBorda }
        : null,
      image: sabores[0]?.image || baseProduct.image,
      category: "Pizza",
    };

    onAdd(item);
    onClose();
  };

  const StepBadge = ({ idx, label }) => (
    <div
      className={`flex items-center gap-2 ${
        step === idx ? "font-semibold text-blue-600" : "text-gray-500"
      }`}
    >
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
          step === idx
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {idx}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );

  /* ======================================================
     UI
     ====================================================== */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl 
                      max-h-[85vh] overflow-y-auto p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Montar Pizza
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
              <StepBadge idx={1} label="Tamanho" />
              <StepBadge idx={2} label="Sabores" />
              <StepBadge idx={3} label="Borda" />
              <StepBadge idx={4} label="Adicionais" />
              <StepBadge idx={5} label="Resumo" />
            </div>

            {/* Conteúdo dinâmico */}
            <div className="space-y-4">
              {step === 1 && (
                <StepTamanho
                  size={size}
                  setSize={setSize}
                  tipo={tipo}
                  setTipo={setTipo}
                  baseProduct={baseProduct}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <StepSabores
                  pizzas={pizzas}
                  tipo={tipo}
                  pinnedFirstId={pinnedFirstId}
                  sabores={sabores}
                  size={size}
                  onToggle={handleToggleSabor}
                  onPrev={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <StepBorda
                  bordas={bordas}
                  selected={selectedBorda}
                  setSelected={setSelectedBorda}
                  onPrev={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}

              {step === 4 && (
                <StepAddons
                  extras={extras}
                  selectedAddons={selectedAddons}
                  setSelectedAddons={setSelectedAddons}
                  onPrev={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              )}

              {step === 5 && (
                <StepResumo
                  size={size}
                  tipo={tipo}
                  sabores={sabores}
                  selectedBorda={selectedBorda}
                  selectedAddons={selectedAddons}
                  total={total}
                  qty={qty}
                  setQty={setQty}
                  onPrev={() => setStep(4)}
                  onConfirm={handleConfirm}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ======================================================
   Subcomponentes (Steps)
   ====================================================== */

function StepTamanho({ size, setSize, tipo, setTipo, baseProduct, onNext }) {
  return (
    <div>
      <select
        className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      >
        <option value="">Escolha o tamanho</option>
        {Object.entries(baseProduct.prices || {}).map(([s, val]) => (
          <option key={s} value={s}>
            {s} — R$ {Number(val).toFixed(2)}
          </option>
        ))}
      </select>

      <div className="flex gap-3 mb-4">
        {["inteira", "meio"].map((t) => (
          <label
            key={t}
            className={`flex-1 text-center border rounded-lg py-2 cursor-pointer font-medium transition ${
              tipo === t
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              checked={tipo === t}
              onChange={() => setTipo(t)}
            />
            {t === "inteira" ? "Inteira" : "Meio a Meio"}
          </label>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!size}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        Próximo
      </button>
    </div>
  );
}

function StepSabores({
  pizzas,
  tipo,
  pinnedFirstId,
  sabores,
  size,
  onToggle,
  onPrev,
  onNext,
}) {
  return (
    <div>
      <h3 className="font-semibold mb-2 text-gray-900">
        {tipo === "inteira"
          ? "Escolha o sabor"
          : "Escolha os 2 sabores (meio a meio)"}
      </h3>

      <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
        {pizzas.map((pz) => {
          const preco = pz.prices?.[size];
          if (!preco) return null;

          const selected = sabores.some((s) => s.id === pz.id);
          const isPinned = tipo === "meio" && pinnedFirstId === pz.id;

          return (
            <label
              key={pz.id}
              className={`flex items-center justify-between gap-2 p-2 cursor-pointer ${
                selected ? "bg-blue-50" : "hover:bg-gray-50"
              } ${isPinned ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type={tipo === "inteira" ? "radio" : "checkbox"}
                  checked={selected}
                  disabled={isPinned}
                  onChange={() => onToggle(pz)}
                />
                <span className="text-gray-800">{pz.name}</span>
              </div>
              <span className="text-sm text-gray-600">
                R$ {Number(preco).toFixed(2)}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={onPrev} className="flex items-center gap-1 border rounded-lg px-3 py-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          disabled={
            (tipo === "inteira" && sabores.length < 1) ||
            (tipo === "meio" && sabores.length < 2)
          }
          className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepBorda({ bordas, selected, setSelected, onPrev, onNext }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Escolha a borda</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <label
          className={`px-3 py-1 border rounded-full cursor-pointer ${
            !selected ? "bg-blue-50 border-blue-300" : ""
          }`}
        >
          <input
            type="radio"
            className="hidden"
            checked={!selected}
            onChange={() => setSelected(null)}
          />
          Sem borda
        </label>
        {bordas.map((b, idx) => (
          <label
            key={idx}
            className={`px-3 py-1 border rounded-full cursor-pointer ${
              selected?.nome === b.nome
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              checked={selected?.nome === b.nome}
              onChange={() => setSelected(b)}
            />
            {b.nome} (
            {Number(b.preco) > 0
              ? `+R$ ${Number(b.preco).toFixed(2)}`
              : "Grátis"}
            )
          </label>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="border rounded-lg px-3 py-2 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 font-semibold hover:bg-blue-700"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepAddons({ extras, selectedAddons, setSelectedAddons, onPrev, onNext }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Adicionais</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {extras.map((a, idx) => (
          <label
            key={idx}
            className={`px-3 py-1 border rounded-full cursor-pointer ${
              selectedAddons.includes(a.nome)
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={selectedAddons.includes(a.nome)}
              onChange={() =>
                setSelectedAddons((prev) =>
                  prev.includes(a.nome)
                    ? prev.filter((n) => n !== a.nome)
                    : [...prev, a.nome]
                )
              }
            />
            {a.nome} (+R$ {Number(a.preco).toFixed(2)})
          </label>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="border rounded-lg px-3 py-2 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 font-semibold hover:bg-blue-700"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepResumo({
  size,
  tipo,
  sabores,
  selectedBorda,
  selectedAddons,
  total,
  qty,
  setQty,
  onPrev,
  onConfirm,
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Resumo do Pedido</h3>
      <div className="text-sm text-gray-700 space-y-1">
        <p><strong>Tamanho:</strong> {size}</p>
        <p>
          <strong>Sabores:</strong>{" "}
          {tipo === "meio"
            ? sabores.map((s) => `1/2 ${s.name}`).join(" + ")
            : sabores.map((s) => s.name).join(" + ")}
        </p>
        {selectedBorda && (
          <p>
            <strong>Borda:</strong> {selectedBorda.nome} (
            {Number(selectedBorda.preco) > 0
              ? `+R$ ${Number(selectedBorda.preco).toFixed(2)}`
              : "Grátis"}
            )
          </p>
        )}
        {selectedAddons.length > 0 && (
          <p>
            <strong>Adicionais:</strong> {selectedAddons.join(", ")}
          </p>
        )}
      </div>

      <p className="font-bold text-lg text-gray-900 mt-3">
        Total: R$ {total.toFixed(2)}
      </p>

      <div className="flex items-center justify-center gap-4 my-4">
        <button
          className="w-8 h-8 border rounded-full text-lg"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          -
        </button>
        <span className="font-semibold">{qty}</span>
        <button
          className="w-8 h-8 border rounded-full text-lg"
          onClick={() => setQty((q) => q + 1)}
        >
          +
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="border rounded-lg px-3 py-2 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold flex items-center gap-1"
        >
          Confirmar Pedido
        </button>
      </div>
    </div>
  );
}
