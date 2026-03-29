/**
 * components/CustomizacaoModal.jsx
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const parsePreco = (valor) => {
  if (!valor) return 0;
  return parseFloat(String(valor).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
};

const formatBRL = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CustomizacaoModal({
  open,
  onClose,
  produto,
  painelConfig,
  docData,
  onConfirm,
  disabled,
}) {
  // ── Todos os hooks ANTES de qualquer return condicional ──
  const [selecoes, setSelecoes]     = useState({});
  const [tamanhoSel, setTamanhoSel] = useState("");
  const [qty, setQty]               = useState(1);

  // Inclui toggle, multiselect e extras-ref
  const camposCustom = useMemo(
    () => (painelConfig?.camposExtras ?? []).filter(
      (c) => c.tipo === "multiselect" || c.tipo === "extras-ref" || c.tipo === "toggle"
    ),
    [painelConfig]
  );

  const sizes = useMemo(
    () => Object.entries(produto?.prices || {}).filter(([s]) => s),
    [produto]
  );

  const hasMultipleSizes = sizes.length > 1;

  const precoBase = useMemo(() => {
    if (!produto) return 0;
    if (tamanhoSel) return parsePreco(produto.prices?.[tamanhoSel]);
    if (sizes.length === 1) return parsePreco(sizes[0][1]);
    return parsePreco(produto.preco || produto.price);
  }, [tamanhoSel, sizes, produto]);

  const extraUnitario = useMemo(() => {
    let extra = 0;
    camposCustom.forEach((campo) => {
      if (campo.tipo === "extras-ref") {
        const itens = docData?.[campo.extraId] ?? [];
        const selecionados = Array.isArray(selecoes[campo.key]) ? selecoes[campo.key] : [];
        selecionados.forEach((nome) => {
          const item = itens.find((i) => i.nome === nome);
          if (item?.preco > 0) extra += parsePreco(item.preco);
        });
      }
    });
    return extra;
  }, [camposCustom, docData, selecoes]);

  const precoTotal = useMemo(
    () => (precoBase + extraUnitario) * qty,
    [precoBase, extraUnitario, qty]
  );

  const podeContinuar = !hasMultipleSizes || !!tamanhoSel;

  // ── Return condicional após todos os hooks ──
  if (!open || !produto) return null;

  function toggleOpcao(key, opcao, max) {
    setSelecoes((prev) => {
      const atual = Array.isArray(prev[key]) ? prev[key] : [];
      if (atual.includes(opcao)) {
        return { ...prev, [key]: atual.filter((o) => o !== opcao) };
      }
      if (max === 1) return { ...prev, [key]: [opcao] };
      if (max && atual.length >= max) return prev;
      return { ...prev, [key]: [...atual, opcao] };
    });
  }

  function handleConfirmar() {
    if (hasMultipleSizes && !tamanhoSel) return;
    const size = tamanhoSel || (sizes.length === 1 ? sizes[0][0] : "único");

    onConfirm({
      id: produto.id,
      name: produto.name,
      category: produto.category,
      description: produto.description,
      price: precoBase + extraUnitario,
      size,
      image: produto.image,
      qty,
      customizacoes: selecoes,
      firstFlavorId: produto.id,
    });

    setSelecoes({});
    setTamanhoSel("");
    setQty(1);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-gray-50 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* HEADER com imagem */}
            <div className="relative w-full h-48 bg-gray-200 shrink-0">
              {produto.image
                ? <img src={produto.image} alt={produto.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl bg-orange-50">🍽️</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-12">
                <h2 className="text-xl font-black text-white leading-tight drop-shadow">{produto.name}</h2>
                {produto.description && (
                  <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{produto.description}</p>
                )}
              </div>
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                <X size={20} />
              </button>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">

              {/* Seleção de tamanho */}
              {hasMultipleSizes && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <p className="text-sm font-black text-gray-800">
                    Tamanho
                    <span className="ml-1 text-red-500 text-xs">*obrigatório</span>
                  </p>
                  <div className="grid gap-2">
                    {sizes.map(([size, preco]) => (
                      <button
                        key={size}
                        onClick={() => setTamanhoSel(size)}
                        className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                          tamanhoSel === size
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-100 bg-gray-50 hover:border-orange-200"
                        }`}
                      >
                        <span className="font-bold text-gray-700 text-sm">{size}</span>
                        <span className="text-orange-600 font-black text-sm">{formatBRL(parsePreco(preco))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campos de customização */}
              {camposCustom.map((campo) => {

                // ── Toggle: switch simples ──
                if (campo.tipo === "toggle") {
                  const ativo = !!selecoes[campo.key];
                  return (
                    <div key={campo.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setSelecoes((prev) => ({ ...prev, [campo.key]: !prev[campo.key] }))}
                      >
                        <span className="text-sm font-bold text-gray-800">{campo.label}</span>
                        <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${ativo ? "bg-orange-500" : "bg-gray-200"}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${ativo ? "translate-x-6" : "translate-x-0.5"}`} />
                        </div>
                      </div>
                    </div>
                  );
                }

                // ── Multiselect e extras-ref: chips clicáveis ──
                const opcoes = campo.tipo === "multiselect"
                  ? (campo.opcoes ?? []).map((nome) => ({ nome, preco: 0 }))
                  : (docData?.[campo.extraId] ?? []);

                if (opcoes.length === 0) return null;

                const selecionados = Array.isArray(selecoes[campo.key]) ? selecoes[campo.key] : [];
                const max = campo.max ?? null;

                return (
                  <div key={campo.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-gray-800">{campo.label}</p>
                      <span className="text-xs text-gray-400 font-medium">
                        {max === 1 ? "Escolha 1" : max ? `Até ${max}` : "Livre"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {opcoes.map((item) => {
                        const ativo = selecionados.includes(item.nome);
                        const bloqueado = !ativo && max && selecionados.length >= max && max > 1;
                        return (
                          <button
                            key={item.id ?? item.nome}
                            onClick={() => toggleOpcao(campo.key, item.nome, max)}
                            disabled={bloqueado}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                              ativo
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : bloqueado
                                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                  : "border-gray-100 bg-gray-50 text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                            }`}
                          >
                            {ativo && <span className="text-orange-500 font-black">✓</span>}
                            <span>{item.nome}</span>
                            {item.preco > 0 && (
                              <span className={`text-xs ${ativo ? "text-orange-400" : "text-gray-400"}`}>
                                +{formatBRL(item.preco)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selecionados.length > 0 && (
                      <p className="text-xs text-gray-400 pt-1">
                        Selecionado: <span className="font-bold text-gray-600">{selecionados.join(", ")}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FOOTER */}
            <div className="p-5 bg-white border-t flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 gap-1 shrink-0">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl hover:bg-white transition-all flex items-center justify-center font-bold text-xl text-gray-600">
                  −
                </button>
                <span className="w-10 text-center font-black text-gray-900 text-lg">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-xl hover:bg-white transition-all flex items-center justify-center font-bold text-xl text-gray-600">
                  +
                </button>
              </div>
              <button
                onClick={handleConfirmar}
                disabled={disabled || !podeContinuar}
                className={`flex-1 flex items-center justify-between px-5 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
                  disabled || !podeContinuar
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
                }`}
              >
                <span>Adicionar</span>
                <span>{formatBRL(precoTotal)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}