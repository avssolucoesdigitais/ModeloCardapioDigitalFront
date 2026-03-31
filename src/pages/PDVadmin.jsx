/**
 * pages/PDVAdmin.jsx — PDV standalone com customizações corretas
 *
 * Lógica de customização idêntica ao CustomizacaoModal do cliente:
 *  - painelConfig.camposExtras (não "campos")
 *  - extras-ref lidos de docData[campo.extraId]
 *  - seleções são arrays de nomes (strings)
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../firebase";
import {
  collection, doc, getDocs, getDoc, onSnapshot, updateDoc, addDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiX, FiPlus, FiMinus, FiCheck,
  FiTrash2, FiShoppingCart, FiWifi,
} from "react-icons/fi";
import { MdTableRestaurant } from "react-icons/md";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parsePreco(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return isNaN(valor) ? 0 : valor;
  const str = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function formatBRL(val) {
  return parsePreco(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Gera resumo textual das customizações para a comanda
function resumoCustomizacoes(selecoes, camposCustom) {
  if (!selecoes || !camposCustom) return [];
  const linhas = [];
  camposCustom.forEach((campo) => {
    const val = selecoes[campo.key];
    if (!val) return;
    if (campo.tipo === "toggle" && val === true) linhas.push(campo.label);
    else if ((campo.tipo === "multiselect" || campo.tipo === "extras-ref") && Array.isArray(val) && val.length > 0)
      linhas.push(`${campo.label}: ${val.join(", ")}`);
  });
  return linhas;
}

const STATUS_META = {
  livre:      { label: "Livre",      dot: "bg-emerald-400", border: "border-white/10", hover: "hover:border-emerald-400/60", cursor: "cursor-pointer" },
  ocupada:    { label: "Ocupada",    dot: "bg-red-400",     border: "border-red-500/40", hover: "", cursor: "cursor-default" },
  aguardando: { label: "Aguardando", dot: "bg-amber-400",   border: "border-amber-500/40", hover: "", cursor: "cursor-default" },
};

const PAGAMENTO_OPTS = [
  { value: "pix",      label: "PIX",      icon: "💠" },
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "cartão",   label: "Cartão",   icon: "💳" },
];

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function PDVAdmin() {
  const { lojaSlug } = useParams();
  const LOJA_ID = lojaSlug;

  const [mesas, setMesas]       = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [paineis, setPaineis]   = useState([]);
  const [loadingBase, setLoadingBase] = useState(true);

  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [carrinho, setCarrinho]               = useState([]);
  const [search, setSearch]                   = useState("");
  const [categoriaAtiva, setCategoriaAtiva]   = useState("Todas");

  // Fluxo de customização
  const [produtoAtivo, setProdutoAtivo]   = useState(null);
  const [painelConfig, setPainelConfig]   = useState(null); // doc de paineis
  const [docData, setDocData]             = useState(null); // doc de opcoes (tem os extras)
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Modal pagamento
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [formaPagamento, setFormaPagamento]   = useState("pix");
  const [nomeCliente, setNomeCliente]         = useState("");
  const [salvando, setSalvando]               = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = `PDV — ${LOJA_ID ?? ""}`; }, [LOJA_ID]);

  // ── Mesas realtime ──
  useEffect(() => {
    if (!LOJA_ID) return;
    const unsub = onSnapshot(collection(db, "lojas", LOJA_ID, "mesas"), (snap) => {
      setMesas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99)));
    });
    return () => unsub();
  }, [LOJA_ID]);

  // ── Produtos + painéis ──
  useEffect(() => {
    if (!LOJA_ID) return;
    (async () => {
      setLoadingBase(true);

      const paineisSnap = await getDocs(collection(db, "lojas", LOJA_ID, "paineis"));
      const paineisLista = paineisSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.ativo !== false)
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      setPaineis(paineisLista);

      const opcoesSnap = await getDocs(collection(db, "lojas", LOJA_ID, "opcoes"));
      const arr = [];
      opcoesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        (data.produtos || []).forEach((p, idx) => {
          if (p.available === false) return;
          // Normaliza prices para valores numéricos
          let prices = {};
          if (p.prices && Object.keys(p.prices).length > 0) {
            Object.entries(p.prices).forEach(([k, v]) => {
              const n = parsePreco(v);
              if (n > 0) prices[k] = n;
            });
          }
          if (Object.keys(prices).length === 0) {
            const pb = parsePreco(p.preco || p.price);
            if (pb > 0) prices["único"] = pb;
          }
          arr.push({
            id: p.id || `${docSnap.id}-${idx}`,
            ...p,
            name: p.nome || p.name || "Sem nome",
            description: p.desc || p.description || "",
            category: docSnap.id,   // ex: "Açaí"
            opcaoDocId: docSnap.id, // id do doc em opcoes/
            prices,
          });
        });
      });
      setProdutos(arr);
      setLoadingBase(false);
    })();
  }, [LOJA_ID]);

  const categorias = useMemo(
    () => ["Todas", ...paineis.map((p) => p.opcaoId).filter(Boolean)], [paineis]
  );
  const labelCategoria = (id) =>
    id === "Todas" ? "Todas" : paineis.find((p) => p.opcaoId === id)?.nome ?? id;

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchCat = categoriaAtiva === "Todas" || p.category === categoriaAtiva;
      const q = search.toLowerCase();
      return matchCat && (!q || (p.name || "").toLowerCase().includes(q));
    });
  }, [produtos, categoriaAtiva, search]);

  // ── Toast ──
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  // ── Abre modal ao clicar no produto ──
  // Busca painelConfig (camposExtras) e docData (extras arrays) do Firestore
  async function handleProdutoClick(produto) {
    if (!mesaSelecionada) return;
    setProdutoAtivo(produto);
    setPainelConfig(null);
    setDocData(null);
    setLoadingConfig(true);

    try {
      // 1. Encontra o painel cujo opcaoId bate com a categoria do produto
      const painel = paineis.find((p) => p.opcaoId === produto.opcaoDocId);

      if (painel) {
        // 2. Busca o doc do painel (tem camposExtras)
        const painelSnap = await getDoc(doc(db, "lojas", LOJA_ID, "paineis", painel.id));
        if (painelSnap.exists()) setPainelConfig(painelSnap.data());

        // 3. Busca o doc de opcoes (tem os arrays de extras, ex: docData.cobertura)
        const opcaoSnap = await getDoc(doc(db, "lojas", LOJA_ID, "opcoes", produto.opcaoDocId));
        if (opcaoSnap.exists()) setDocData(opcaoSnap.data());
      }
    } finally {
      setLoadingConfig(false);
    }
  }

  // ── Recebe seleções do CustomizacaoPDV e adiciona ao carrinho ──
  function adicionarComCustom({ tamanho, selecoes, camposCustom }) {
    const produto = produtoAtivo;
    const size = tamanho || Object.keys(produto.prices)[0] || "único";
    const precoBase = produto.prices[size] ?? 0;

    // Soma extras com preço
    let adicional = 0;
    camposCustom.forEach((campo) => {
      if (campo.tipo === "extras-ref") {
        const itens = docData?.[campo.extraId] ?? [];
        const selecionados = Array.isArray(selecoes[campo.key]) ? selecoes[campo.key] : [];
        selecionados.forEach((nome) => {
          const item = itens.find((i) => i.nome === nome);
          if (item?.preco > 0) adicional += parsePreco(item.preco);
        });
      }
    });

    const precoFinal = precoBase + adicional;
    const resumo = resumoCustomizacoes(selecoes, camposCustom);
    // Chave única por produto+tamanho+seleções
    const selKey = Object.keys(selecoes).length > 0 ? JSON.stringify(selecoes) : "";
    const key = `${produto.id}-${size}-${btoa(unescape(encodeURIComponent(selKey))).slice(0, 12)}`;

    setCarrinho((prev) => {
      const existe = prev.find((i) => i.key === key);
      if (existe) return prev.map((i) => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        key, id: produto.id, name: produto.name,
        size, price: precoFinal, qty: 1,
        image: produto.image,
        customizacoes: selecoes,
        resumoCustom: resumo,
      }];
    });

    setProdutoAtivo(null);
    setPainelConfig(null);
    setDocData(null);
    showToast(`${produto.name} adicionado`);
  }

  function fecharModal() {
    setProdutoAtivo(null);
    setPainelConfig(null);
    setDocData(null);
  }

  function alterarQty(key, delta) {
    setCarrinho((prev) =>
      prev.map((i) => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter((i) => i.qty > 0)
    );
  }

  const totalCarrinho = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.price * i.qty, 0), [carrinho]
  );

  function selecionarMesa(mesa) {
    setMesaSelecionada(mesa);
    setCarrinho([]);
    setSearch("");
    setCategoriaAtiva("Todas");
    setNomeCliente("");
  }

  async function confirmarPedido() {
    if (!mesaSelecionada || carrinho.length === 0) return;
    setSalvando(true);
    try {
      const orderNumber = Date.now().toString().slice(-6);
      await addDoc(collection(db, "lojas", LOJA_ID, "orders"), {
        orderNumber, lojaId: LOJA_ID,
        customer: nomeCliente || mesaSelecionada.nome,
        phone: "", address: mesaSelecionada.nome,
        deliveryType: "mesa", mesa: mesaSelecionada.nome, mesaId: mesaSelecionada.id,
        paymentMethod: formaPagamento,
        items: carrinho.map(({ key, resumoCustom, ...rest }) => rest),
        subtotal: totalCarrinho, taxaEntrega: 0, desconto: 0, total: totalCarrinho,
        observacao: "", status: "PENDENTE", createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "lojas", LOJA_ID, "mesas", mesaSelecionada.id), {
        status: "ocupada", pedidoAtual: orderNumber,
        total: totalCarrinho, cliente: nomeCliente || "",
      });
      setMesaSelecionada(null); setCarrinho([]);
      setPagamentoAberto(false); setFormaPagamento("pix"); setNomeCliente("");
      showToast("Pedido lançado!");
    } finally { setSalvando(false); }
  }

  async function liberarMesa(mesa) {
    if (!confirm(`Liberar ${mesa.nome}?`)) return;
    await updateDoc(doc(db, "lojas", LOJA_ID, "mesas", mesa.id), {
      status: "livre", pedidoAtual: null, total: 0, cliente: "",
    });
  }

  if (loadingBase) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a1628]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Carregando PDV…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a1628] overflow-hidden select-none">

      {/* ══ TOPBAR ══ */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 bg-[#060f1e] border-b border-white/10">
        <span className="text-white font-black text-sm tracking-widest uppercase">{LOJA_ID}</span>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <FiWifi size={13} />
          Sistema Online
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── COL 1: Mesas ── */}
        <aside className="w-48 shrink-0 flex flex-col bg-[#0d1e35] border-r border-white/10 overflow-y-auto">
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mesas</p>
            <p className="text-[11px] text-white/40 mt-0.5">
              {mesas.filter((m) => m.status === "livre").length} livres ·{" "}
              {mesas.filter((m) => m.status === "ocupada").length} ocupadas
            </p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {mesas.map((mesa) => {
              const s = STATUS_META[mesa.status] ?? STATUS_META.livre;
              const selected = mesaSelecionada?.id === mesa.id;
              const livre = mesa.status === "livre";
              return (
                <button
                  key={mesa.id}
                  onClick={() => livre ? selecionarMesa(mesa) : null}
                  className={`relative flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border bg-white/5 transition-all duration-150
                    ${selected ? "!bg-blue-600 !border-blue-400 shadow-lg shadow-blue-900/60" : `${s.border} ${s.hover}`}
                    ${s.cursor} ${livre && !selected ? "active:scale-95" : ""}`}
                >
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${selected ? "bg-white" : s.dot}`} />
                  <MdTableRestaurant size={20} className={selected ? "text-white" : "text-white/60"} />
                  <p className={`text-[11px] font-bold text-center leading-tight ${selected ? "text-white" : "text-white/80"}`}>{mesa.nome}</p>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${selected ? "text-blue-200" : "text-white/30"}`}>{s.label}</span>
                  {mesa.status === "ocupada" && mesa.total > 0 && (
                    <span className="text-[10px] font-black text-red-400">{formatBRL(mesa.total)}</span>
                  )}
                  {mesa.status === "ocupada" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); liberarMesa(mesa); }}
                      className="mt-0.5 px-2 py-0.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white/40 hover:text-red-400 text-[9px] font-bold rounded-md transition-colors"
                    >
                      Liberar
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── COL 2: Produtos ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
          <div className="h-14 shrink-0 flex items-center gap-3 px-5 bg-white border-b border-gray-200">
            {mesaSelecionada ? (
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-lg shadow-sm shadow-blue-300">{mesaSelecionada.nome}</span>
                <span className="text-xs text-gray-400">{carrinho.reduce((a, i) => a + i.qty, 0)} item(s)</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-400 shrink-0">← Selecione uma mesa</span>
            )}
            <div className="flex-1 max-w-lg mx-auto relative">
              <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                placeholder="Buscar produto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!mesaSelecionada}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 disabled:opacity-40 transition-all"
              />
            </div>
            {mesaSelecionada && (
              <button
                onClick={() => { setMesaSelecionada(null); setCarrinho([]); }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 text-xs font-semibold transition-colors shrink-0"
              >
                <FiX size={12} /> Cancelar
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide shrink-0">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                disabled={!mesaSelecionada}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all disabled:opacity-40
                  ${categoriaAtiva === cat ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}
              >
                {labelCategoria(cat)}
              </button>
            ))}
          </div>

          {/* Grid de produtos */}
          <div className="flex-1 overflow-y-auto p-5">
            {!mesaSelecionada ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <MdTableRestaurant size={30} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Selecione uma mesa livre para iniciar o atendimento</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {produtosFiltrados.map((produto) => {
                  const sizes = Object.entries(produto.prices || {});
                  const temVarios = sizes.length > 1;
                  const precoMinimo = temVarios ? Math.min(...sizes.map(([, v]) => v)) : sizes[0]?.[1] ?? 0;
                  const qtyTotal = carrinho.filter((i) => i.id === produto.id).reduce((a, i) => a + i.qty, 0);
                  return (
                    <ProdutoCard
                      key={produto.id}
                      produto={produto}
                      precoMinimo={precoMinimo}
                      temVarios={temVarios}
                      qtdCarrinho={qtyTotal}
                      onClick={() => handleProdutoClick(produto)}
                    />
                  );
                })}
                {produtosFiltrados.length === 0 && (
                  <p className="col-span-full py-12 text-center text-gray-400 text-sm">Nenhum produto encontrado.</p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── COL 3: Comanda ── */}
        <aside className="w-64 shrink-0 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
          <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FiShoppingCart size={14} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-800">Comanda</span>
              {carrinho.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full leading-none">
                  {carrinho.reduce((a, i) => a + i.qty, 0)}
                </span>
              )}
            </div>
            {carrinho.length > 0 && (
              <button onClick={() => setCarrinho([])} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <FiTrash2 size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <AnimatePresence>
              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <FiShoppingCart size={28} className="text-gray-200" />
                  <p className="text-gray-400 text-xs font-medium">Comanda vazia</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {carrinho.map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="shrink-0 w-5 h-5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black rounded-md flex items-center justify-center mt-0.5">
                          {item.qty}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate leading-tight">{item.name}</p>
                          {item.size !== "único" && (
                            <p className="text-[10px] text-gray-400 leading-tight">{item.size}</p>
                          )}
                          {item.resumoCustom?.map((linha, i) => (
                            <p key={i} className="text-[10px] text-blue-500 leading-tight">· {linha}</p>
                          ))}
                          <p className="text-[10px] font-semibold text-gray-500 leading-tight mt-0.5">{formatBRL(item.price * item.qty)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => alterarQty(item.key, -1)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 flex items-center justify-center transition-colors">
                            <FiMinus size={10} />
                          </button>
                          <button onClick={() => alterarQty(item.key, 1)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-green-100 hover:text-green-600 text-gray-500 flex items-center justify-center transition-colors">
                            <FiPlus size={10} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 pb-5 pt-3 border-t border-gray-100 space-y-3 shrink-0">
            {carrinho.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-xl font-black text-gray-900">{formatBRL(totalCarrinho)}</span>
              </div>
            )}
            <button
              onClick={() => setPagamentoAberto(true)}
              disabled={carrinho.length === 0 || !mesaSelecionada || salvando}
              className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-200"
            >
              <FiCheck size={15} />
              Ir para pagamento
            </button>
          </div>
        </aside>
      </div>

      {/* ══ MODAL: Customização ══ */}
      <AnimatePresence>
        {produtoAtivo && (
          <div
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={fecharModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <CustomizacaoPDV
                produto={produtoAtivo}
                painelConfig={painelConfig}
                docData={docData}
                loading={loadingConfig}
                onConfirmar={adicionarComCustom}
                onFechar={fecharModal}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Pagamento ══ */}
      <AnimatePresence>
        {pagamentoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-gray-900">Confirmar pedido</p>
                  <p className="text-xs text-gray-400 mt-0.5">{mesaSelecionada?.nome}</p>
                </div>
                <button onClick={() => setPagamentoAberto(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors">
                  <FiX size={14} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2 max-h-52 overflow-y-auto">
                  {carrinho.map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="shrink-0 w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md flex items-center justify-center mt-0.5">{item.qty}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">
                            {item.name}{item.size !== "único" && <span className="text-gray-400 font-normal"> · {item.size}</span>}
                          </p>
                          {item.resumoCustom?.map((l, i) => (
                            <p key={i} className="text-[10px] text-blue-500">· {l}</p>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 shrink-0">{formatBRL(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-500">Total</span>
                    <span className="text-base font-black text-blue-600">{formatBRL(totalCarrinho)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Nome do cliente <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    placeholder="Ex: João"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAGAMENTO_OPTS.map((op) => (
                      <button
                        key={op.value}
                        onClick={() => setFormaPagamento(op.value)}
                        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-xs font-bold transition-all
                          ${formaPagamento === op.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
                      >
                        <span className="text-xl">{op.icon}</span>
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setPagamentoAberto(false)} className="px-4 h-12 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                <button
                  onClick={confirmarPedido}
                  disabled={salvando}
                  className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  <FiCheck size={15} />
                  {salvando ? "Enviando…" : "Lançar pedido"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ TOAST ══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full shadow-xl border border-white/10 pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// CustomizacaoPDV
// Lógica idêntica ao CustomizacaoModal do cliente
// ─────────────────────────────────────────────

function CustomizacaoPDV({ produto, painelConfig, docData, loading, onConfirmar, onFechar }) {
  const [selecoes, setSelecoes]     = useState({});
  const [tamanhoSel, setTamanhoSel] = useState("");

  // Campos filtrados — igual ao CustomizacaoModal do cliente
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

  const precoTotal = precoBase + extraUnitario;
  const podeContinuar = !hasMultipleSizes || !!tamanhoSel;

  function toggleOpcao(key, opcao, max) {
    setSelecoes((prev) => {
      const atual = Array.isArray(prev[key]) ? prev[key] : [];
      if (atual.includes(opcao)) return { ...prev, [key]: atual.filter((o) => o !== opcao) };
      if (max === 1) return { ...prev, [key]: [opcao] };
      if (max && atual.length >= max) return prev;
      return { ...prev, [key]: [...atual, opcao] };
    });
  }

  function handleConfirmar() {
    if (hasMultipleSizes && !tamanhoSel) return;
    const tamanho = tamanhoSel || (sizes.length === 1 ? sizes[0][0] : "único");
    onConfirmar({ tamanho, selecoes, camposCustom });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
        {produto.image && (
          <img src={produto.image} alt={produto.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 leading-tight">{produto.name}</p>
          {produto.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{produto.description}</p>
          )}
        </div>
        <button onClick={onFechar} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors shrink-0">
          <FiX size={14} />
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">

          {/* Tamanhos */}
          {hasMultipleSizes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-700 uppercase tracking-wide">Tamanho</p>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Obrigatório</span>
              </div>
              <div className="grid gap-2">
                {sizes.map(([size, preco]) => (
                  <button
                    key={size}
                    onClick={() => setTamanhoSel(size)}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all group
                      ${tamanhoSel === size
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                  >
                    <span className={`text-sm font-bold ${tamanhoSel === size ? "text-blue-700" : "text-gray-700"}`}>{size}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-black ${tamanhoSel === size ? "text-blue-700" : "text-gray-900"}`}>
                        {formatBRL(parsePreco(preco))}
                      </span>
                      {tamanhoSel === size && (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <FiCheck size={11} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos de customização */}
          {camposCustom.map((campo) => {

            // ── Toggle ──
            if (campo.tipo === "toggle") {
              const ativo = !!selecoes[campo.key];
              return (
                <div key={campo.key}>
                  <button
                    onClick={() => setSelecoes((prev) => ({ ...prev, [campo.key]: !prev[campo.key] }))}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all
                      ${ativo ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"}`}
                  >
                    <span className={`text-sm font-bold ${ativo ? "text-blue-700" : "text-gray-700"}`}>{campo.label}</span>
                    <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${ativo ? "bg-blue-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${ativo ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </button>
                </div>
              );
            }

            // ── Multiselect ──
            if (campo.tipo === "multiselect") {
              const opcoes = campo.opcoes ?? [];
              if (opcoes.length === 0) return null;
              const selecionados = Array.isArray(selecoes[campo.key]) ? selecoes[campo.key] : [];
              const max = campo.max ?? null;

              return (
                <div key={campo.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wide">{campo.label}</p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {max === 1 ? "Escolha 1" : max ? `Até ${max}` : "Livre"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opcoes.map((opcao) => {
                      const ativo = selecionados.includes(opcao);
                      const bloqueado = !ativo && max && selecionados.length >= max && max > 1;
                      return (
                        <button
                          key={opcao}
                          onClick={() => toggleOpcao(campo.key, opcao, max)}
                          disabled={bloqueado}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                            ${ativo
                              ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                              : bloqueado
                                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                        >
                          {ativo && <FiCheck size={12} className="inline mr-1.5" />}
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ── Extras-ref ──
            if (campo.tipo === "extras-ref") {
              const itens = docData?.[campo.extraId] ?? [];
              if (itens.length === 0) return null;
              const selecionados = Array.isArray(selecoes[campo.key]) ? selecoes[campo.key] : [];
              const max = campo.max ?? null;

              return (
                <div key={campo.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wide">{campo.label}</p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {max === 1 ? "Escolha 1" : max ? `Até ${max}` : "Livre"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {itens.map((item) => {
                      const ativo = selecionados.includes(item.nome);
                      const bloqueado = !ativo && max && selecionados.length >= max && max > 1;
                      const preco = parsePreco(item.preco || 0);
                      return (
                        <button
                          key={item.id ?? item.nome}
                          onClick={() => toggleOpcao(campo.key, item.nome, max)}
                          disabled={bloqueado}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all
                            ${ativo
                              ? "border-blue-500 bg-blue-50"
                              : bloqueado
                                ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                                : "border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                              ${ativo ? "border-blue-500 bg-blue-600" : "border-gray-300 bg-white"}`}>
                              {ativo && <FiCheck size={11} className="text-white" />}
                            </div>
                            <span className={`text-sm font-bold ${ativo ? "text-blue-700" : "text-gray-700"}`}>
                              {item.nome}
                            </span>
                          </div>
                          {preco > 0 && (
                            <span className={`text-sm font-black ${ativo ? "text-blue-600" : "text-gray-400"}`}>
                              +{formatBRL(preco)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Sem customizações */}
          {!loading && camposCustom.length === 0 && !hasMultipleSizes && (
            <p className="text-sm text-gray-400 text-center py-4">Sem opções de personalização.</p>
          )}
        </div>
      )}

      {/* Footer fixo */}
      <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
        <button
          onClick={handleConfirmar}
          disabled={!podeContinuar || loading}
          className={`w-full h-13 flex items-center justify-between px-6 py-4 rounded-xl font-black text-sm transition-all active:scale-[0.98]
            ${podeContinuar && !loading
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          <span>Adicionar à comanda</span>
          <span className="text-base">{formatBRL(precoTotal)}</span>
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Card de produto
// ─────────────────────────────────────────────

function ProdutoCard({ produto, precoMinimo, temVarios, qtdCarrinho, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden group cursor-pointer active:scale-[0.97]"
    >
      {qtdCarrinho > 0 && (
        <div className="absolute top-2 right-2 z-10 min-w-[20px] h-5 px-1 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
          {qtdCarrinho}
        </div>
      )}
      <div className="relative overflow-hidden h-32 bg-gray-50">
        {produto.image ? (
          <>
            <img src={produto.image} alt={produto.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">🍽️</div>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <FiPlus size={15} />
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 mb-2 min-h-[2rem]">{produto.name}</p>
        <div className="flex items-center justify-between">
          <div>
            {temVarios && <p className="text-[9px] text-gray-400 font-medium leading-tight">a partir de</p>}
            <p className="text-sm font-black text-gray-900">{formatBRL(precoMinimo)}</p>
          </div>
          {temVarios && (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">
              {Object.keys(produto.prices).length} tamanhos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}