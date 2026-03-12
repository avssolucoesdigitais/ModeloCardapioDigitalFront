import { useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import PromoModal from "./PromoModal";

const MotionDiv = motion.div;

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
  const [promoOpen, setPromoOpen] = useState(false);

  const sizes = useMemo(() => {
    if (!p.prices) return [];
    return Object.entries(p.prices).filter(([size]) => size);
  }, [p.prices]);

  const category = (p.category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isPromo = category === "promocao" || category === "promoção";

  const { displayPrice, isStartingPrice } = useMemo(() => {
    if (category === "pizza" && p.montar) return { displayPrice: "Monte a sua", isStartingPrice: false };
    if (sizes.length > 0) {
      if (selectedSize) return { displayPrice: formatPreco(p.prices[selectedSize]), isStartingPrice: false };
      const pricesOnly = sizes.map(([_, price]) => parsePreco(price));
      return { displayPrice: formatPreco(Math.min(...pricesOnly)), isStartingPrice: true };
    }
    return { displayPrice: formatPreco(p.preco || p.price || p.prices?.único), isStartingPrice: false };
  }, [p, sizes, category, selectedSize]);

  const handleAdd = () => {
    if (disabled) return;
    if (isPromo) { setPromoOpen(true); return; }
    onAdd({
      id: p.id, name: p.name, category: p.category, description: p.description,
      price: parsePreco(selectedSize ? p.prices[selectedSize] : (p.preco || p.price)),
      size: selectedSize || (sizes.length === 1 ? Object.keys(p.prices)[0] : "único"),
      image: p.image, qty: 1, firstFlavorId: p.id,
    });
  };

  return (
    <>
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onClick={isPromo ? () => !disabled && setPromoOpen(true) : undefined}
        className={`group relative flex flex-col w-full bg-white rounded-[2rem] border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
          isPromo ? "border-red-100 cursor-pointer" : "border-gray-100"
        }`}
      >
        {/* Imagem */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
          {p.image ? (
            <motion.img src={p.image} alt={p.name} whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.4 }} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${
              isPromo ? "bg-red-500 text-white" : "bg-white/80 backdrop-blur-md text-gray-700"
            }`}>
              {isPromo ? "🔥 Promoção" : p.category}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col flex-1 p-3 gap-1">
          <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">{p.name}</h3>
          <p className="text-gray-400 text-[11px] line-clamp-2 min-h-[28px]">{p.description || ""}</p>

          {sizes.length > 1 && !isPromo && category !== "pizza" && (
            <div className="flex gap-1 mt-1 overflow-x-auto scrollbar-hide pb-0.5">
              {sizes.map(([size]) => (
                <button key={size} onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                  className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold transition-all shrink-0 ${
                    selectedSize === size ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}>
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between mt-auto pt-2">
            <div className="flex flex-col leading-none">
              {isStartingPrice && (
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">A partir de</span>
              )}
              <span className="text-base font-black tracking-tight text-gray-900">
                {displayPrice}
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              disabled={disabled}
              className={`flex items-center justify-center h-9 w-9 rounded-xl shrink-0 transition-all ${
                disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-green-600 shadow-md"
              }`}
            >
              <FaPlus size={13} />
            </motion.button>
          </div>
        </div>
      </MotionDiv>

      <PromoModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        produto={p}
        onAdd={onAdd}
        disabled={disabled}
      />
    </>
  );
}