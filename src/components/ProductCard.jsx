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
  const [selectedAddons] = useState([]);
  const [qty] = useState(1);

  const sizes = useMemo(() => {
    if (!p.prices) return [];
    return Object.entries(p.prices).filter(([size]) => size);
  }, [p.prices]);

  const category = (p.category || "").toLowerCase();

  // ---------- PREÇO TOTAL ----------
  const calculateTotalPrice = () => {
    let basePrice = 0;

    if (sizes.length > 0 && selectedSize) {
      basePrice = parsePreco(p.prices[selectedSize]);
    } else if (sizes.length === 1) {
      basePrice = parsePreco(p.prices[Object.keys(p.prices)[0]]);
    } else {
      basePrice = parsePreco(p.preco || p.prices?.único);
    }

    const addonsTotal = selectedAddons.reduce(
      (acc, a) => acc + parsePreco(a.preco || 0),
      0
    );

    return (basePrice + addonsTotal) * qty;
  };

  // ---------- ADICIONAR ----------
  const handleAdd = () => {
    // Pastel montável exige tamanho já no card
    if (category === "pastel" && p.montar && !selectedSize) {
      alert("Escolha um tamanho para o pastel antes de continuar!");
      return;
    }
    // Marmita montável não exige nada no card — o modal resolve os passos
    addToCart();
  };

  const addToCart = () => {
    let price;

    // Itens montáveis (hambúrguer/pastel/marmita) — o Cardápio pode abrir o modal
    if (
      (category === "hamburguer" && p.montar) ||
      (category === "pastel" && p.montar) ||
      (category === "marmita" && p.montar)
    ) {
      price = calculateTotalPrice();
    } else if (category === "hamburguer" && !p.montar) {
      // Hambúrguer pronto
      price = parsePreco(p.preco);
    } else if (sizes.length === 1) {
      price = parsePreco(p.prices[Object.keys(p.prices)[0]]);
    } else if (sizes.length > 0 && selectedSize) {
      price = parsePreco(p.prices[selectedSize]);
    } else {
      price = parsePreco(p.preco || p.prices?.único);
    }

    onAdd({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price,
      size: selectedSize || "único",
      image: p.image,
      qty,
      addons: [...selectedAddons].filter(Boolean),
    });
  };

  // ---------- PREÇO EXIBIDO ----------
  const priceToShow = (() => {
    // Pastel montável: exige tamanho visível no card
    if (category === "pastel" && p.montar) {
      return selectedSize
        ? formatPreco(parsePreco(p.prices[selectedSize]))
        : "Selecione um tamanho";
    }

    // Marmita montável: se houver tabela de preços, mostra "A partir de R$ ..."
    if (category === "marmita" && p.montar) {
      if (sizes.length > 0) {
        const min = Math.min(
          ...sizes.map(([, price]) => parsePreco(price)).filter((n) => !Number.isNaN(n))
        );
        return `A partir de ${formatPreco(min)}`;
      }
      return "Monte sua Marmita";
    }

    // Demais casos com tabela de tamanhos
    if (sizes.length > 0) {
      return selectedSize
        ? formatPreco(parsePreco(p.prices[selectedSize]))
        : "Selecione um tamanho";
    }

    // Preço único
    return formatPreco(parsePreco(p.preco || p.prices?.único));
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
        <p className="text-sm text-gray-600 mt-1 mb-2 line-clamp-3">{p.description}</p>
      )}

      {/* Mensagens especiais */}
      {category === "pizza" && (
        <p className="mt-2 text-red-600 font-bold text-sm">Escolha os sabores </p>
      )}
      {category === "hamburguer" && p.montar && (
        <p className="mt-2 text-green-600 font-bold text-sm">Monte seu Hambúrguer </p>
      )}
      {category === "pastel" && p.montar && (
        <p className="mt-2 text-blue-600 font-bold text-sm">Monte seu Pastel </p>
      )}
      

      {/* Tamanhos (não mostramos para Pizza; Marmita só se o produto tiver prices próprios) */}
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
