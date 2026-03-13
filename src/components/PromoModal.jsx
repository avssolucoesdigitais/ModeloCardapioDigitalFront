import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import { useState } from "react";

const parsePreco = (valor) => {
  if (!valor) return 0;
  return parseFloat(String(valor).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
};

const formatBRL = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PromoDestaque({ produto }) {
  const tipo = produto.tipoPromo || "livre";
  const preco = parsePreco(produto.preco || produto.price);

  const card = {
    combo:    { bg: "bg-orange-50",  border: "border-orange-100", emoji: "🎁", label: "Combo",                labelColor: "text-orange-500" },
    desconto: { bg: "bg-green-50",   border: "border-green-100",  emoji: "💸", label: "Desconto especial",    labelColor: "text-green-500"  },
    brinde:   { bg: "bg-purple-50",  border: "border-purple-100", emoji: "🎉", label: "Ganhe um brinde!",     labelColor: "text-purple-500" },
    leve_mais:{ bg: "bg-blue-50",    border: "border-blue-100",   emoji: "🛍️", label: "Leve mais, pague menos", labelColor: "text-blue-500" },
    livre:    { bg: "bg-red-50",     border: "border-red-100",    emoji: "🔥", label: "Oferta especial",      labelColor: "text-red-500"    },
  }[tipo] || { bg: "bg-red-50", border: "border-red-100", emoji: "🔥", label: "Oferta", labelColor: "text-red-500" };

  return (
    <div className={`flex items-center gap-4 ${card.bg} border ${card.border} px-5 py-4 rounded-2xl shadow-sm`}>
      <span className="text-4xl shrink-0">{card.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black ${card.labelColor} uppercase tracking-wider`}>{card.label}</p>

        {tipo === "combo" && produto.quantidade && (
          <p className="text-lg font-black text-gray-900">{produto.quantidade} unidades</p>
        )}
        {tipo === "desconto" && produto.desconto && (
          <p className="text-3xl font-black text-green-600">{produto.desconto}% OFF</p>
        )}
        {tipo === "brinde" && produto.brinde && (
          <p className="text-lg font-black text-purple-700">{produto.brinde}</p>
        )}
        {tipo === "leve_mais" && produto.leveQuantidade && (
          <p className="text-2xl font-black text-blue-700">
            Leve {produto.leveQuantidade} pague {produto.pagueQuantidade}
          </p>
        )}

        <p className="text-sm font-bold text-gray-500 mt-0.5">por {formatBRL(preco)}</p>
      </div>
    </div>
  );
}

export default function PromoModal({ open, onClose, produto, onAdd, disabled }) {
  const [qty, setQty] = useState(1);

  if (!open || !produto) return null;

  const preco = parsePreco(produto.preco || produto.price);
  const totalPreco = preco * qty;

  const handleAdd = () => {
    onAdd({
      id: produto.id, name: produto.name, category: produto.category,
      description: produto.description, price: preco,
      size: "único", image: produto.image, qty,
    });
    setQty(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-gray-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* HEADER com imagem */}
            <div className="relative w-full h-52 bg-gray-200 shrink-0">
              {produto.image
                ? <img src={produto.image} alt={produto.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl bg-orange-50">🎉</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                <Tag size={12} /> Promoção
              </div>

              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                <X size={20} />
              </button>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {/* Título e descrição */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 leading-tight">{produto.name}</h2>
                {produto.description && (
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{produto.description}</p>
                )}
              </div>

              {/* Destaque por tipo */}
              <PromoDestaque produto={produto} />
            </div>

            {/* FOOTER */}
            <div className="p-5 bg-white border-t flex items-center gap-3">
              {/* Seletor de quantidade — mesmo padrão do PizzaBuilder */}
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1 shrink-0">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl hover:bg-white transition-all flex items-center justify-center font-bold text-xl text-gray-600">
                  −
                </button>
                <span className="w-10 text-center font-black text-gray-900 text-lg">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-xl hover:bg-white transition-all flex items-center justify-center font-bold text-xl text-gray-600">
                  +
                </button>
              </div>

              <button onClick={handleAdd} disabled={disabled}
                className={`flex-1 flex items-center justify-between px-5 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-orange-200 ${
                  disabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}>
                <span>Adicionar</span>
                <span>{formatBRL(totalPreco)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}