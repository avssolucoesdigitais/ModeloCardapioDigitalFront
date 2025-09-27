import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// Helper to parse price
function parsePreco(preco) {
  if (typeof preco === "number") {
    return preco;
  }

  if (typeof preco === "string") {
    return parseFloat(preco.replace(",", "."));
  }

  return 0; // Default value if not a number or string
}

export default function HotDogBuilderModal({
  open,
  onClose,
  baseProduct,
  onAdd,
  preset,
}) {
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);

  const precoBase = selectedSize ? parsePreco(baseProduct?.prices?.[selectedSize]) : 0;

  const extras = useMemo(() => {
    const arr = baseProduct?.adicionais || [];
    const map = new Map();
    arr.forEach((a) => map.set(a.nome, a));
    return Array.from(map.values());
  }, [baseProduct]);

  const precoAddons = selectedAddons.reduce((acc, nome) => {
    const addon = extras.find((a) => a.nome === nome);
    return acc + Number(addon?.preco || 0);
  }, 0);

  const precoTotal = precoBase + precoAddons;
  const total = precoTotal * qty;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedAddons([]);
    setQty(1);
    setSelectedSize(null);
  }, [open]);

  if (!open || !baseProduct) return null;

  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      if (prev.includes(addon.nome)) {
        return prev.filter((item) => item !== addon.nome);
      }
      return [...prev, addon.nome];
    });
  };

  const handleConfirm = () => {
    if (!selectedSize) return alert("Escolha um tamanho para o Hot Dog!");
    if (selectedAddons.length === 0 && !selectedSize) return alert("Escolha pelo menos um adicional ou tamanho!");

    const item = {
      id: `hotdog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `Hot Dog ${baseProduct.name}`,
      addons: extras.filter((a) => selectedAddons.includes(a.nome)),
      qty,
      price: total,
      size: selectedSize,
      image: baseProduct.image,
      category: "HotDog",
    };

    onAdd(item);
    onClose();
  };

  const StepBadge = ({ idx, label }) => (
    <div
      className={`flex items-center gap-2 ${step === idx ? "font-semibold" : "opacity-70"}`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          step === idx ? "bg-yellow-500 text-white" : "bg-gray-200"
        }`}
      >
        {idx}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🌭 Montar Hot Dog</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">
            Fechar
          </button>
        </div>

        {/* Step Navigation */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          <StepBadge idx={1} label="Adicionais" />
          <StepBadge idx={2} label="Resumo" />
        </div>

        {/* Step 1 - Adicionais */}
        {step === 1 && (
          <>
            <h3 className="font-semibold mb-2">Escolha os Adicionais</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              <label
                className={`px-3 py-1 border rounded-full cursor-pointer ${
                  selectedAddons.length === 0 ? "bg-yellow-500 text-white" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedAddons.length === 0}
                  onChange={() => setSelectedAddons([])} // Remove all addons if "Sem Adicionais" is selected
                />
                Sem Adicionais
              </label>

              {extras.map((addon) => (
                <label
                  key={addon.nome}
                  className={`px-3 py-1 border rounded-full cursor-pointer ${
                    selectedAddons.includes(addon.nome) ? "bg-yellow-500 text-white" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedAddons.includes(addon.nome)}
                    onChange={() => handleToggleAddon(addon)}
                  />
                  {addon.nome} (+R$ {Number(addon.preco).toFixed(2)})
                </label>
              ))}
            </div>

            <div className="mb-4">
              <h4 className="font-semibold">Escolha o Tamanho</h4>
              <div className="flex gap-2">
                {baseProduct?.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg ${
                      selectedSize === size ? "bg-yellow-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {size} (R$ {baseProduct.prices?.[size]?.toFixed(2)})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                disabled={selectedSize === null}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
              >
                Próximo
              </button>
            </div>
          </>
        )}

        {/* Step 2 - Resumo */}
        {step === 2 && (
          <>
            <h3 className="font-semibold mb-2">Resumo do Hot Dog</h3>
            <p className="text-sm mb-1">
              Adicionais: {selectedAddons.length === 0 ? "Sem Adicionais" : selectedAddons.join(", ")}
            </p>
            <p className="font-bold text-lg mb-4">
              Tamanho: {selectedSize} <br />
              Preço Base: R$ {precoBase.toFixed(2)} <br />
              Adicionais: R$ {precoAddons.toFixed(2)} <br />
              Total: R$ {total.toFixed(2)}
            </p>

            <div className="flex items-center justify-between mb-4">
              <button
                className="w-8 h-8 border rounded-full"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span>{qty}</span>
              <button
                className="w-8 h-8 border rounded-full"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

