import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ProductCard({ p, onAdd }) {
  const [selectedSize, setSelectedSize] = useState("");

  // lista de tamanhos válidos
  const sizes =
    p.prices && Object.keys(p.prices).length > 0
      ? Object.entries(p.prices).filter(([size]) => size)
      : [];

  const category = p.category?.toLowerCase();

  const handleAdd = () => {
    if (category === "pizza" || category === "acai") {
      // 🔹 dispara o onAdd → abre modal certo
      onAdd({ id: p.id, size: selectedSize });
      return;
    }

    // 🔹 produtos normais
    if (sizes.length > 0 && !selectedSize) {
      alert("Selecione um tamanho antes de adicionar ao carrinho!");
      return;
    }

    const price =
      sizes.length > 0 ? p.prices[selectedSize] : p.prices?.promocao || 0;

    onAdd({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price,
      size: selectedSize || "único",
      image: p.image,
      qty: 1,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-between border rounded-lg p-4 bg-white transition"
    >
      {/* Info */}
      <div className="flex-1 pr-4">
        <h3 className="font-semibold text-lg text-gray-800">{p.name}</h3>
        {p.description && (
          <p className="text-sm text-gray-600">{p.description}</p>
        )}

        {/* Renderização dinâmica */}
        {category === "acai" ? (
          <p className="mt-2 text-purple-600 font-bold text-lg">
            Monte seu Açaí 🍧
          </p>
        ) : category === "pizza" ? (
          <p className="mt-2 text-red-600 font-bold text-lg">
            Escolha os sabores 🍕
          </p>
        ) : sizes.length > 0 ? (
          <div className="flex gap-2 mt-2 flex-wrap">
            {sizes.map(([size, price]) => (
              <motion.button
                key={size}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-1 rounded border text-sm transition ${
                  selectedSize === size
                    ? "bg-black text-white border-black"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {size} - R$ {price.toFixed(2)}
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-green-600 font-bold text-lg">
            R$ {p.prices?.promocao?.toFixed(2) || "0,00"}
          </p>
        )}

        {/* Botão principal */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm shadow
            ${
              category === "acai"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : category === "pizza"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
        >
          <FaPlus />{" "}
          {category === "acai"
            ? "Montar Açaí"
            : category === "pizza"
            ? "Montar Pizza"
            : "Adicionar"}
        </motion.button>
      </div>

      {/* Imagem */}
      {p.image && (
        <motion.img
          src={p.image}
          alt={p.name}
          className="w-24 h-24 object-cover rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
        />
      )}
    </motion.div>
  );
}
