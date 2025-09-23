import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

function formatBRL(value) {
  const num = Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartPanel({ open, onClose, cart, onCheckout }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Fundo escuro */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Painel lateral */}
      <div className="w-[420px] h-full overflow-y-auto shadow-2xl flex flex-col p-6 bg-white">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Seu carrinho
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X />
          </button>
        </div>

        {/* Itens do carrinho */}
        <div className="flex-1 space-y-4">
          {cart.items.length === 0 && (
            <p className="text-gray-500">Seu carrinho está vazio.</p>
          )}

          {cart.items.map((l, idx) => (
            <div
              key={`${l.id || idx}-${l.size}-${l.flavors?.join("-") || ""}`}
              className="flex items-center gap-4 border rounded-2xl p-3 bg-white shadow"
            >
              {l.image && (
                <img
                  src={l.image}
                  alt={l.name}
                  className="w-16 h-16 object-cover rounded-xl"
                />
              )}

              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {l.name} {l.size && `(${l.size})`}
                </div>

                {/* Sabores se for meio a meio */}
                {Array.isArray(l.flavors) && l.flavors.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Sabores: {l.flavors.join(" + ")}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {formatBRL(l.price)}
                </div>

                {/* Botões de quantidade */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="p-1 rounded-lg border hover:bg-gray-50"
                    onClick={() => cart.dec(l.id, l.size)}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{l.qty}</span>
                  <button
                    className="p-1 rounded-lg border hover:bg-gray-50"
                    onClick={() => cart.add(l)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preço total do item */}
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatBRL(l.price * l.qty)}
                </div>
                <button
                  className="mt-2 text-xs text-red-500 hover:underline inline-flex items-center gap-1"
                  onClick={() => cart.remove(l.id, l.size)}
                >
                  <Trash2 className="w-3 h-3" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal */}
        <div className="mt-4 border-t pt-4 flex items-center justify-between text-gray-700">
          <div className="text-gray-600">Total</div>
          <div className="text-lg font-semibold">
            {formatBRL(cart.subtotal)}
          </div>
        </div>

        {/* Botão finalizar */}
        {cart.items.length > 0 && (
          <button
            onClick={onCheckout}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-2xl hover:opacity-90"
          >
            Finalizar Pedido no WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
