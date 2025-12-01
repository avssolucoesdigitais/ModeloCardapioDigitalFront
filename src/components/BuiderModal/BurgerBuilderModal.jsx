import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
const MotionDiv = motion.div;


/* ======================================================
   MODAL DE MONTAGEM DE HAMBÚRGUER (igual ao do Pastel)
   ====================================================== */
export default function HamburguerBuilderModal({
  open,
  onClose,
  baseProduct,
  onAdd,
}) {
  const [step, setStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  const sizes = Object.keys(baseProduct?.prices || {});
  const extras = useMemo(() => baseProduct?.adicionais || [], [baseProduct]);

  const precoBase = Number(baseProduct?.prices?.[selectedSize] || 0);
  const precoAddons = selectedAddons.reduce((acc, nome) => {
    const addon = extras.find((a) => a.nome === nome);
    return acc + Number(addon?.preco || 0);
  }, 0);
  const total = (precoBase + precoAddons) * qty;

  /* ---------- Efeitos ---------- */
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedSize("");
    setSelectedAddons([]);
    setQty(1);
  }, [open]);

  if (!open || !baseProduct) return null;

  /* ---------- Manipuladores ---------- */
  const handleToggleAddon = (nome) => {
    setSelectedAddons((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  };

  const handleConfirm = () => {
    if (!selectedSize) return alert("Escolha um tamanho para o hambúrguer!");

    const item = {
      id: `hamb-${Date.now()}`,
      name: `Hambúrguer ${baseProduct.name}`,
      size: selectedSize,
      addons: extras.filter((a) => selectedAddons.includes(a.nome)),
      qty,
      price: total,
      image: baseProduct.image,
      category: "Hamburguer",
    };

    onAdd(item);
    onClose();
  };

  const StepBadge = ({ idx, label }) => (
    <div
      className={`flex items-center gap-2 ${
        step === idx ? "font-semibold text-yellow-600" : "text-gray-500"
      }`}
    >
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
          step === idx ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-600"
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
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <MotionDiv
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
                Montar Hambúrguer
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <StepBadge idx={1} label="Tamanho" />
              <StepBadge idx={2} label="Adicionais" />
              <StepBadge idx={3} label="Quantidade" />
              <StepBadge idx={4} label="Resumo" />
            </div>

            {/* Conteúdo dinâmico */}
            <div className="space-y-4">
              {step === 1 && (
                <StepTamanho
                  sizes={sizes}
                  selectedSize={selectedSize}
                  setSelectedSize={setSelectedSize}
                  prices={baseProduct.prices}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <StepAddons
                  extras={extras}
                  selectedAddons={selectedAddons}
                  handleToggleAddon={handleToggleAddon}
                  onPrev={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <StepQuantidade
                  qty={qty}
                  setQty={setQty}
                  onPrev={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}

              {step === 4 && (
                <StepResumo
                  baseProduct={baseProduct}
                  selectedSize={selectedSize}
                  selectedAddons={selectedAddons}
                  precoBase={precoBase}
                  precoAddons={precoAddons}
                  total={total}
                  qty={qty}
                  onPrev={() => setStep(3)}
                  onConfirm={handleConfirm}
                />
              )}
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}

/* ======================================================
   SUBCOMPONENTES (Steps)
   ====================================================== */

function StepTamanho({ sizes, selectedSize, setSelectedSize, prices, onNext }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Escolha o tamanho</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectedSize === size
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {size} — R$ {Number(prices[size]).toFixed(2)}
          </button>
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={!selectedSize}
        className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50"
      >
        Próximo
      </button>
    </div>
  );
}

function StepAddons({ extras, selectedAddons, handleToggleAddon, onPrev, onNext }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">
        Escolha os adicionais
      </h3>
      {extras.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {extras.map((a, idx) => (
            <label
              key={idx}
              className={`px-3 py-1 border rounded-full cursor-pointer text-sm font-medium transition-all ${
                selectedAddons.includes(a.nome)
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedAddons.includes(a.nome)}
                onChange={() => handleToggleAddon(a.nome)}
              />
              {a.nome} (+R$ {Number(a.preco).toFixed(2)})
            </label>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">
          Nenhum adicional disponível.
        </p>
      )}

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 border rounded-lg px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 bg-yellow-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-yellow-600"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepQuantidade({ qty, setQty, onPrev, onNext }) {
  return (
    <div className="text-center">
      <h3 className="font-semibold mb-3 text-gray-900">
        Escolha a quantidade
      </h3>

      <div className="flex justify-center items-center gap-4 my-6">
        <button
          className="w-10 h-10 border rounded-full text-lg font-bold"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          -
        </button>
        <span className="font-semibold text-lg">{qty}</span>
        <button
          className="w-10 h-10 border rounded-full text-lg font-bold"
          onClick={() => setQty((q) => q + 1)}
        >
          +
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 border rounded-lg px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 bg-yellow-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-yellow-600"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepResumo({
  baseProduct,
  selectedSize,
  selectedAddons,
  precoBase,
  precoAddons,
  total,
  qty,
  onPrev,
  onConfirm,
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Resumo do Pedido</h3>
      <div className="text-sm text-gray-700 space-y-1">
        <p>
          <strong>Produto:</strong> {baseProduct.name}
        </p>
        <p>
          <strong>Tamanho:</strong> {selectedSize}
        </p>
        {selectedAddons.length > 0 && (
          <p>
            <strong>Adicionais:</strong> {selectedAddons.join(", ")}
          </p>
        )}
        <p>
          <strong>Preço base:</strong> R$ {precoBase.toFixed(2)}
        </p>
        <p>
          <strong>Adicionais:</strong> R$ {precoAddons.toFixed(2)}
        </p>
        <p>
          <strong>Quantidade:</strong> {qty}
        </p>
        <p className="font-bold text-lg text-gray-900 mt-2">
          Total: R$ {total.toFixed(2)}
        </p>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 border rounded-lg px-3 py-2"
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
