import { useState } from "react";

export default function BlocoBases({ docData, setDocData, saveDocData }) {
  const [newBaseName, setNewBaseName] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");

  async function addBase() {
    const nome = newBaseName.trim();
    const preco = Number(newBasePrice);
    if (!nome || isNaN(preco)) return;
    const next = { ...docData, bases: [...(docData.bases || []), { nome, preco }] };
    await saveDocData(next);
    setDocData(next);
    setNewBaseName("");
    setNewBasePrice("");
  }

  async function removeBase(idx) {
    const next = { ...docData, bases: (docData.bases || []).filter((_, i) => i !== idx) };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">🥄 Bases (Tamanhos do Açaí)</h2>
      <div className="flex gap-2 mb-2">
        <input type="text" placeholder="Ex: Copo 300ml" value={newBaseName} onChange={(e) => setNewBaseName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Preço" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} className="w-32 border rounded-lg px-3 py-2" />
        <button type="button" onClick={addBase} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          ➕
        </button>
      </div>
      <div className="space-y-1">
        {(docData.bases || []).map((b, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 border rounded">
            <span>{b.nome} — R$ {Number(b.preco).toFixed(2)}</span>
            <button type="button" className="text-red-600" onClick={() => removeBase(idx)}>❌</button>
          </div>
        ))}
      </div>
    </section>
  );
}
