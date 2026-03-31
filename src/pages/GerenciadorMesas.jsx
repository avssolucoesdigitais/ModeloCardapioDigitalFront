/**
 * pages/GerenciadorMesas.jsx
 *
 * Tela do admin para cadastrar e gerenciar as mesas da loja.
 * O dono define quantas mesas tem e como elas se chamam.
 * As mesas criadas aqui aparecem no PDV do atendente.
 */

import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function mesaVazia() {
  return { nome: "", capacidade: "", observacao: "" };
}

export default function GerenciadorMesas({ lojaId }) {
  const [mesas, setMesas]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalAberto, setModalAberto]   = useState(false);
  const [mesaEditando, setMesaEditando] = useState(null);
  const [salvando, setSalvando]         = useState(false);
  const [draggingId, setDraggingId]     = useState(null);
  const [dragOverId, setDragOverId]     = useState(null);

  // ── Carrega mesas ──
  useEffect(() => {
    if (!lojaId) return;
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "lojas", lojaId, "mesas"));
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      setMesas(lista);
      setLoading(false);
    })();
  }, [lojaId]);

  function abrirNova() {
    setMesaEditando({ id: null, ...mesaVazia(), ordem: mesas.length + 1 });
    setModalAberto(true);
  }

  function abrirEditar(mesa) {
    setMesaEditando({ ...mesa });
    setModalAberto(true);
  }

  async function salvarMesa(dados) {
    setSalvando(true);
    try {
      const id = dados.id || slugify(dados.nome) || `mesa-${Date.now()}`;
      const ref = doc(db, "lojas", lojaId, "mesas", id);
      const payload = {
        nome:        dados.nome.trim(),
        capacidade:  dados.capacidade ? Number(dados.capacidade) : null,
        observacao:  dados.observacao?.trim() || "",
        ordem:       dados.ordem ?? mesas.length + 1,
        status:      dados.status || "livre",
      };
      await setDoc(ref, payload, { merge: true });
      setMesas((prev) => {
        const existe = prev.find((m) => m.id === id);
        if (existe) return prev.map((m) => m.id === id ? { id, ...payload } : m);
        return [...prev, { id, ...payload }].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      });
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMesa(mesa) {
    if (!confirm(`Excluir "${mesa.nome}"? Esta ação não pode ser desfeita.`)) return;
    await deleteDoc(doc(db, "lojas", lojaId, "mesas", mesa.id));
    setMesas((prev) => prev.filter((m) => m.id !== mesa.id));
  }

  // ── Drag and drop ──
  async function onDragEnd(fromId, toId) {
    if (!fromId || !toId || fromId === toId) { setDraggingId(null); setDragOverId(null); return; }
    const lista = [...mesas];
    const fromIdx = lista.findIndex((m) => m.id === fromId);
    const toIdx   = lista.findIndex((m) => m.id === toId);
    const [moved] = lista.splice(fromIdx, 1);
    lista.splice(toIdx, 0, moved);
    const reordenadas = lista.map((m, i) => ({ ...m, ordem: i + 1 }));
    setMesas(reordenadas);
    setDraggingId(null);
    setDragOverId(null);
    const batch = writeBatch(db);
    reordenadas.forEach((m) => {
      batch.update(doc(db, "lojas", lojaId, "mesas", m.id), { ordem: m.ordem });
    });
    await batch.commit();
  }

  // ── Gerador rápido de mesas ──
  async function gerarMesas(quantidade) {
    if (!quantidade || quantidade < 1) return;
    setSalvando(true);
    try {
      const batch = writeBatch(db);
      const novas = [];
      for (let i = 1; i <= quantidade; i++) {
        const nome = `Mesa ${mesas.length + i}`;
        const id   = slugify(nome);
        const payload = { nome, capacidade: null, observacao: "", ordem: mesas.length + i, status: "livre" };
        batch.set(doc(db, "lojas", lojaId, "mesas", id), payload, { merge: true });
        novas.push({ id, ...payload });
      }
      await batch.commit();
      setMesas((prev) => [...prev, ...novas].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99)));
    } finally {
      setSalvando(false);
    }
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
          <h1 className="text-2xl font-black text-gray-800">Mesas</h1>
          <p className="text-sm text-gray-400 mt-1">
            Arraste para reordenar · {mesas.length} mesa(s) cadastrada(s)
          </p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-5 h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <span className="text-lg">+</span> Nova Mesa
        </button>
      </div>

      {/* Gerador rápido */}
      {mesas.length === 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <p className="text-sm font-bold text-amber-800">Atalho: gerar mesas em sequência</p>
          <p className="text-xs text-amber-600">Cria mesas numeradas automaticamente (Mesa 1, Mesa 2...)</p>
          <div className="flex gap-2">
            {[4, 6, 8, 10, 12].map((n) => (
              <button
                key={n}
                onClick={() => gerarMesas(n)}
                disabled={salvando}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {n} mesas
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {mesas.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-gray-500 font-medium">Nenhuma mesa cadastrada ainda.</p>
          <button onClick={abrirNova} className="mt-4 text-amber-600 font-bold text-sm hover:underline">
            Adicionar primeira mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              draggable
              onDragStart={() => setDraggingId(mesa.id)}
              onDragEnter={() => setDragOverId(mesa.id)}
              onDragEnd={() => onDragEnd(draggingId, dragOverId)}
              onDragOver={(e) => e.preventDefault()}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                draggingId === mesa.id
                  ? "opacity-40 border-amber-300 scale-95"
                  : dragOverId === mesa.id
                    ? "border-amber-400 shadow-md"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              {/* Status badge */}
              <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                mesa.status === "ocupada"    ? "bg-red-400" :
                mesa.status === "aguardando" ? "bg-amber-400" :
                "bg-green-400"
              }`} title={mesa.status} />

              <span className="text-3xl">🪑</span>
              <p className="font-black text-gray-800 text-sm text-center leading-tight">{mesa.nome}</p>
              {mesa.capacidade && (
                <p className="text-xs text-gray-400">{mesa.capacidade} lugares</p>
              )}
              {mesa.observacao && (
                <p className="text-xs text-gray-400 italic text-center line-clamp-1">{mesa.observacao}</p>
              )}

              {/* Ações */}
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => abrirEditar(mesa)}
                  className="px-3 py-1 bg-gray-100 hover:bg-amber-50 hover:text-amber-600 text-gray-500 text-xs font-bold rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluirMesa(mesa)}
                  className="px-3 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 text-xs font-bold rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && mesaEditando && (
        <ModalMesa
          mesa={mesaEditando}
          onSalvar={salvarMesa}
          onFechar={() => setModalAberto(false)}
          salvando={salvando}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal de criação / edição de mesa
// ─────────────────────────────────────────────

function ModalMesa({ mesa, onSalvar, onFechar, salvando }) {
  const [form, setForm] = useState({ ...mesa });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800">
            {mesa.id ? `Editando: ${mesa.nome}` : "Nova Mesa"}
          </h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nome da mesa</span>
            <input
              autoFocus
              placeholder="Ex: Mesa 1, Varanda, Balcão..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && form.nome && onSalvar(form)}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-300 outline-none transition-all"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Capacidade
              <span className="ml-1 text-xs text-gray-400 font-normal">(opcional)</span>
            </span>
            <input
              type="number"
              min="1"
              placeholder="Ex: 4"
              value={form.capacidade ?? ""}
              onChange={(e) => setForm({ ...form, capacidade: e.target.value })}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-300 outline-none transition-all"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Observação
              <span className="ml-1 text-xs text-gray-400 font-normal">(opcional)</span>
            </span>
            <input
              placeholder="Ex: próxima à janela, acessível..."
              value={form.observacao ?? ""}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-300 outline-none transition-all"
            />
          </label>

          {/* Sugestões rápidas */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Sugestões rápidas</p>
            <div className="flex flex-wrap gap-2">
              {["Balcão", "Varanda", "Salão", "Área externa", "VIP"].map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, nome: s })}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onFechar}
            className="px-6 h-11 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSalvar(form)}
            disabled={!form.nome.trim() || salvando}
            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow transition-all active:scale-95"
          >
            {salvando ? "Salvando..." : mesa.id ? "Salvar alterações" : "Criar mesa"}
          </button>
        </div>
      </div>
    </div>
  );
}