import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useState } from "react";

const parsePreco = (valor) => {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

const formatPreco = (valor) =>
  parsePreco(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Renderiza o destaque visual conforme o tipo da promoção
function PromoDestaque({ produto }) {
  const tipo = produto.tipoPromo || "livre";
  const preco = parsePreco(produto.preco || produto.price);

  if (tipo === "combo") return (
    <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 px-5 py-4 rounded-2xl">
      <span className="text-4xl">🎁</span>
      <div>
        <p className="text-xs font-black text-orange-400 uppercase tracking-wider">Combo</p>
        <p className="text-lg font-black text-gray-900">
          {produto.quantidade ? `${produto.quantidade} unidades` : produto.nome}
        </p>
        <p className="text-2xl font-black text-orange-600">{formatPreco(preco)}</p>
      </div>
    </div>
  );

  if (tipo === "desconto") return (
    <div className="flex items-center gap-4 bg-green-50 border border-green-100 px-5 py-4 rounded-2xl">
      <span className="text-4xl">💸</span>
      <div>
        <p className="text-xs font-black text-green-500 uppercase tracking-wider">Desconto especial</p>
        {produto.desconto && (
          <p className="text-3xl font-black text-green-600">{produto.desconto}% OFF</p>
        )}
        <p className="text-lg font-black text-gray-900">por {formatPreco(preco)}</p>
      </div>
    </div>
  );

  if (tipo === "brinde") return (
    <div className="flex items-center gap-4 bg-purple-50 border border-purple-100 px-5 py-4 rounded-2xl">
      <span className="text-4xl">🎉</span>
      <div>
        <p className="text-xs font-black text-purple-400 uppercase tracking-wider">Ganhe um brinde!</p>
        {produto.brinde && (
          <p className="text-lg font-black text-purple-700">{produto.brinde}</p>
        )}
        <p className="text-sm font-bold text-gray-500">por {formatPreco(preco)}</p>
      </div>
    </div>
  );

  if (tipo === "leve_mais") return (
    <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 px-5 py-4 rounded-2xl">
      <span className="text-4xl">🛍️</span>
      <div>
        <p className="text-xs font-black text-blue-400 uppercase tracking-wider">Leve mais, pague menos</p>
        {produto.leveQuantidade && produto.pagueQuantidade && (
          <p className="text-2xl font-black text-blue-700">
            Leve {produto.leveQuantidade} pague {produto.pagueQuantidade}
          </p>
        )}
        <p className="text-sm font-bold text-gray-500">por {formatPreco(preco)}</p>
      </div>
    </div>
  );

  // livre / padrão
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-100 px-5 py-4 rounded-2xl">
      <span className="text-3xl font-black text-red-600">{formatPreco(preco)}</span>
      <span className="text-xs text-red-400 font-bold uppercase tracking-wider">por unidade</span>
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
      id: produto.id,
      name: produto.name,
      category: produto.category,
      description: produto.description,
      price: preco,
      size: "único",
      image: produto.image,
      qty,
    });
    setQty(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[201] w-full max-w-lg mx-auto bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            {/* Imagem */}
            <div className="relative w-full h-56 bg-gray-100 shrink-0">
              {produto.image
                ? <img src={produto.image} alt={produto.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl">🎉</div>
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

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">{produto.name}</h2>
                {produto.description && (
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{produto.description}</p>
                )}
              </div>

              {/* Destaque por tipo */}
              <PromoDestaque produto={produto} />
            </div>

            {/* Footer */}
            <div className="p-5 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1 shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white transition-all text-gray-600">
                    <FaMinus size={12} />
                  </button>
                  <span className="w-8 text-center font-black text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white transition-all text-gray-600">
                    <FaPlus size={12} />
                  </button>
                </div>

                <button onClick={handleAdd} disabled={disabled}
                  className={`flex-1 flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    disabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-green-600 text-white shadow-lg"
                  }`}>
                  <span>Adicionar ao carrinho</span>
                  <span>{formatPreco(totalPreco)}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}