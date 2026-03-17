/**
 * components/paineis/PainelGenerico.jsx
 *
 * Substitui todos os painéis específicos (PainelPizza, PainelBatata, etc.)
 * Recebe lojaId + painelId e renderiza tudo dinamicamente via config do Firestore.
 */

import { useState, useRef } from "react";
import { usePainel, parsePreco } from "../../hooks/usePainel";
import FormProdutoGenerico from "../FormProdutoGenerico";
import BotoesAcao from "../BotoesAcao";
import SecaoExtras from "../SecaoExtras";

export default function PainelGenerico({ lojaId, painelId }) {
  const formRef = useRef(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const {
    config,
    docData,
    loading,
    erro,
    saveProduto,
    toggleProduto,
    deleteProduto,
    saveExtras,
    getProdutoVazio,
  } = usePainel(lojaId, painelId);

  const [produto, setProduto] = useState(null);

  // Inicializa produto vazio quando config carregar
  if (config && produto === null) {
    setProduto(getProdutoVazio());
  }

  function resetForm() {
    setProduto(getProdutoVazio());
    setEditingIdx(null);
  }

  async function handleSalvar() {
    const nome = produto.nome || produto.name || "";
    const temPreco = config?.usaSizes
      ? produto.sizes?.length > 0
      : produto.preco;

    if (!nome || !temPreco) {
      alert("Preencha pelo menos o nome e o preço.");
      return;
    }

    await saveProduto(produto, editingIdx);
    resetForm();
  }

  function handleEditar(p, idx) {
    setProduto({ ...p, preco: p.preco?.toString() ?? "" });
    setEditingIdx(idx);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Estados de carregamento e erro ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-600 font-medium">{erro}</p>
      </div>
    );
  }

  if (!config || !docData || !produto) return null;

  const produtos = docData.produtos ?? [];

  // Agrupa por categoria (se houver categorias configuradas)
  const grupos = config.categorias?.length > 0
    ? config.categorias.map((cat) => ({
        nome: cat,
        itens: produtos.filter((p) => p.categoria === cat),
      }))
    : [{ nome: null, itens: produtos }]; // sem agrupamento

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-8">

      {/* Formulário */}
      <div ref={formRef}>
        <FormProdutoGenerico
          config={config}
          produto={produto}
          setProduto={setProduto}
          editingIdx={editingIdx}
          onSalvar={handleSalvar}
          onCancelar={resetForm}
          loadingImg={loadingImg}
          setLoadingImg={setLoadingImg}
        />
      </div>

      {/* Lista de produtos */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-800">
            {config.icone} {config.nome} no Cardápio
          </h3>
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-400">
            {produtos.length} {produtos.length === 1 ? "item" : "itens"}
          </span>
        </div>

        <div className="p-6 space-y-10">
          {grupos.map(({ nome: cat, itens }) => (
            <div key={cat ?? "todos"} className="space-y-4">

              {/* Cabeçalho de categoria */}
              {cat && (
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-gray-100" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {cat}
                  </h4>
                  <span className="h-px flex-1 bg-gray-100" />
                </div>
              )}

              {itens.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 text-sm">Nenhum item{cat ? ` em "${cat}"` : ""} ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {itens.map((p) => {
                    const realIdx = produtos.indexOf(p);
                    return (
                      <CardProduto
                        key={p.id ?? realIdx}
                        produto={p}
                        config={config}
                        formRef={formRef}
                        onEditar={() => handleEditar(p, realIdx)}
                        onToggle={() => toggleProduto(realIdx)}
                        onExcluir={() => {
                          if (confirm(`Excluir "${p.nome || p.name}"?`)) {
                            deleteProduto(p.id);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {produtos.length === 0 && config.categorias?.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
              Nenhum produto cadastrado ainda.
            </div>
          )}
        </div>
      </section>

      {/* Seções extras (bordas, adicionais, bases…) */}
      {config.extras?.length > 0 && (
        <div className={`grid grid-cols-1 gap-6 ${
          config.extras.length > 1 ? "lg:grid-cols-" + Math.min(config.extras.length, 3) : ""
        }`}>
          {config.extras.map((extra) => (
            <SecaoExtras
              key={extra.id}
              title={extra.label}
              items={docData[extra.id] ?? []}
              onChange={(items) => saveExtras(extra.id, items)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Card de produto na listagem
// ─────────────────────────────────────────────

function CardProduto({ produto, config, formRef, onEditar, onToggle, onExcluir }) {
  const nome = produto.nome || produto.name || "Sem nome";
  const disponivel = produto.available !== false;

  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border transition-all ${
      !disponivel
        ? "bg-gray-50 border-gray-100 opacity-60 grayscale"
        : "bg-white border-gray-100 hover:border-amber-200 hover:shadow-md"
    }`}>

      {/* Imagem */}
      <div className="relative shrink-0">
        <img
          src={produto.image || "https://via.placeholder.com/100"}
          alt={nome}
          className="w-24 h-24 rounded-xl object-cover border border-gray-100"
        />
        {!disponivel && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-white font-bold text-xs">
            Inativo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 text-lg leading-tight truncate">{nome}</h4>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{produto.description}</p>

        {/* Preço simples */}
        {!config.usaSizes && produto.preco !== undefined && (
          <p className="text-amber-600 font-black mt-2">
            R$ {parsePreco(produto.preco).toFixed(2).replace(".", ",")}
          </p>
        )}

        {/* Sizes */}
        {config.usaSizes && produto.sizes?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {produto.sizes.map((s) => (
              <span
                key={s}
                className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100"
              >
                {s}: R$ {parsePreco(produto.prices?.[s]).toFixed(2).replace(".", ",")}
              </span>
            ))}
          </div>
        )}

        {/* Campos extras exibidos */}
        {config.camposExtras?.filter((c) => c.tipo !== "toggle").map((campo) =>
          produto[campo.key] ? (
            <span key={campo.key} className="inline-block mt-1 mr-2 text-xs text-gray-400">
              {campo.label}: <strong className="text-gray-600">{produto[campo.key]}</strong>
            </span>
          ) : null
        )}
      </div>

      {/* Ações */}
      <div className="flex sm:flex-col justify-end items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
        <BotoesAcao
          formRef={formRef}
          disponivel={disponivel}
          onEditar={onEditar}
          onToggle={onToggle}
          onExcluir={onExcluir}
        />
      </div>
    </div>
  );
}