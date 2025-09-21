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

  // 🔹 Mensagem de sucesso
  toast.success(`✅ ${item.name} (${item.size || "único"}) foi adicionado ao carrinho!`);
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
