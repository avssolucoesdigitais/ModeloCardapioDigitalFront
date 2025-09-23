import { useState } from "react";

export default function BlocoCombos({ docData, setDocData, saveDocData }) {
  const [newCombo, setNewCombo] = useState({ nome: "", descricao: "", preco: "" });

  async function addCombo() {
    const nome = (newCombo.nome || "").trim();
    const descricao = (newCombo.descricao || "").trim();
    const preco = Number(newCombo.preco);
    if (!nome || isNaN(preco)) return;
    const next = { ...docData, combos: [...(docData.combos || []), { nome, descricao, preco }] };
    await saveDocData(next);
    setDocData(next);
    setNewCombo({ nome: "", descricao: "", preco: "" });
  }

  async function removeCombo(idx) {
    const next = { ...docData, combos: (docData.combos || []).filter((_, i) => i !== idx) };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">🧩 Combos</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input type="text" placeholder="Nome do combo" value={newCombo.nome} onChange={(e) => setNewCombo((prev) => ({ ...prev, nome: e.target.value }))} className="border rounded-lg px-3 py-2" />
        <input type="text" placeholder="Descrição (opcional)" value={newCombo.descricao} onChange={(e) => setNewCombo((prev) => ({ ...prev, descricao: e.target.value }))} className="border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Preço" value={newCombo.preco} onChange={(e) => setNewCombo((prev) => ({ ...prev, preco: e.target.value }))} className="border rounded-lg px-3 py-2" />
      </div>
      <button type="button" onClick={addCombo} className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">➕ Adicionar Combo</button>

      <div className="space-y-1 mt-3">
        {(docData.combos || []).map((c, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border rounded">
            <div>
              <div className="font-semibold">{c.nome}</div>
              {c.descricao && <div className="text-sm text-gray-600">{c.descricao}</div>}
              <div className="text-sm font-medium">R$ {Number(c.preco).toFixed(2)}</div>
            </div>
            <button className="text-red-600" type="button" onClick={() => removeCombo(idx)}>❌ Remover</button>
          </div>
        ))}
      </div>
    </section>
  );
}
