import { useEffect, useState, useRef } from "react";
import { db } from "/src/firebase";
import {
  collection, onSnapshot, orderBy, query,
  updateDoc, doc, deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { FiBell, FiBellOff, FiPrinter, FiTrash2, FiClock, FiCheck, FiPlay } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import notificacaoSound from "../sound/notificação.mp3";

const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((new Date() - date) / 60000);
  if (diff < 1) return "Agora";
  return `há ${diff} min`;
};

function parsePreco(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string")
    return parseFloat(value.replace(",", ".").replace("R$", "").trim()) || 0;
  return 0;
}

// ── Renderiza customizações como lista de linhas ──
function CustomizacoesLista({ customizacoes }) {
  if (!customizacoes || typeof customizacoes !== "object") return null;
  const linhas = [];
  Object.entries(customizacoes).forEach(([key, valor]) => {
    if (valor === false || valor === "" || valor === null || valor === undefined) return;
    const label = key.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim();
    if (valor === true) linhas.push({ label, texto: null });
    else if (Array.isArray(valor) && valor.length > 0) linhas.push({ label, texto: valor.join(", ") });
    else if (typeof valor === "string" && valor.trim()) linhas.push({ label, texto: valor });
  });
  if (linhas.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {linhas.map(({ label, texto }) => (
        <p key={label} className="text-xs text-slate-500 pl-2">
          {texto ? <><span className="font-semibold text-slate-600">{label}:</span> {texto}</> : <><span className="text-orange-500">✓</span> {label}</>}
        </p>
      ))}
    </div>
  );
}

// ── Formata customizações para HTML de impressão ──
function customizacoesHTML(customizacoes) {
  if (!customizacoes || typeof customizacoes !== "object") return "";
  const linhas = [];
  Object.entries(customizacoes).forEach(([key, valor]) => {
    if (valor === false || valor === "" || valor === null || valor === undefined) return;
    const label = key.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim();
    if (valor === true) linhas.push(`<p style="margin:2px 0 2px 12px; font-size:14px;">✓ ${label}</p>`);
    else if (Array.isArray(valor) && valor.length > 0)
      linhas.push(`<p style="margin:2px 0 2px 12px; font-size:14px;">• ${label}: <strong>${valor.join(", ")}</strong></p>`);
    else if (typeof valor === "string" && valor.trim())
      linhas.push(`<p style="margin:2px 0 2px 12px; font-size:14px;">• ${label}: <strong>${valor}</strong></p>`);
  });
  return linhas.join("");
}

