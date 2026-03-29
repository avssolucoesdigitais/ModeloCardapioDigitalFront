/**
 * components/FormProdutoGenerico.jsx
 *
 * Formulário genérico de produto.
 * Campos fixos: nome, descrição, imagem, preço/sizes, categoria, available.
 * Campos extras: renderizados dinamicamente via config.camposExtras[].
 *
 * Tipos de campo suportados:
 *   text        → <input type="text">
 *   number      → <input type="number">
 *   select      → <select> com opções fixas
 *   toggle      → switch booleano
 *   multiselect → chips clicáveis, salva array no produto  ← NOVO
 *   extras-ref  → seleciona itens de uma SecaoExtras existente ← NOVO
 */

import { useRef } from "react";
import { useState } from "react";
import uploadToCloudinary from "../utils/uploadToCloudinary";
import MultiSelectField from "./MultiSelectField";

export default function FormProdutoGenerico({
  config,
  produto,
  setProduto,
  editingIdx,
  onSalvar,
  onCancelar,
  loadingImg,
  setLoadingImg,
  // docData é necessário apenas para campos do tipo "extras-ref"
  docData,
}) {
  const inputFileRef = useRef(null);

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingImg(true);
    try {
      const url = await uploadToCloudinary(file);
      setProduto((prev) => ({ ...prev, image: url }));
    } catch (err) {
      alert("Erro no upload: " + err.message);
    } finally {
      setLoadingImg(false);
    }
  }

  const isEditing = editingIdx !== null;
  const nome = produto.nome || produto.name || "";

  // Separa campos por coluna para layout grid
  const camposEsquerda = config?.camposExtras?.filter(
    (c) => c.tipo === "text" || c.tipo === "number"
  ) ?? [];
  const camposDireita = config?.camposExtras?.filter(
    (c) => c.tipo === "select" || c.tipo === "toggle"
  ) ?? [];
  // Campos de largura total (multiselect e extras-ref ficam abaixo do grid)
  const camposLarguraTotal = config?.camposExtras?.filter(
    (c) => c.tipo === "multiselect" || c.tipo === "extras-ref"
  ) ?? [];

  return (
    <section className={`p-6 rounded-2xl shadow-lg transition-all ${
      isEditing
        ? "bg-amber-50 border-2 border-amber-400"
        : "bg-white border border-gray-100"
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-800">
          {config?.icone} {isEditing ? `Editando ${config?.nome}` : `Novo ${config?.nome}`}
        </h2>
        {isEditing && (
          <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full animate-pulse">
            EDITANDO
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Coluna esquerda ── */}
        <div className="space-y-4">

          {/* Nome */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nome</span>
            <input
              placeholder={`Ex: ${config?.nome} Especial`}
              value={nome}
              onChange={(e) =>
                setProduto({ ...produto, nome: e.target.value, name: e.target.value })
              }
              className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
            />
          </label>

          {/* Descrição */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Descrição</span>
            <textarea
              placeholder="Descreva os ingredientes..."
              value={produto.description ?? ""}
              onChange={(e) => setProduto({ ...produto, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all resize-none"
            />
          </label>

          {/* Campos extras: text e number */}
          {camposEsquerda.map((campo) => (
            <label key={campo.key} className="block">
              <span className="text-sm font-medium text-gray-700">{campo.label}</span>
              <input
                type={campo.tipo === "number" ? "number" : "text"}
                placeholder={campo.placeholder ?? ""}
                value={produto[campo.key] ?? ""}
                onChange={(e) => setProduto({ ...produto, [campo.key]: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none transition-all"
              />
            </label>
          ))}
        </div>

        {/* ── Coluna direita ── */}
        <div className="space-y-4">

          {/* Preço simples */}
          {!config?.usaSizes && (
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-medium text-gray-700">Preço (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={produto.preco ?? ""}
                  onChange={(e) => setProduto({ ...produto, preco: e.target.value })}
                  className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </label>
              {config?.categorias?.length > 0 && (
                <label>
                  <span className="text-sm font-medium text-gray-700">Categoria</span>
                  <select
                    value={produto.categoria ?? ""}
                    onChange={(e) => setProduto({ ...produto, categoria: e.target.value })}
                    className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                  >
                    {config.categorias.map((cat) => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* Sizes + preços por tamanho */}
          {config?.usaSizes && (
            <div className="space-y-3">
              <span className="text-sm font-medium text-gray-700">Tamanhos e Preços</span>
              <SizesEditor
                sizes={produto.sizes ?? []}
                prices={produto.prices ?? {}}
                onChange={(sizes, prices) => setProduto({ ...produto, sizes, prices })}
              />
              {config?.categorias?.length > 0 && (
                <label>
                  <span className="text-sm font-medium text-gray-700">Categoria</span>
                  <select
                    value={produto.categoria ?? ""}
                    onChange={(e) => setProduto({ ...produto, categoria: e.target.value })}
                    className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                  >
                    {config.categorias.map((cat) => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* Campos extras: select */}
          {camposDireita.filter((c) => c.tipo === "select").map((campo) => (
            <label key={campo.key} className="block">
              <span className="text-sm font-medium text-gray-700">{campo.label}</span>
              <select
                value={produto[campo.key] ?? ""}
                onChange={(e) => setProduto({ ...produto, [campo.key]: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none"
              >
                <option value="">Selecione...</option>
                {campo.opcoes?.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </label>
          ))}

          {/* Campos extras: toggle */}
          {camposDireita.filter((c) => c.tipo === "toggle").map((campo) => (
            <label key={campo.key} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setProduto({ ...produto, [campo.key]: !produto[campo.key] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  produto[campo.key] ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  produto[campo.key] ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{campo.label}</span>
            </label>
          ))}

          {/* Upload de imagem */}
          <div className="flex items-center gap-4">
            <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-400 cursor-pointer transition-colors bg-gray-50">
              {loadingImg
                ? <span className="animate-pulse text-amber-600 font-medium">Enviando...</span>
                : (<><span className="text-2xl">📸</span><span className="text-xs text-gray-400 font-medium">Foto do produto</span></>)
              }
              <input
                ref={inputFileRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            {produto.image && (
              <div className="relative shrink-0">
                <img
                  src={produto.image}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-xl shadow-md"
                />
                <button
                  onClick={() => setProduto({ ...produto, image: "" })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
                >✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Campos de largura total: multiselect e extras-ref ── */}
      {camposLarguraTotal.length > 0 && (
        <div className="mt-5 space-y-5 pt-5 border-t border-gray-100">
          {camposLarguraTotal.map((campo) => {

            // ── multiselect: chips de opções fixas ──
            if (campo.tipo === "multiselect") {
              return (
                <MultiSelectField
                  key={campo.key}
                  campo={campo}
                  value={produto[campo.key]}
                  onChange={(val) => setProduto({ ...produto, [campo.key]: val })}
                />
              );
            }

            // ── extras-ref: seleciona itens de uma SecaoExtras existente ──
            // campo.extraId deve corresponder ao id de um extra em config.extras[]
            if (campo.tipo === "extras-ref") {
              const itensDisponiveis = docData?.[campo.extraId] ?? [];
              const selecionados = Array.isArray(produto[campo.key])
                ? produto[campo.key]
                : [];

              function toggleExtrasRef(itemNome) {
                if (selecionados.includes(itemNome)) {
                  setProduto({ ...produto, [campo.key]: selecionados.filter((s) => s !== itemNome) });
                } else {
                  setProduto({ ...produto, [campo.key]: [...selecionados, itemNome] });
                }
              }

              if (itensDisponiveis.length === 0) {
                // Busca o label da seção extra correspondente
                const secaoLabel = config?.extras?.find((e) => e.id === campo.extraId)?.label ?? campo.extraId;
                return (
                  <div key={campo.key} className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">{campo.label}</span>
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-700">
                          Nenhum item cadastrado em "{secaoLabel}"
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Role até a seção <strong>"{secaoLabel}"</strong> no final desta página,
                          adicione os itens lá e eles aparecerão aqui automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={campo.key} className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">{campo.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {itensDisponiveis.map((item) => {
                      const ativo = selecionados.includes(item.nome);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleExtrasRef(item.nome)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            ativo
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                              : "bg-gray-100 text-gray-600 border-gray-200 hover:border-amber-400 hover:bg-amber-50"
                          }`}
                        >
                          {ativo && <span className="mr-1">✓</span>}
                          {item.nome}
                          {item.preco > 0 && (
                            <span className={`ml-1 ${ativo ? "text-amber-100" : "text-gray-400"}`}>
                              +R${Number(item.preco).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selecionados.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selecionados.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                          {s}
                          <button type="button" onClick={() => toggleExtrasRef(s)} className="hover:text-amber-600 text-amber-500 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onSalvar}
          className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow transition-transform active:scale-95"
        >
          {isEditing ? "Salvar Alterações" : `Adicionar ${config?.nome}`}
        </button>
        {isEditing && (
          <button
            onClick={onCancelar}
            className="px-6 h-12 bg-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SizesEditor — sem alterações
// ─────────────────────────────────────────────

const SIZES_SUGERIDOS = ["P", "M", "G", "GG", "Único", "Brotinho", "Família"];

function SizesEditor({ sizes, prices, onChange }) {
  const [novoSize, setNovoSize] = useState("");

  function addSize(size) {
    const s = size.trim().toUpperCase();
    if (!s || sizes.includes(s)) return;
    onChange([...sizes, s], { ...prices, [s]: "" });
    setNovoSize("");
  }

  function removeSize(s) {
    const novosSizes = sizes.filter((x) => x !== s);
    const novosPrecos = { ...prices };
    delete novosPrecos[s];
    onChange(novosSizes, novosPrecos);
  }

  function updatePreco(s, val) {
    onChange(sizes, { ...prices, [s]: val });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SIZES_SUGERIDOS.map((s) => (
          <button
            key={s}
            onClick={() => addSize(s)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              sizes.includes(s.toUpperCase())
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:border-amber-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Tamanho personalizado"
          value={novoSize}
          onChange={(e) => setNovoSize(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSize(novoSize)}
          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          onClick={() => addSize(novoSize)}
          className="px-4 h-9 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-amber-500 transition-colors"
        >
          +
        </button>
      </div>
      {sizes.length > 0 && (
        <div className="space-y-2">
          {sizes.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-16 text-xs font-bold text-gray-600 uppercase">{s}</span>
              <span className="text-xs text-gray-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={prices[s] ?? ""}
                onChange={(e) => updatePreco(s, e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => removeSize(s)}
                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}