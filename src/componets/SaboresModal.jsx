import { useState } from "react";

function SaboresModal({ open, onClose, products, onAdd, multiSabores }) {
  const [tamanho, setTamanho] = useState("media");
  const [sabores, setSabores] = useState([]);

  if (!open) return null;

  const pizzas = products.filter(
    (p) => p.category?.toLowerCase() === "pizza" && p.available !== false
  );

  const handleToggle = (sabor) => {
    if (sabores.find((s) => s.id === sabor.id)) {
      setSabores(sabores.filter((s) => s.id !== sabor.id));
    } else {
      setSabores([...sabores, sabor]);
    }
  };

  const handleConfirm = () => {
    if (sabores.length < 2) {
      return alert("Escolha pelo menos 2 sabores!");
    }

    // calcula média dos preços
    const prices = sabores.map((s) => Number(s.prices?.[tamanho] || 0));
    if (prices.some((p) => !p)) {
      return alert("Esse tamanho não está disponível para um dos sabores.");
    }
    const price = prices.reduce((a, b) => a + b, 0) / prices.length;

    onAdd({
      id: `pizza-mista-${tamanho}-${sabores.map((s) => s.id).join("-")}`,
      name: `Pizza ${sabores.length} Sabores`,
      flavors: sabores.map((s) => s.name),
      price,
      qty: 1,
      size: tamanho,
      image: sabores[0]?.image || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">
          🍕 Escolha {multiSabores ? "quantos sabores quiser" : "2 sabores"}
        </h2>

        {/* Escolher tamanho */}
        <select
          className="w-full border p-2 rounded mb-3"
          value={tamanho}
          onChange={(e) => setTamanho(e.target.value)}
        >
          <option value="pequena">Pequena</option>
          <option value="media">Média</option>
          <option value="grande">Grande</option>
        </select>

        {/* Lista de sabores */}
        <div className="max-h-60 overflow-y-auto border p-2 rounded mb-3">
          {pizzas.map((p) => {
            const preco = p.prices?.[tamanho];
            if (!preco) return null;
            const selected = sabores.find((s) => s.id === p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
                  selected ? "bg-yellow-100" : ""
                }`}
              >
                <input
                  type={multiSabores ? "checkbox" : "radio"}
                  checked={!!selected}
                  onChange={() => handleToggle(p)}
                />
                {p.name} - R$ {Number(preco).toFixed(2)}
              </label>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:opacity-90"
          >
            Adicionar
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaboresModal;
