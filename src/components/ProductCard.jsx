import { useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div;

/* Helpers de Formatação */
const parsePreco = (valor) => {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

const formatPreco = (valor) => {
  return parsePreco(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function ProductCard({ p, onAdd, disabled }) {
  const [selectedSize, setSelectedSize] = useState("");

  const sizes = useMemo(() => {
    if (!p.prices) return [];
    return Object.entries(p.prices).filter(([size]) => size);
  }, [p.prices]);

  const category = (p.category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Lógica de Preço Inteligente
  const { displayPrice, isStartingPrice } = useMemo(() => {
    if (category === "pizza" && p.montar) return { displayPrice: "Monte a sua", isStartingPrice: false };

    if (sizes.length > 0) {
      if (selectedSize) {
        return { displayPrice: formatPreco(p.prices[selectedSize]), isStartingPrice: false };
      }
      const pricesOnly = sizes.map(([_, price]) => parsePreco(price));
      return { displayPrice: formatPreco(Math.min(...pricesOnly)), isStartingPrice: true };
    }

    return { displayPrice: formatPreco(p.preco || p.price || p.prices?.único), isStartingPrice: false };
  }, [p, sizes, category, selectedSize]);

  const handleAdd = () => {
    if (disabled) return;
    
    const hasSizes = sizes.length > 0;
    const hasAddons = p.adicionais && p.adicionais.length > 0;
    const shouldOpenModal = category === "pizza" || (category === "pastel" && (p.montar || hasSizes || hasAddons));

    onAdd({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: parsePreco(selectedSize ? p.prices[selectedSize] : (p.preco || p.price)),
      size: selectedSize || (sizes.length === 1 ? Object.keys(p.prices)[0] : "único"),
      image: p.image,
      qty: 1,
      firstFlavorId: p.id,
    });
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col w-full bg-white rounded-[2.5rem] p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Container da Imagem */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-[2rem] bg-gray-100">
        {p.image ? (
          <motion.img
            src={p.image}
            alt={p.name}
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            {/* Ícone fallback caso não tenha imagem */}
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Badge de Categoria (Opcional) */}
        <div className="absolute top-3 left-3">
          <span className="glass-effect bg-white/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm">
            {p.category}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 px-2 py-4">
        <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">
          {p.name}
        </h3>
        
        <p className="text-gray-500 text-xs mt-2 line-clamp-2 min-h-[32px]">
          {p.description || "Sem descrição disponível."}
        </p>

        {/* Seleção de Tamanhos (Chips) */}
        {sizes.length > 1 && category !== "pizza" && (
          <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {sizes.map(([size]) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  selectedSize === size
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Footer do Card: Preço e Botão */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {isStartingPrice && (
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">A partir de</span>
            )}
            <span className="text-xl font-black text-gray-900 tracking-tight">
              {displayPrice}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd}
            disabled={disabled}
            className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-all ${
              disabled 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-gray-900 text-white hover:bg-green-600 shadow-lg shadow-gray-200 hover:shadow-green-200"
            }`}
          >
            <FaPlus size={16} />
          </motion.button>
        </div>
      </div>
    </MotionDiv>
  );
}