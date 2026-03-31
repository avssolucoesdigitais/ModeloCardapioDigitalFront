import { useEffect, useRef } from "react";
import { X, ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const parsePreco = (valor) => {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

const formatBRL = (value) => {
  return parsePreco(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function CartPanel({ open, onClose, cart, onCheckout }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open]);

  const totalCalc = cart.items.reduce(
    (acc, l) => acc + (l.qty || 1) * parsePreco(l.price),
    0
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — cobre tudo incluindo o header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Painel Lateral */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[201] w-full max-w-[450px] bg-gray-50 shadow-2xl flex flex-col"
            style={{ height: "100dvh" }}
          >
            {/* Header Fixo */}
            <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="text-blue-600" /> Meu Carrinho
                </h2>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {cart.items.length} {cart.items.length === 1 ? "item" : "itens"} selecionados
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Itens (Scrollable) */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingCart size={40} />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Seu carrinho está vazio.<br />Que tal adicionar algo gostoso?
                  </p>
                  <button onClick={onClose} className="text-blue-600 font-bold hover:underline">
                    Voltar para o cardápio
                  </button>
                </div>
              ) : (
                cart.items.map((l, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={`${l.id}-${l.size}-${idx}`}
                    className="flex gap-4 border-none rounded-[2rem] p-4 bg-white shadow-sm ring-1 ring-black/[0.03]"
                  >
                    {l.image && (
                      <img src={l.image} alt={l.name} className="w-20 h-20 object-cover rounded-2xl shadow-sm shrink-0" />
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="font-bold text-gray-800 leading-tight truncate">{l.name}</div>
                        {l.size && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                            {l.size}
                          </span>
                        )}
                        {l.flavors?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 italic">{l.flavors.join(" + ")}</p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600"
                            onClick={() => cart.dec(l.id, l.size)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-gray-700">{l.qty}</span>
                          <button
                            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600"
                            onClick={() => cart.add(l)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-gray-900">{formatBRL(parsePreco(l.price) * l.qty)}</span>
                      </div>
                    </div>

                    <button
                      className="text-gray-300 hover:text-red-500 transition-colors self-start shrink-0"
                      onClick={() => cart.remove(l.id, l.size)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Fixo (Total) */}
            {cart.items.length > 0 && (
              <div className="p-6 bg-white border-t space-y-4 shrink-0">
                <div className="flex items-center justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>{formatBRL(totalCalc)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-900 text-xl font-black">
                  <span>Total</span>
                  <span className="text-green-600">{formatBRL(totalCalc)}</span>
                </div>

                <button
                  onClick={onCheckout}
                  className="group w-full bg-gray-900 hover:bg-green-600 text-white py-4 rounded-[2rem] font-bold shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <span>Finalizar Pedido</span>
                  <div className="h-6 w-px bg-white/20" />
                  <span>{formatBRL(totalCalc)}</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}