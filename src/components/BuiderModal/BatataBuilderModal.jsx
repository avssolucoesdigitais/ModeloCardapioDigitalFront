import { useState } from "react";
import { motion } from "framer-motion";

// Helper para preço
function parsePreco(preco) {
  if (typeof preco === "number") {
    return preco; // Se já for número, retorna
  }
  
  if (typeof preco === "string") {
    // Garante que vírgulas sejam substituídas por ponto
    return parseFloat(preco.replace(",", "."));
  }

  return 0; // Caso contrário, retorna 0
}

export default function BatataBuilderModal({
  open,
  onClose,
  baseProduct,
  onAdd,
}) {
  const [selectedSize, setSelectedSize] = useState(null); // Para o tamanho
  const [selectedAddons, setSelectedAddons] = useState([]); // Para os adicionais
  const [qty, setQty] = useState(1);

  if (!open || !baseProduct) return null;

  // Calcular o preço total com base nos itens selecionados, incluindo o tamanho e adicionais
  const sizePrice = selectedSize ? parsePreco(selectedSize.preco) : 0;
  const addonsPrice = selectedAddons.reduce((acc, a) => acc + parsePreco(a.preco || 0), 0);
  const total = (sizePrice + addonsPrice) * qty;

  const handleAddAddon = (addon) => {
    setSelectedAddons((prev) => {
      if (prev.find((a) => a.id === addon.id)) {
        return prev.filter((a) => a.id !== addon.id); // Se já estiver, remove
      }
      return [...prev, addon]; // Caso contrário, adiciona
    });
  };

  const handleConfirm = () => {
    if (!selectedSize) {
      alert("Escolha um tamanho antes de continuar!");
      return; // Impede a adição no carrinho sem escolher o tamanho
    }

    const item = {
      id: `batata-${Date.now()}`,
      name: `Batata ${baseProduct.name}`,
      category: "Batata",
      qty,
      price: total,
      size: selectedSize,  // Inclui o tamanho selecionado
      addons: selectedAddons, // Inclui os adicionais
      image: baseProduct.image,
    };

    onAdd(item);  // Adiciona ao carrinho
    onClose();  // Fecha o modal
  };

  // Renderiza as opções de "adicionais"
  const renderAddons = () => {
    return (
      <>
        <h3 className="font-semibold mb-3 text-lg">➕ Adicionais</h3>
        <div className="flex flex-wrap gap-2">
          {baseProduct.adicionais?.map((a) => (
            <button
              key={a.id}
              onClick={() => handleAddAddon(a)}
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
  };

  // Renderiza as opções de "tamanho"
  const renderSizes = () => {
    return (
      <>
        <h3 className="font-semibold mb-3 text-lg">📏 Escolha o Tamanho</h3>
        <div className="flex flex-wrap gap-2">
          {baseProduct.sizes?.map((size) => (
            <button
              key={size.id}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-lg border text-sm sm:text-base transition ${
                selectedSize?.id === size.id
                  ? "bg-yellow-500 text-white border-yellow-600"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {size.nome} (+R$ {parsePreco(size.preco).toFixed(2).replace(".", ",")})
            </button>
          ))}
        </div>
      </>
    );
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
        {/* Conteúdo do Modal */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">🍟 Montar Batata</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Fechar ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {renderSizes()} {/* Exibe as opções de tamanho */}
          {renderAddons()} {/* Exibe as opções de adicionais */}
        </div>

        {/* Ações */}
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

          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg w-full sm:w-auto"
          >
            ✅ Confirmar ({`R$ ${total.toFixed(2)}`})
          </button>
        </div>
      </motion.div>
    </div>
  );
}
