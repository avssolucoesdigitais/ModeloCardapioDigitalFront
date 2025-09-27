import { useState } from "react";
import { motion } from "framer-motion";

export default function HamburguerBuilderModal({
  open,
  onClose,
  baseProduct,
  onAdd,
}) {
  const [step, setStep] = useState(1);
  const [selectedPao, setSelectedPao] = useState(null);
  const [selectedCarne, setSelectedCarne] = useState(null);
  const [selectedQueijo, setSelectedQueijo] = useState(null);
  const [selectedMolho, setSelectedMolho] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  if (!open || !baseProduct) return null;

  // Função para converter valores com vírgula em números
  const parsePreco = (preco) => {
    if (!preco) return 0;
    return parseFloat(preco.replace(",", "."));
  };

  // preço total
  const total =
    (parsePreco(selectedPao?.preco || 0) +
      parsePreco(selectedCarne?.preco || 0) +
      parsePreco(selectedQueijo?.preco || 0) +
      parsePreco(selectedMolho?.preco || 0) +
      selectedAddons.reduce((acc, a) => acc + parsePreco(a.preco || 0), 0)) *
    qty;

  const handleConfirm = () => {
    if (!selectedPao || !selectedCarne) {
      alert("Escolha pelo menos pão e carne para continuar!");
      return;
    }

    const item = {
      id: `burger-${Date.now()}`,
      name: `Hambúrguer ${selectedPao.nome} + ${selectedCarne.nome}`,
      category: "Hamburguer",
      qty,
      price: total,
      addons: [...selectedAddons, selectedQueijo, selectedMolho].filter(Boolean),
      image: baseProduct.image,
    };

    onAdd(item);
    onClose();
  };

  // Função que renderiza cada step
  const renderStep = () => {
    const optionButton = (opt, selected, setSelected) => (
      <button
        key={opt.id}
        onClick={() => setSelected(opt)}
        className={`px-4 py-2 rounded-lg border text-sm sm:text-base transition 
          ${
            selected?.id === opt.id
              ? "bg-yellow-500 text-white border-yellow-600"
              : "bg-white hover:bg-gray-100"
          }`}
      >
        {opt.nome}{" "}
        <span className="text-gray-600">
          {opt.preco ? `+R$ ${parsePreco(opt.preco).toFixed(2).replace(".", ",")}` : "Grátis"}
        </span>
      </button>
    );

    switch (step) {
      case 1:
        return (
          <>
            <h3 className="font-semibold mb-3 text-lg">🍞 Escolha o pão</h3>
            <div className="flex flex-wrap gap-2">{baseProduct.paes?.map((p) => optionButton(p, selectedPao, setSelectedPao))}</div>
          </>
        );
      case 2:
        return (
          <>
            <h3 className="font-semibold mb-3 text-lg">🥩 Escolha a carne</h3>
            <div className="flex flex-wrap gap-2">{baseProduct.carnes?.map((c) => optionButton(c, selectedCarne, setSelectedCarne))}</div>
          </>
        );
      case 3:
        return (
          <>
            <h3 className="font-semibold mb-3 text-lg">🧀 Escolha o queijo</h3>
            <div className="flex flex-wrap gap-2">{baseProduct.queijos?.map((q) => optionButton(q, selectedQueijo, setSelectedQueijo))}</div>
          </>
        );
      case 4:
        return (
          <>
            <h3 className="font-semibold mb-3 text-lg">🥫 Escolha o molho</h3>
            <div className="flex flex-wrap gap-2">{baseProduct.molhos?.map((m) => optionButton(m, selectedMolho, setSelectedMolho))}</div>
          </>
        );
      case 5:
        return (
          <>
            <h3 className="font-semibold mb-3 text-lg">➕ Adicionais</h3>
            <div className="flex flex-wrap gap-2">
              {baseProduct.complementos?.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    setSelectedAddons((prev) =>
                      prev.find((x) => x.id === a.id)
                        ? prev.filter((x) => x.id !== a.id)
                        : [...prev, a]
                    )
                  }
                  className={`px-4 py-2 rounded-lg border text-sm sm:text-base transition ${
                    selectedAddons.find((x) => x.id === a.id)
                      ? "bg-yellow-500 text-white border-yellow-600"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {a.nome} (+R$ {parsePreco(a.preco).toFixed(2).replace(".", ",")})
                </button>
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-2 sm:p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">🍔 Montar Hambúrguer</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Fechar ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">{renderStep()}</div>

        {/* Controles fixos */}
        <div className="border-t bg-gray-50 p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-1 bg-gray-200 rounded-lg"
            >
              -
            </button>
            <span className="font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="px-3 py-1 bg-gray-200 rounded-lg"
            >
              +
            </button>
          </div>

          <div className="flex-1"></div>

          {step > 1 && step <= 5 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 bg-gray-200 rounded-lg w-full sm:w-auto"
            >
              ◀ Voltar
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg w-full sm:w-auto"
            >
              Avançar ▶
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg w-full sm:w-auto"
            >
              ✅ Confirmar ({`R$ ${total.toFixed(2)}`})
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

