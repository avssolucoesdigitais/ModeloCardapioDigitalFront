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
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        ➕ Adicionais da Categoria
      </h2>

      {/* Formulário */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Ex: Queijo extra"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value.replace(/[^\d.,]/g, ""))}
          className="w-full sm:w-32 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="button"
          onClick={addAdicional}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      {/* Lista */}
      <ul className="space-y-2">
        {(docData.adicionais || []).map((a, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center bg-gray-50 border rounded-lg px-3 py-2"
          >
            <span className="font-medium text-gray-700">
              {a.nome} —{" "}
              <span className="text-gray-900">
                R$ {a.preco.toFixed(2).replace(".", ",")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeAdicional(idx)}
              className="text-red-600 font-bold px-2 py-1 hover:text-red-800"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
