import { useState } from "react";

export default function BlocoBordas({ docData, setDocData, saveDocData }) {
  const [newBordaName, setNewBordaName] = useState("");
  const [newBordaPrice, setNewBordaPrice] = useState("");

  async function addBorda() {
    const nome = newBordaName.trim();
    const preco = parseFloat(newBordaPrice.replace(",", "."));
    if (!nome || isNaN(preco)) return;

    const next = {
      ...docData,
      bordas: [...(docData.bordas || []), { nome, preco }],
    };
    await saveDocData(next);
    setDocData(next);
    setNewBordaName("");
    setNewBordaPrice("");
  }

  async function removeBorda(idx) {
    const next = {
      ...docData,
      bordas: (docData.bordas || []).filter((_, i) => i !== idx),
    };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        🧀 Bordas Recheadas (Pizza)
      </h2>

      {/* Formulário */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Ex: Catupiry"
          value={newBordaName}
          onChange={(e) => setNewBordaName(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text"
          placeholder="Preço"
          value={newBordaPrice}
          onChange={(e) =>
            setNewBordaPrice(e.target.value.replace(/[^\d.,]/g, ""))
          }
          className="w-full sm:w-32 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={addBorda}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
        >
          Adicionar
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {(docData.bordas || []).map((b, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center bg-gray-50 border rounded-lg px-3 py-2"
          >
            <span className="font-medium text-gray-700">
              {b.nome} —{" "}
              <span className="text-gray-900">
                R$ {Number(b.preco).toFixed(2).replace(".", ",")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeBorda(idx)}
              className="text-red-600 font-bold hover:text-red-800"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
