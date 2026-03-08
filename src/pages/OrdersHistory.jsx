import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helpers permanecem os mesmos, mas organizados
const normalize = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const toDate = (createdAt) => createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export default function OrdersHistory() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("month");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs.filter((o) => (o.status || "").toUpperCase() === "FINALIZADO"));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter((o) => {
      const date = toDate(o.createdAt);
      if (!(date instanceof Date) || isNaN(date)) return false;

      if (filter === "day") return date.toDateString() === now.toDateString();
      if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo && date <= now;
      }
      if (filter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (filter === "custom" && start && end) return date >= start && date <= end;
      return true;
    });
    setFiltered(filteredOrders);
  }, [orders, filter, dateRange]);

  const deleteOrder = async (id) => {
    if (confirm("Deseja remover este pedido do histórico permanentemente?")) {
      try { await deleteDoc(doc(db, "orders", id)); } 
      catch (err) { console.error("Erro:", err); }
    }
  };

  // Logica de Relatório simplificada para o PDF
  const exportReport = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18);
    docPdf.text("Relatório de Vendas Faturadas", 14, 20);
    
    const tableData = filtered.map((o) => [
      o.customer || "Consumidor",
      o.paymentMethod || "—",
      brl(o.total),
      o.deliveryType?.toUpperCase() || "—",
      o.createdAt ? toDate(o.createdAt).toLocaleDateString("pt-BR") : "—",
    ]);

    autoTable(docPdf, {
      head: [["Cliente", "Pagamento", "Total", "Tipo", "Data"]],
      body: tableData,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] }
    });

    docPdf.save(`relatorio-${filter}.pdf`);
  };

  // Cálculos de Métricas
  const totalVendas = filtered.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const totalPedidos = filtered.length;
  const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;
  
  const metodos = filtered.reduce((acc, o) => {
    const pm = normalize(o.paymentMethod);
    const val = Number(o.total || 0);
    if (pm.includes("pix")) { acc.pix.val += val; acc.pix.count++; }
    else if (pm.match(/cartao|credito|debito/)) { acc.cartao.val += val; acc.cartao.count++; }
    else if (pm.includes("dinheiro")) { acc.dinheiro.val += val; acc.dinheiro.count++; }
    return acc;
  }, { 
    pix: {val:0, count:0}, 
    cartao: {val:0, count:0}, 
    dinheiro: {val:0, count:0} 
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header Profissional */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Histórico de Vendas</h1>
            <p className="text-slate-500 text-sm font-medium">Análise de desempenho e faturamento faturado.</p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-200"
          >
            <span>📑</span> Exportar PDF
          </button>
        </div>

        {/* Grid de Métricas (Dashboard Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Faturamento Total" 
            value={brl(totalVendas)} 
            sub="Vendas finalizadas" 
            color="text-emerald-700" 
            bgColor="bg-emerald-50" // Fundo suave para o ícone
            icon="💰" 
          />
          <MetricCard 
            title="Total de Pedidos" 
            value={totalPedidos} 
            sub="Volume de vendas" 
            color="text-blue-700" 
            bgColor="bg-blue-50" 
            icon="📦" 
          />
          <MetricCard 
            title="Ticket Médio" 
            value={brl(ticketMedio)} 
            sub="Média por cliente" 
            color="text-amber-700" 
            bgColor="bg-amber-50" 
            icon="🎯" 
          />
          
          {/* Card de Métodos (ajustado para manter o padrão de altura) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Métodos de Pagamento</p>
            <div className="space-y-1.5">
              <PaymentRow label="Pix" val={metodos.pix.val} count={metodos.pix.count} />
              <PaymentRow label="Cartão" val={metodos.cartao.val} count={metodos.cartao.count} />
              <PaymentRow label="Dinheiro" val={metodos.dinheiro.val} count={metodos.dinheiro.count} />
            </div>
          </div>
        </div>

        {/* Filtros e Controles */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["day", "week", "month", "custom"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
                  filter === f ? "bg-slate-800 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {f === 'day' ? 'Hoje' : f === 'week' ? 'Semana' : f === 'month' ? 'Mês' : 'Personalizado'}
              </button>
            ))}
          </div>

          {filter === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 focus:ring-2 focus:ring-slate-200" />
              <span className="text-slate-400 font-bold">→</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 focus:ring-2 focus:ring-slate-200" />
            </div>
          )}
        </div>

        {/* Listagem Estilizada */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Cliente</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Data/Hora</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Pagamento</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Tipo</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-right">Total</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 font-bold text-slate-700">{o.customer || "Consumidor"}</td>
                    <td className="p-5 text-xs text-slate-500">{o.createdAt ? toDate(o.createdAt).toLocaleString("pt-BR") : "—"}</td>
                    <td className="p-5"><span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">{o.paymentMethod}</span></td>
                    <td className="p-5 text-xs font-medium text-slate-600 capitalize">{o.deliveryType}</td>
                    <td className="p-5 text-right font-black text-slate-800">{brl(o.total)}</td>
                    <td className="p-5 text-center">
                      <button onClick={() => deleteOrder(o.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map(o => (
              <div key={o.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-800">{o.customer || "Consumidor"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{o.createdAt ? toDate(o.createdAt).toLocaleString("pt-BR") : "—"}</p>
                  </div>
                  <p className="font-black text-emerald-600">{brl(o.total)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">{o.paymentMethod}</span>
                  <button onClick={() => deleteOrder(o.id)} className="text-rose-500 text-sm font-bold">Excluir</button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium tracking-tight italic">Nenhum pedido finalizado no período selecionado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Subcomponentes para Limpeza de Código
function MetricCard({ title, value, sub, color, icon, bgColor }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
      {/* Círculo do Ícone em Destaque */}
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center text-2xl shadow-inner`}>
        {icon}
      </div>
      
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
          {title}
        </p>
        <p className={`text-2xl font-black ${color} leading-none`}>
          {value}
        </p>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
          {sub}
        </p>
      </div>
    </div>
  );
}

function PaymentRow({ label, val, count }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-slate-500 font-bold">{label}</span>
      <span className="text-slate-800 font-black">{brl(val)} <span className="text-slate-400 font-medium">({count})</span></span>
    </div>
  );
}