export default function OrdersAdmin() {
  const { lojaSlug } = useParams();
  const LOJA_ID = lojaSlug;

  const [orders, setOrders]           = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef                      = useRef(null);
  const prevIdsRef                    = useRef([]);

  useEffect(() => {
    const pref = localStorage.getItem("soundEnabled");
    if (pref !== null) setSoundEnabled(pref === "true");
  }, []);

  useEffect(() => {
    const q = query(collection(db, "lojas", LOJA_ID, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);
      const currentIds = docs.map((o) => o.id);
      const novosPendentes = docs.filter(
        (o) => (o.status || "").trim().toUpperCase() === "PENDENTE" && !prevIdsRef.current.includes(o.id)
      );
      if (soundEnabled && novosPendentes.length > 0) {
        toast.success("📦 Novo pedido recebido!");
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) => console.error("Erro ao tocar áudio:", err));
        }
      }
      prevIdsRef.current = currentIds;
    });
    return () => unsub();
  }, [soundEnabled]);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("soundEnabled", newValue.toString());
    toast(newValue ? "🔔 Notificações sonoras ativadas!" : "🔕 Som desativado");
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "lojas", LOJA_ID, "orders", id), { status: status.trim().toUpperCase() });
    } catch (err) { console.error("❌ Erro ao atualizar status:", err); }
  };

  const deleteOrder = async (id) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      try { await deleteDoc(doc(db, "lojas", LOJA_ID, "orders", id)); }
      catch (err) { console.error("❌ Erro ao excluir pedido:", err); }
    }
  };

  const printOrderKitchen = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();
    const itensHTML = (pedido.items || []).map((item) => `
      <div style="margin-bottom:18px; border-bottom:1px dashed #000; padding-bottom:8px;">
        <p style="font-size:22px; font-weight:bold;">
          ${item.qty || 1}x ${item.name} ${item.size ? `(${item.size})` : ""}
        </p>
        ${item.flavors ? `<p>🍕 Sabores: ${item.flavors.join(" / ")}</p>` : ""}
        ${item.crust ? `<p>🍞 Borda: ${item.crust.nome}</p>` : ""}
        ${item.addons?.length ? `<p>➕ Adicionais: ${item.addons.map((a) => a.nome).join(", ")}</p>` : ""}
        ${item.customizacoes ? customizacoesHTML(item.customizacoes) : ""}
        ${item.observacoes ? `<p style="color:red; font-weight:bold; font-size:18px;">📝 OBS: ${item.observacoes}</p>` : ""}
      </div>
    `).join("");

    const conteudo = `
      <html>
        <head>
          <title>Cozinha - Pedido #${numeroPedido}</title>
          <style>body { font-family: Arial, sans-serif; font-size: 16px; } h1 { font-size: 24px; margin-bottom: 15px; }</style>
        </head>
        <body>
          <h1>👨‍🍳 COZINHA - PEDIDO #${numeroPedido}</h1>
          ${itensHTML || "<p>Nenhum item</p>"}
          <h2 style="margin-top:20px;">⚠️ Observação do Cliente:</h2>
          <p style="color:red; font-weight:bold; font-size:18px;">${pedido.observacao || "Sem observações"}</p>
        </body>
      </html>
    `;
    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  const printOrderDelivery = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();
    const itensHTML = (pedido.items || []).map((item) => `
      <tr>
        <td>${item.qty || 1}</td>
        <td>
          ${item.name} ${item.size ? `(${item.size})` : ""}
          ${item.flavors ? `<br/>🍕 ${item.flavors.join(" / ")}` : ""}
          ${item.crust ? `<br/>🍞 ${item.crust.nome}` : ""}
          ${item.addons?.length ? `<br/>➕ ${item.addons.map((a) => a.nome).join(", ")}` : ""}
          ${item.customizacoes ? `<br/>${customizacoesHTML(item.customizacoes).replace(/<p/g, "<span").replace(/<\/p>/g, "</span><br/>")}` : ""}
        </td>
        <td style="text-align:right;">R$ ${(parsePreco(item.price) * (item.qty || 1)).toFixed(2)}</td>
      </tr>
    `).join("");

    const conteudo = `
      <html>
        <head><title>Entrega - Pedido #${numeroPedido}</title></head>
        <body>
          <h1>🚚 ENTREGA - PEDIDO #${numeroPedido}</h1>
          <p><strong>Cliente:</strong> ${pedido.customer || "-"}</p>
          <p><strong>Telefone:</strong> ${pedido.phone || "-"}</p>
          <p><strong>Endereço:</strong> ${pedido.address || "Retirada na loja"}</p>
          <p><strong>Pagamento:</strong> ${pedido.paymentMethod || "-"}</p>
          <hr/>
          <table border="1" width="100%">
            <thead><tr><th>QTD</th><th>ITEM</th><th>VALOR</th></tr></thead>
            <tbody>${itensHTML}</tbody>
          </table>
          <p><strong>Total:</strong> R$ ${parsePreco(pedido.total).toFixed(2)}</p>
          ${pedido.observacao ? `<p><strong>OBS Cliente:</strong> ${pedido.observacao}</p>` : ""}
        </body>
      </html>
    `;
    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  const hoje = new Date().toISOString().slice(0, 10);
  const pedidosHoje = orders.filter((o) => {
    if (!o.createdAt) return false;
    const data = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return data.toISOString().slice(0, 10) === hoje;
  });

  const totalPedidosHoje  = pedidosHoje.length;
  const totalFinalizados  = pedidosHoje.filter((o) => (o.status || "").toUpperCase() === "FINALIZADO").length;
  const valorTotalHoje    = pedidosHoje.reduce((acc, o) => acc + parsePreco(o.total), 0);
  const ticketMedio       = totalPedidosHoje > 0 ? valorTotalHoje / totalPedidosHoje : 0;
  const ativos            = orders.filter((o) => (o.status || "").trim().toUpperCase() !== "FINALIZADO");

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <audio ref={audioRef} src={notificacaoSound} preload="auto" />

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Painel de pedidos</h1>
            <p className="text-slate-500 font-medium">Gestão de pedidos em tempo real</p>
          </div>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${
              soundEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-200 text-slate-600"
            }`}
          >
            {soundEnabled ? <FiBell className="animate-bounce" /> : <FiBellOff />}
            {soundEnabled ? "Notificações Ligadas" : "Som Desativado"}
          </button>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Hoje"   value={totalPedidosHoje}                        color="blue"    />
          <StatCard label="Finalizados"  value={totalFinalizados}                         color="emerald" />
          <StatCard label="Faturamento"  value={`R$ ${valorTotalHoje.toFixed(2)}`}        color="purple"  />
          <StatCard label="Ticket Médio" value={`R$ ${ticketMedio.toFixed(2)}`}           color="pink"    />
        </section>

        <main>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📌 Pedidos em Aberto
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{ativos.length}</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            <AnimatePresence>
              {ativos.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  updateStatus={updateStatus}
                  printKitchen={printOrderKitchen}
                  printDelivery={printOrderDelivery}
                  deleteOrder={deleteOrder}
                />
              ))}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function OrderCard({ order, updateStatus, printKitchen, printDelivery, deleteOrder }) {
  const status    = (order.status || "PENDENTE").toUpperCase();
  const isPendente = status === "PENDENTE";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-white rounded-[2rem] border-2 transition-all ${
        isPendente ? "border-orange-200 shadow-orange-100" : "border-blue-100 shadow-blue-50"
      } shadow-xl p-6`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${isPendente ? "bg-orange-500" : "bg-blue-500"}`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pedido</span>
          <h3 className="text-2xl font-black text-slate-800">#{order.orderNumber || order.id.slice(-4)}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm font-bold">
            <FiClock /> {getRelativeTime(order.createdAt)}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-600">R$ {parsePreco(order.total).toFixed(2)}</p>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase italic">
            {order.paymentMethod}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <p className="font-bold text-slate-700 flex items-center gap-2">👤 {order.customer || "Cliente Final"}</p>
        <div className="text-sm text-slate-600 divide-y divide-slate-200">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="py-2">
              <div className="flex justify-between">
                <span>
                  <b className="text-blue-600">{item.qty}x</b> {item.name}{" "}
                  <small className="text-slate-400">{item.size}</small>
                </span>
              </div>
              {/* Sabores / borda / adicionais */}
              {item.flavors?.length > 0 && (
                <p className="text-xs text-slate-500 pl-2">🍕 {item.flavors.join(" + ")}</p>
              )}
              {item.crust && (
                <p className="text-xs text-slate-500 pl-2">🍞 Borda: {item.crust.nome}</p>
              )}
              {item.addons?.length > 0 && (
                <p className="text-xs text-slate-500 pl-2">➕ {item.addons.map((a) => a.nome).join(", ")}</p>
              )}
              {/* ── NOVO: customizações ── */}
              <CustomizacoesLista customizacoes={item.customizacoes} />
            </div>
          ))}
        </div>
        {order.observacao && (
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
            <p className="text-xs font-black text-orange-600 uppercase">Observação:</p>
            <p className="text-sm text-orange-800 font-medium italic">"{order.observacao}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <ActionButton active={status === "PENDENTE"}      onClick={() => updateStatus(order.id, "PENDENTE")}      label="Pendente" icon={<FiClock />}  color="orange"  />
        <ActionButton active={status === "EM ANDAMENTO"} onClick={() => updateStatus(order.id, "EM ANDAMENTO")} label="Preparar" icon={<FiPlay />}   color="blue"    />
        <ActionButton active={false}                      onClick={() => updateStatus(order.id, "FINALIZADO")}    label="Concluir" icon={<FiCheck />}  color="emerald" />
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <button onClick={() => printKitchen(order)}  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors">
          <FiPrinter /> Cozinha
        </button>
        <button onClick={() => printDelivery(order)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors">
          <FiPrinter /> Entrega
        </button>
        <button onClick={() => deleteOrder(order.id)} className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all">
          <FiTrash2 />
        </button>
      </div>
    </motion.article>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue:    "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple:  "bg-purple-50 text-purple-700 border-purple-100",
    pink:    "bg-pink-50 text-pink-700 border-pink-100",
  };
  return (
    <div className={`p-6 rounded-[2rem] border-2 shadow-sm ${colors[color]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function ActionButton({ active, onClick, label, icon, color }) {
  const colorMap = {
    orange: active ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-orange-50 text-orange-500",
    blue:   active ? "bg-blue-600 text-white shadow-lg shadow-blue-200"   : "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white",
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all font-bold text-[10px] uppercase ${colorMap[color]}`}>
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}