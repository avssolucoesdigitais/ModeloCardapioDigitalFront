import { useState } from "react";
import toast from "react-hot-toast";

export default function useCart() {
  const [items, setItems] = useState([]);

  const add = (item) => {
    setItems((prev) => {
      const key = `${item.id}-${item.size || "único"}`;
      const exists = prev.find((i) => `${i.id}-${i.size}` === key);

      if (exists) {
        return prev.map((i) =>
          `${i.id}-${i.size}` === key ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });

    toast.custom(
      (t) => (
        <div className={`flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl transition-all ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <span className="text-sm font-bold">✅ {item.name} adicionado ao carrinho!</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-1 text-white/40 hover:text-white transition-colors text-base leading-none"
          >
            ✕
          </button>
        </div>
      ),
      { position: "bottom-center", duration: 3000 }
    );
  };

  const dec = (id, size) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id && i.size === size ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (id, size) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  const clear = () => setItems([]);

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);

  return { items, add, dec, remove, clear, subtotal };
}