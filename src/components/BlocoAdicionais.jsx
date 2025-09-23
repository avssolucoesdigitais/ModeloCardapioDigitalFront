import { useState } from "react";

export default function BlocoAdicionais({ docData, setDocData, saveDocData }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  async function addAdicional() {
    if (!nome || !preco) return;
    const valor = parseFloat(preco.replace(",", "."));
    if (isNaN(valor)) {
      alert("Preço inválido");
      return;
    }

    const next = {
      ...docData,
      adicionais: [...(docData.adicionais || []), { nome, preco: valor }],
    };

    await saveDocData(next);
    setDocData(next);
    setNome("");
    setPreco("");
  }

  async function removeAdicional(idx) {
    const next = {
      ...docData,
      adicionais: (docData.adicionais || []).filter((_, i) => i !== idx),
    };
    await saveDocData(next);
    setDocData(next);
  }

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <h2 className="font-bold text-lg">➕ Adicionais da Categoria</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ex: Queijo extra"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value.replace(/[^\d.,]/g, ""))}
          className="w-32 border rounded px-2 py-1"
        />
        <button
          onClick={addAdicional}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          +
        </button>
      </div>

      <ul className="space-y-1">
        {(docData.adicionais || []).map((a, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center border px-2 py-1 rounded"
          >
            <span>
              {a.nome} — R$ {a.preco.toFixed(2).replace(".", ",")}
            </span>
            <button
              onClick={() => removeAdicional(idx)}
              className="text-red-500 font-bold"
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
