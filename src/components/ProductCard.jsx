import { useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
const MotionDiv = motion.div;

/* Helpers */
function parsePreco(valor) {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

function formatPreco(valor) {
  return parsePreco(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({ p, onAdd }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedAddons] = useState([]);
  const [qty] = useState(1);

  const sizes = useMemo(() => {
    if (!p.prices) return [];
    return Object.entries(p.prices).filter(([size]) => size);
  }, [p.prices]);

  const rawCategory = p.category || "";
  const category = rawCategory
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const calculateTotalPrice = () => {
    let basePrice = 0;

    if (sizes.length > 0 && selectedSize) {
      basePrice = parsePreco(p.prices[selectedSize]);
    } else if (sizes.length === 1) {
      basePrice = parsePreco(p.prices[Object.keys(p.prices)[0]]);
    } else {
      basePrice = parsePreco(p.preco || p.prices?.único || p.price);
    }

    const addonsTotal = selectedAddons.reduce(
      (acc, a) => acc + parsePreco(a.preco || 0),
      0
    );

    return (basePrice + addonsTotal) * qty;
  };

  // 🔥 Correção: agora o pastel abre modal se tiver tamanhos ou adicionais!
  const handleAdd = () => {
    const hasSizes = sizes.length > 0;
    const hasAddons = p.adicionais && p.adicionais.length > 0;

    const shouldOpenModal =
      category === "pizza" ||
      (category === "hamburguer" && p.montar) ||
      (category === "pastel" && (p.montar || hasSizes || hasAddons));

    if (shouldOpenModal) {
      onAdd({
        id: p.id,
        size: selectedSize || "",
        firstFlavorId: p.id,
        qty,
      });
      return;
    }

    addToCart();
  };

  const addToCart = () => {
    const price = calculateTotalPrice();

    const sizeToUse =
      selectedSize ||
      (sizes.length === 1 ? Object.keys(p.prices)[0] : "único");

    onAdd({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price,
      size: sizeToUse,
      image: p.image,
      qty,
      addons: [...selectedAddons].filter(Boolean),
    });
  };

  const priceToShow = (() => {
    if (category === "pizza" && p.montar) return "Monte sua Pizza";

    if (sizes.length > 0) {
      return selectedSize
        ? formatPreco(parsePreco(p.prices[selectedSize]))
        : "Selecione um tamanho";
    }

    return formatPreco(parsePreco(p.preco || p.prices?.único || p.price));
  })();

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col h-full border rounded-2xl p-4 bg-white shadow-sm"
    >
      {p.image && (
        <motion.img
          src={p.image}
          alt={p.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
        />
      )}

      <h3 className="font-semibold text-lg text-gray-800 capitalize">{p.name}</h3>
      {p.description && (
        <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-3">
          {p.description}
        </p>
      )}

      {sizes.length > 0 && category !== "pizza" && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {sizes.map(([size, price], idx) => (
            <motion.button
              key={idx}
              onClick={() => setSelectedSize(size)}
              className={`px-3 py-1 rounded-full border text-sm ${
                selectedSize === size
                  ? "bg-yellow-500 text-white border-yellow-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {size} - {formatPreco(parsePreco(price))}
            </motion.button>
          ))}
        </div>
      )}

      <p className="mt-3 font-bold text-lg text-gray-800">{priceToShow}</p>

      <motion.button
        onClick={handleAdd}
        className="mt-auto w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
      >
        <FaPlus />
        Adicionar
      </motion.button>
    </MotionDiv>
  );
}
