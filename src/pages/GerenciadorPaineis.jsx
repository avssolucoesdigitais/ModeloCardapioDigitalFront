/**
 * pages/GerenciadorPaineis.jsx
 *
 * Tela do admin para gerenciar painéis de forma dinâmica.
 * Funcionalidades:
 *  - Listar painéis do tenant
 *  - Criar novo painel
 *  - Editar painel (nome, ícone, categorias, campos extras, seções extras)
 *  - Ativar / desativar painel
 *  - Reordenar via drag and drop
 *  - Excluir painel (apenas config — não apaga os produtos em opcoes/)
 */

import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function painelVazio() {
  return {
    nome: "",
    icone: "🍽️",
    opcaoId: "",
    categorias: [],
    usaSizes: false,
    extras: [],
    camposExtras: [],
    ativo: true,
    ordem: 99,
  };
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ── ATUALIZADO: adicionados multiselect e extras-ref ──
const TIPOS_CAMPO = [
  { value: "text",        label: "Texto" },
  { value: "number",      label: "Número" },
  { value: "select",      label: "Seleção única" },
  { value: "toggle",      label: "Toggle (sim/não)" },
  { value: "multiselect", label: "Múltipla escolha (chips)" },
  { value: "extras-ref",  label: "Lista da seção extra" },
];

const ICONES_SUGERIDOS = [
  "🍕","🍔","🌮","🌯","🥙","🥟","🥐","🧆","🍟","🥗",
  "🍜","🍱","🍣","🍤","🦐","🥩","🍗","🧀","🥚","🥞",
  "🍰","🎂","🍩","🍪","🍫","🍦","🧁","🥤","🍺","🧃",
];

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function GerenciadorPaineis({ lojaId }) {
  const [paineis, setPaineis]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalAberto, setModalAberto]   = useState(false);
  const [painelEditando, setPainelEditando] = useState(null);
  const [salvando, setSalvando]         = useState(false);
  const [draggingId, setDraggingId]     = useState(null);
  const dragOver                        = useRef(null);

  // ── Carrega painéis ──
  useEffect(() => {
    if (!lojaId) return;
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "lojas", lojaId, "paineis"));
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      setPaineis(lista);
      setLoading(false);
    })();
  }, [lojaId]);

  function abrirNovo() {
    setPainelEditando({ id: null, ...painelVazio() });
    setModalAberto(true);
  }

  function abrirEditar(painel) {
    setPainelEditando({ ...painel });
    setModalAberto(true);
  }

  async function salvarPainel(dados) {
    setSalvando(true);
    try {
      const id = dados.id || slugify(dados.nome) || `painel-${Date.now()}`;
      const ref = doc(db, "lojas", lojaId, "paineis", id);
      const payload = {
        nome:         dados.nome,
        icone:        dados.icone,
        opcaoId:      dados.opcaoId || dados.nome,
        categorias:   dados.categorias,
        usaSizes:     dados.usaSizes,
        extras:       dados.extras,
        camposExtras: dados.camposExtras,
        ativo:        dados.ativo,
        ordem:        dados.ordem ?? paineis.length + 1,
      };
      await setDoc(ref, payload, { merge: true });
      setPaineis((prev) => {
        const existe = prev.find((p) => p.id === id);
        if (existe) return prev.map((p) => p.id === id ? { id, ...payload } : p);
        return [...prev, { id, ...payload }].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      });
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtivo(painel) {
    const ref = doc(db, "lojas", lojaId, "paineis", painel.id);
    const novoAtivo = !painel.ativo;
    await setDoc(ref, { ativo: novoAtivo }, { merge: true });
    setPaineis((prev) =>
      prev.map((p) => p.id === painel.id ? { ...p, ativo: novoAtivo } : p)
    );
  }

  async function excluirPainel(painel) {
    if (!confirm(`Excluir o painel "${painel.nome}"?\n\nOs produtos em opcoes/${painel.opcaoId} NÃO serão apagados.`)) return;
    await deleteDoc(doc(db, "lojas", lojaId, "paineis", painel.id));
    setPaineis((prev) => prev.filter((p) => p.id !== painel.id));
  }

  function onDragStart(id) { setDraggingId(id); }
  function onDragEnter(id) { dragOver.current = id; }

  async function onDragEnd() {
    if (!draggingId || !dragOver.current || draggingId === dragOver.current) {
      setDraggingId(null);
      return;
    }
    const lista = [...paineis];
    const fromIdx = lista.findIndex((p) => p.id === draggingId);
    const toIdx   = lista.findIndex((p) => p.id === dragOver.current);
    const [moved] = lista.splice(fromIdx, 1);
    lista.splice(toIdx, 0, moved);
    const reordenados = lista.map((p, i) => ({ ...p, ordem: i + 1 }));
    setPaineis(reordenados);
    setDraggingId(null);
    dragOver.current = null;
    const batch = writeBatch(db);
    reordenados.forEach((p) => {
      batch.update(doc(db, "lojas", lojaId, "paineis", p.id), { ordem: p.ordem });
    });
    await batch.commit();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Painéis do Cardápio</h1>
          <p className="text-sm text-gray-400 mt-1">
            Arraste para reordenar · {paineis.length} painel(is) configurado(s)
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 px-5 h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <span className="text-lg">+</span> Novo Painel
        </button>
      </div>

      {/* Lista */}
      {paineis.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">Nenhum painel criado ainda.</p>
          <button onClick={abrirNovo} className="mt-4 text-amber-600 font-bold text-sm hover:underline">
            Criar primeiro painel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paineis.map((painel) => (
            <div
              key={painel.id}
              draggable
              onDragStart={() => onDragStart(painel.id)}
              onDragEnter={() => onDragEnter(painel.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-4 p-4 bg-white rounded-2xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                draggingId === painel.id
                  ? "opacity-40 border-amber-300 shadow-lg scale-[0.99]"
                  : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
              } ${!painel.ativo ? "opacity-60" : ""}`}
            >
              <span className="text-gray-300 text-lg shrink-0">⠿</span>
              <span className="text-2xl shrink-0">{painel.icone}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-800">{painel.nome}</h3>
                  {!painel.ativo && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-full">Inativo</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {painel.categorias?.map((cat) => (
                    <span key={cat} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-100">{cat}</span>
                  ))}
                  {painel.usaSizes && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md border border-blue-100">Tamanhos</span>
                  )}
                  {painel.extras?.map((e) => (
                    <span key={e.id} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-md border border-gray-100">{e.label}</span>
                  ))}
                  {/* Mostra badge para campos multiselect e extras-ref */}
                  {painel.camposExtras?.filter((c) => c.tipo === "multiselect" || c.tipo === "extras-ref").map((c) => (
                    <span key={c.key} className="px-2 py-0.5 bg-teal-50 text-teal-600 text-xs rounded-md border border-teal-100">{c.label}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAtivo(painel)}
                  title={painel.ativo ? "Desativar" : "Ativar"}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm ${
                    painel.ativo ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {painel.ativo ? "✓" : "○"}
                </button>
                <button
                  onClick={() => abrirEditar(painel)}
                  className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-all text-sm"
                >✎</button>
                <button
                  onClick={() => excluirPainel(painel)}
                  className="w-9 h-9 rounded-xl bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-sm"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && painelEditando && (
        <ModalPainel
          painel={painelEditando}
          onSalvar={salvarPainel}
          onFechar={() => setModalAberto(false)}
          salvando={salvando}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal de criação / edição de painel
// ─────────────────────────────────────────────

function ModalPainel({ painel, onSalvar, onFechar, salvando }) {
  const [form, setForm]               = useState({ ...painel });
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoExtra, setNovoExtra]     = useState({ id: "", label: "" });
  const [novoCampo, setNovoCampo]     = useState({
    key: "", label: "", tipo: "text", opcoes: "", max: "", extraId: "",
  });
  const [abaAtiva, setAbaAtiva]       = useState("geral");

  function addCategoria() {
    const cat = novaCategoria.trim().toLowerCase();
    if (!cat || form.categorias.includes(cat)) return;
    setForm({ ...form, categorias: [...form.categorias, cat] });
    setNovaCategoria("");
  }

  function removeCategoria(cat) {
    setForm({ ...form, categorias: form.categorias.filter((c) => c !== cat) });
  }

  function addExtra() {
    const id    = slugify(novoExtra.label) || `extra-${Date.now()}`;
    const label = novoExtra.label.trim();
    if (!label) return;
    setForm({ ...form, extras: [...form.extras, { id, label }] });
    setNovoExtra({ id: "", label: "" });
  }

  function removeExtra(id) {
    setForm({ ...form, extras: form.extras.filter((e) => e.id !== id) });
  }

  function addCampoExtra() {
    const key = slugify(novoCampo.key || novoCampo.label) || `campo-${Date.now()}`;
    if (!novoCampo.label.trim()) return;

    const campo = {
      key,
      label: novoCampo.label.trim(),
      tipo:  novoCampo.tipo,
    };

    // Campos específicos por tipo
    if (novoCampo.tipo === "select") {
      campo.opcoes = novoCampo.opcoes.split(",").map((o) => o.trim()).filter(Boolean);
    }
    if (novoCampo.tipo === "multiselect") {
      campo.opcoes = novoCampo.opcoes.split(",").map((o) => o.trim()).filter(Boolean);
      if (novoCampo.max) campo.max = parseInt(novoCampo.max, 10);
    }
    if (novoCampo.tipo === "extras-ref") {
      // extraId referencia um id em form.extras[]
      campo.extraId = novoCampo.extraId || slugify(novoCampo.label);
    }

    setForm({ ...form, camposExtras: [...form.camposExtras, campo] });
    setNovoCampo({ key: "", label: "", tipo: "text", opcoes: "", max: "", extraId: "" });
  }

  function removeCampoExtra(key) {
    setForm({ ...form, camposExtras: form.camposExtras.filter((c) => c.key !== key) });
  }

  // Label amigável do tipo
  function labelTipo(tipo) {
    return TIPOS_CAMPO.find((t) => t.value === tipo)?.label ?? tipo;
  }

  const abas = [
    { id: "geral",      label: "Geral" },
    { id: "categorias", label: "Categorias" },
    { id: "extras",     label: "Seções extras" },
    { id: "campos",     label: "Campos extras" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-gray-800">
            {painel.id ? `Editando: ${painel.nome}` : "Novo Painel"}
          </h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                abaAtiva === aba.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── ABA GERAL ── */}
          {abaAtiva === "geral" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Ícone</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ICONES_SUGERIDOS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setForm({ ...form, icone: ic })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border ${
                        form.icone === ic
                          ? "bg-amber-50 border-amber-400 scale-110"
                          : "bg-gray-50 border-transparent hover:border-gray-200"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="Ou cole outro emoji"
                  value={form.icone}
                  onChange={(e) => setForm({ ...form, icone: e.target.value })}
                  className="w-24 h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Nome do painel</span>
                <input
                  placeholder="Ex: Hambúrguer, Pizza, Açaí..."
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-300 outline-none transition-all"
                />
              </label>

              <div
                onClick={() => setForm({ ...form, usaSizes: !form.usaSizes })}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-100"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">Usa tamanhos e preços por tamanho</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ativa o seletor P / M / G / GG no formulário</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.usaSizes ? "bg-amber-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.usaSizes ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>

              <div
                onClick={() => setForm({ ...form, ativo: !form.ativo })}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-100"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">Painel ativo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Painéis inativos não aparecem no cardápio</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.ativo ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ativo ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>
            </>
          )}

          {/* ── ABA CATEGORIAS ── */}
          {abaAtiva === "categorias" && (
            <>
              <p className="text-sm text-gray-500">
                Categorias agrupam produtos dentro do painel. Ex: tradicional, especial, doce.
              </p>
              <div className="flex flex-wrap gap-2">
                {form.categorias.map((cat) => (
                  <span key={cat} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg">
                    {cat}
                    <button onClick={() => removeCategoria(cat)} className="text-amber-400 hover:text-red-500 ml-1">✕</button>
                  </span>
                ))}
                {form.categorias.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Sem categorias — produtos listados sem agrupamento.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  placeholder="Ex: especial"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategoria()}
                  className="flex-1 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button onClick={addCategoria} className="px-5 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-amber-500 transition-colors">
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {["tradicional","especial","doce","combo","família","vegano"].map((s) => (
                  <button key={s} onClick={() => setNovaCategoria(s)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ABA SEÇÕES EXTRAS ── */}
          {abaAtiva === "extras" && (
            <>
              <p className="text-sm text-gray-500">
                Seções extras aparecem abaixo da lista de produtos. Ex: bordas, adicionais, molhos.
                <br />
                <span className="text-teal-600 font-medium">
                  Dica: campos do tipo "Lista da seção extra" referenciam essas seções.
                </span>
              </p>
              <div className="space-y-2">
                {form.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-700">{extra.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{extra.id}</p>
                    </div>
                    <button onClick={() => removeExtra(extra.id)} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
                  </div>
                ))}
                {form.extras.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Nenhuma seção extra configurada.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  placeholder="Ex: Bordas Recheadas"
                  value={novoExtra.label}
                  onChange={(e) => setNovoExtra({ ...novoExtra, label: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addExtra()}
                  className="flex-1 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button onClick={addExtra} className="px-5 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-amber-500 transition-colors">
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Adicionais","Bordas","Molhos","Acompanhamentos","Bases","Bebidas inclusas","Guarnições","Proteínas"].map((s) => (
                  <button key={s} onClick={() => setNovoExtra({ ...novoExtra, label: s })}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ABA CAMPOS EXTRAS ── */}
          {abaAtiva === "campos" && (
            <>
              <p className="text-sm text-gray-500">
                Campos extras aparecem no formulário de cada produto deste painel.
              </p>

              {/* Lista de campos já adicionados */}
              <div className="space-y-2">
                {form.camposExtras.map((campo) => (
                  <div key={campo.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-700">{campo.label}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                          campo.tipo === "multiselect" || campo.tipo === "extras-ref"
                            ? "bg-teal-50 text-teal-700 border border-teal-100"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {labelTipo(campo.tipo)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                        {campo.key}
                        {campo.opcoes?.length > 0 && ` · ${campo.opcoes.join(", ")}`}
                        {campo.max && ` · max: ${campo.max}`}
                        {campo.extraId && ` · ref: ${campo.extraId}`}
                      </p>
                    </div>
                    <button onClick={() => removeCampoExtra(campo.key)} className="text-gray-300 hover:text-red-500 transition-colors ml-3 shrink-0">✕</button>
                  </div>
                ))}
                {form.camposExtras.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Nenhum campo extra configurado.</p>
                )}
              </div>

              {/* Formulário de novo campo */}
              <div className="space-y-3 pt-3 border-t border-gray-100">

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Label do campo</span>
                    <input
                      placeholder="Ex: Proteína"
                      value={novoCampo.label}
                      onChange={(e) => setNovoCampo({ ...novoCampo, label: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Tipo</span>
                    <select
                      value={novoCampo.tipo}
                      onChange={(e) => setNovoCampo({ ...novoCampo, tipo: e.target.value, opcoes: "", max: "", extraId: "" })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none"
                    >
                      {TIPOS_CAMPO.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Opções para select e multiselect */}
                {(novoCampo.tipo === "select" || novoCampo.tipo === "multiselect") && (
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">Opções (separadas por vírgula)</span>
                    <input
                      placeholder="Ex: Frango, Carne, Peixe, Tofu"
                      value={novoCampo.opcoes}
                      onChange={(e) => setNovoCampo({ ...novoCampo, opcoes: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </label>
                )}

                {/* Limite máximo para multiselect */}
                {novoCampo.tipo === "multiselect" && (
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">
                      Máximo de seleções
                      <span className="ml-1 text-gray-400 font-normal">(deixe em branco para ilimitado)</span>
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 1 para seleção única"
                      value={novoCampo.max}
                      onChange={(e) => setNovoCampo({ ...novoCampo, max: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </label>
                )}

                {/* Referência de seção para extras-ref */}
                {novoCampo.tipo === "extras-ref" && (
                  <label className="block">
                    <span className="text-xs font-medium text-gray-600">
                      Seção extra que este campo referencia
                    </span>
                    {form.extras.length > 0 ? (
                      <select
                        value={novoCampo.extraId}
                        onChange={(e) => setNovoCampo({ ...novoCampo, extraId: e.target.value })}
                        className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none"
                      >
                        <option value="">Selecione uma seção...</option>
                        {form.extras.map((e) => (
                          <option key={e.id} value={e.id}>{e.label} ({e.id})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-700">
                          ⚠️ Nenhuma seção extra criada ainda. Vá para a aba <strong>Seções extras</strong> e crie uma primeiro.
                        </p>
                      </div>
                    )}
                  </label>
                )}

                <button
                  onClick={addCampoExtra}
                  disabled={novoCampo.tipo === "extras-ref" && !novoCampo.extraId}
                  className="w-full h-10 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Adicionar campo
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="px-6 h-11 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSalvar(form)}
            disabled={!form.nome || salvando}
            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow transition-all active:scale-95"
          >
            {salvando ? "Salvando..." : painel.id ? "Salvar alterações" : "Criar painel"}
          </button>
        </div>
      </div>
    </div>
  );
}