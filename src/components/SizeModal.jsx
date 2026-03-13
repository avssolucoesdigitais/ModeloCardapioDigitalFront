import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler } from "lucide-react";

const formatBRL = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parsePreco = (valor) => {
  if (!valor) return 0;
  return parseFloat(String(valor).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
};

export default function SizeModal({ open, onClose, produto, onConfirm }) {
  if (!open || !produto) return null;

  const sizes = Object.entries(produto.prices || {}).filter(([size]) => size);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-gray-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* HEADER */}
            <div className="bg-white px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Ruler className="text-orange-500" size={20} />
                  Escolha o Tamanho
                </h2>
                <button onClick={onClose}
                  className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Info do produto */}
              {(produto.image || produto.name) && (
                <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  {produto.image && (
                    <img src={produto.image} alt={produto.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  )}
                  <div>
                    <h3 className="font-black text-gray-800 leading-tight">{produto.name}</h3>
                    {produto.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{produto.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Opções de tamanho */}
              <div className="grid gap-3">
                {sizes.map(([size, preco]) => (
                  <button
                    key={size}
                    onClick={() => { onConfirm(size, parsePreco(preco)); onClose(); }}
                    className="flex justify-between items-center p-4 rounded-2xl border-2 border-transparent bg-white shadow-sm hover:border-orange-500 hover:bg-orange-50 hover:ring-4 hover:ring-orange-50 transition-all group"
                  >
                    <span className="font-bold text-gray-700 group-hover:text-gray-900">
                      {size}
                    </span>
                    <span className="text-orange-600 font-black">
                      {formatBRL(preco)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 bg-white border-t">
              <button onClick={onClose}
                className="w-full py-4 rounded-2xl border-2 border-gray-100 text-gray-400 font-bold hover:bg-gray-50 transition-all">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}