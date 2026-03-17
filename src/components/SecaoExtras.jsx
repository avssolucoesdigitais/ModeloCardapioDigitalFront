/**
 * components/SecaoExtras.jsx
 *
 * Componente genérico para seções de extras (bordas, adicionais, bases…).
 * Substitui ExtraSection, AdicionaisList, SimpleItemSection, OptionList — todos idênticos.
 */

import { useState } from "react";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function SecaoExtras({ title, items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome.trim()) return;
    onChange([
      ...items,
      { nome: novo.nome.trim(), preco: parsePreco(novo.preco), id: Date.now() },
    ]);
    setNovo({ nome: "", preco: "" });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <h4 className="font-black text-gray-700 text-sm uppercase tracking-widest">{title}</h4>
        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-200">
          {items.length}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Lista */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {items.length === 0 && (
            <p className="text-center text-xs text-gray-400 italic py-4">Nenhum item ainda.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-white hover:border hover:border-gray-100 transition-all"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-700">{item.nome}</span>
                {item.preco > 0 && (
                  <span className="text-xs font-black text-amber-600">
                    + R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar novo */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <input
            placeholder="Nome do item"
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="w-full h-10 px-4 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-amber-200 outline-none transition-all"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
              <input
                placeholder="0,00 (opcional)"
                value={novo.preco}
                onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/[^\d.,]/g, "") })}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="w-full h-10 pl-8 pr-4 bg-gray-50 rounded-xl text-sm border border-transparent focus:bg-white focus:border-amber-200 outline-none transition-all font-medium"
              />
            </div>
            <button
              onClick={addItem}
              className="px-5 bg-gray-800 text-white rounded-xl text-xs font-black hover:bg-amber-500 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}