/**
 * components/MultiSelectField.jsx
 *
 * Campo de seleção múltipla com chips clicáveis.
 * Usado para: Guarnições, Proteínas, Acompanhamentos, etc.
 *
 * Props:
 *   campo  — { key, label, opcoes: string[], max?: number }
 *   value  — array de strings selecionadas (produto[campo.key])
 *   onChange — (novoArray) => void
 */
export default function MultiSelectField({ campo, value = [], onChange }) {
  const selecionados = Array.isArray(value) ? value : [];
  const max = campo.max ?? Infinity;

  function toggle(opcao) {
    if (selecionados.includes(opcao)) {
      onChange(selecionados.filter((s) => s !== opcao));
    } else {
      if (selecionados.length >= max) return; // respeita limite
      onChange([...selecionados, opcao]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{campo.label}</span>
        {campo.max && (
          <span className="text-xs text-gray-400">
            {selecionados.length}/{campo.max} selecionados
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {campo.opcoes?.map((opcao) => {
          const ativo = selecionados.includes(opcao);
          const bloqueado = !ativo && selecionados.length >= max;
          return (
            <button
              key={opcao}
              type="button"
              onClick={() => toggle(opcao)}
              disabled={bloqueado}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${ativo
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : bloqueado
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:border-amber-400 hover:bg-amber-50"
                }`}
            >
              {ativo && <span className="mr-1">✓</span>}
              {opcao}
            </button>
          );
        })}
      </div>
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selecionados.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:text-amber-600 text-amber-500 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}