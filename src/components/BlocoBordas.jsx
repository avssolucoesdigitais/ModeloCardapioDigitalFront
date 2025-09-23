import { useState } from "react";

export default function BlocoBordas({ docData, setDocData, saveDocData }) {
  const [newBordaName, setNewBordaName] = useState("");
  const [newBordaPrice, setNewBordaPrice] = useState("");

  async function addBorda() {
    const nome = newBordaName.trim();
    const preco = Number(newBordaPrice);
    if (!nome || isNaN(preco)) return;
    const next = { ...docData, bordas: [...(docData.bordas || []), { nome, preco }] };
    await saveDocData(next);
    setDocData(next);
    setNewBordaName("");
    setNewBordaPrice("");
  }

  async function removeBorda(idx) {
    const next = { ...docData, bordas: (docData.bordas || []).filter((_, i) => i !== idx) };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">🧀 Bordas Recheadas (Pizza)</h2>
      <div className="flex gap-2 mb-2">
        <input type="text" placeholder="Ex: Catupiry" value={newBordaName} onChange={(e) => setNewBordaName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Preço" value={newBordaPrice} onChange={(e) => setNewBordaPrice(e.target.value)} className="w-32 border rounded-lg px-3 py-2" />
        <button type="button" onClick={addBorda} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          ➕
        </button>
      </div>
      <div className="space-y-1">
        {(docData.bordas || []).map((b, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 border rounded">
            <span>{b.nome} — R$ {Number(b.preco).toFixed(2)}</span>
            <button type="button" className="text-red-600" onClick={() => removeBorda(idx)}>❌</button>
          </div>
        ))}
      </div>
    </section>
  );
}
