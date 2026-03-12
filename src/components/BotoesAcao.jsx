/**
 * BotoesAcao — Componente padronizado de ações para cards de produto.
 *
 * Props:
 *  - onEditar     : () => void
 *  - onExcluir    : () => void
 *  - onToggle     : () => void
 *  - disponivel   : boolean
 *  - layout       : "col" (padrão) | "row"
 *  - formRef      : React.RefObject — ref do <section> do formulário para scroll suave
 */
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export default function BotoesAcao({ onEditar, onExcluir, onToggle, disponivel, layout = "col", formRef }) {
  const base = "w-10 h-10 flex items-center justify-center rounded-xl transition-all";
  const direction = layout === "row" ? "flex-row" : "flex-col";

  function handleEditar() {
    onEditar();
    // Aguarda 50ms para o estado atualizar antes de rolar até o formulário
    setTimeout(() => {
      if (formRef?.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  return (
    <div className={`flex ${direction} gap-2`}>
      {/* Editar */}
      <button
        onClick={handleEditar}
        title="Editar"
        className={`${base} bg-amber-50 text-amber-500 hover:bg-amber-100`}
      >
        <Pencil size={16} />
      </button>

      {/* Ativar / Desativar */}
      <button
        onClick={onToggle}
        title={disponivel ? "Desativar" : "Ativar"}
        className={`${base} ${disponivel ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
      >
        {disponivel ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {/* Excluir */}
      <button
        onClick={onExcluir}
        title="Excluir"
        className={`${base} bg-red-50 text-red-500 hover:bg-red-100`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}