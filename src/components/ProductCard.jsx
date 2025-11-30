import { useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";

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
  const [selectedAddons] = useState([]); // mantido para futuras opções
  const [qty] = useState(1);

  const sizes = useMemo(() => {
    if (!p.prices) return [];
    return Object.entries(p.prices).filter(([size]) => size);
  }, [p.prices]);

  // 🔥 Normaliza categoria (remove acentos e coloca em minúsculo)
  const rawCategory = p.category || "";
  const category = rawCategory
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // ---------- PREÇO TOTAL (AGORA USADO) ----------
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

  // ---------- ADICIONAR (clique no botão principal) ----------
  const handleAdd = () => {
    // Itens montáveis → quem cuida é o Cardapio (abre modal)
    if (
      (category === "pizza" && p.montar) ||
      (category === "hamburguer" && p.montar) ||
      (category === "pastel" && p.montar)
    ) {
      onAdd({
        id: p.id,
        size: selectedSize || "",
        firstFlavorId: p.id,
        qty,
      });
      return;
    }

    // Demais casos: adiciona direto ao carrinho (usa calculateTotalPrice)
    addToCart();
  };

  const addToCart = () => {
    const price = calculateTotalPrice();

    // se não escolheu size e só existe 1, uso ele no campo size
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

  // ---------- PREÇO EXIBIDO NO CARD ----------
  const priceToShow = (() => {
    // 🔹 Hambúrguer montável → "a partir de", igual pastel
    if (category === "hamburguer" && p.montar) {
      if (sizes.length > 0) {
        const min = Math.min(
          ...sizes
            .map(([, price]) => parsePreco(price))
            .filter((n) => !Number.isNaN(n))
        );
        return `A partir de ${formatPreco(min)}`;
      }
      return "Monte seu Hambúrguer";
    }

    // Pastel montável → “a partir de”
    if (category === "pastel" && p.montar) {
      if (sizes.length > 0) {
        const min = Math.min(
          ...sizes
            .map(([, price]) => parsePreco(price))
            .filter((n) => !Number.isNaN(n))
        );
        return `A partir de ${formatPreco(min)}`;
      }
      return "Monte seu Pastel";
    }

    // Marmita montável
    if (category === "marmita" && p.montar) {
      if (sizes.length > 0) {
        const min = Math.min(
          ...sizes
            .map(([, price]) => parsePreco(price))
            .filter((n) => !Number.isNaN(n))
        );
        return `A partir de ${formatPreco(min)}`;
      }
      return "Monte sua Marmita";
    }

    // Tamanhos
    if (sizes.length > 0) {
      return selectedSize
        ? formatPreco(parsePreco(p.prices[selectedSize]))
        : "Selecione um tamanho";
    }

    // Preço único
    return formatPreco(parsePreco(p.preco || p.prices?.único || p.price));
  })();

  // ---------- RENDER ----------
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, boxShadow: "0 6px 18px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col h-full border rounded-2xl p-4 bg-white shadow-sm"
    >
      {/* Imagem */}
      {p.image && (
        <motion.img
          src={p.image}
          alt={p.name}
          className="w-full h-40 object-cover rounded-lg mb-3"
          whileHover={{ scale: 1.05 }}
        />
      )}

      {/* Nome + descrição */}
      <h3 className="font-semibold text-lg text-gray-800 capitalize">{p.name}</h3>
      {p.description && (
        <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-3">
          {p.description}
        </p>
      )}

      {/* Mensagens especiais */}
      {category === "pizza" && (
        <p className="mt-2 text-red-600 font-bold text-sm">
          Escolha os sabores
        </p>
      )}
      {category === "hamburguer" && p.montar && (
        <p className="mt-2 text-green-600 font-bold text-sm">
          Monte seu Hambúrguer
        </p>
      )}
      {category === "pastel" && p.montar && (
        <p className="mt-2 text-blue-600 font-bold text-sm">
          Monte seu Pastel
        </p>
      )}

      {/* Tamanhos (não mostramos para Pizza) */}
      {sizes.length > 0 && category !== "pizza" && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {sizes.map(([size, price], idx) => (
            <motion.button
              key={`${p.id || p.name || "produto"}-size-${idx}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedSize(size)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
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

      {/* Preço */}
      <p className="mt-3 font-bold text-lg text-gray-800">{priceToShow}</p>

      {/* Botão principal */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAdd}
        className={`mt-auto w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-base font-semibold shadow transition
          ${
            category === "pizza" ||
            (category === "hamburguer" && p.montar) ||
            (category === "pastel" && p.montar)
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
      >
        <FaPlus />
        {category === "pizza"
          ? "Montar Pizza"
          : category === "hamburguer"
          ? p.montar
            ? "Montar Hambúrguer"
            : "Adicionar ao Carrinho"
          : category === "pastel"
          ? p.montar
            ? "Montar Pastel"
            : "Adicionar ao Carrinho"
          : "Adicionar ao Carrinho"}
      </motion.button>
    </motion.div>
  );
}
