import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp, FiShoppingBag, FiDollarSign, FiPercent,
  FiCalendar, FiBarChart2, FiPieChart, FiClock,
  FiDownload, FiList, FiTrash2,
} from "react-icons/fi";
import { Chart, registerables } from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
Chart.register(...registerables);

// ─── Utilitários ──────────────────────────────────────────────────────────────

const toDate = (v) => (v?.toDate ? v.toDate() : new Date(v));
const brl = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const parsePreco = (v) => {
  if (!v && v !== 0) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(",", ".").replace("R$", "").trim()) || 0;
};
const normalize = (s) =>
  (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const PERIOD_OPTIONS = [
  { key: "7d",     label: "7 dias"        },
  { key: "30d",    label: "30 dias"       },
  { key: "90d",    label: "90 dias"       },
  { key: "custom", label: "Personalizado" },
];

function startOf(key) {
  const d = new Date();
  if (key === "7d")  { d.setDate(d.getDate() - 6); }
  if (key === "30d") { d.setDate(d.getDate() - 29); }
  if (key === "90d") { d.setDate(d.getDate() - 89); }
  d.setHours(0, 0, 0, 0);
  return d;
}

const toInputDate  = (d) => d.toISOString().slice(0, 10);
const todayStr     = ()  => toInputDate(new Date());
const nDaysAgoStr  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toInputDate(d); };

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CrmAdmin({ lojaId }) {
  const [orders, setOrders]       = useState([]);
  const [period, setPeriod]       = useState("30d");
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "history"
  const [customRange, setCustomRange] = useState({
    start: nDaysAgoStr(29),
    end:   todayStr(),
  });
  const [exporting, setExporting] = useState(false);

  // Histórico: filtros específicos da aba
  const [histFilter, setHistFilter]    = useState("month");
  const [histDateRange, setHistDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const q = query(
      collection(db, "lojas", lojaId, "orders"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => (o.status || "").toUpperCase() === "FINALIZADO");
      setOrders(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [lojaId]);

  // ── Filtro do dashboard ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let from, to;
    if (period === "custom") {
      from = new Date(customRange.start + "T00:00:00");
      to   = new Date(customRange.end   + "T23:59:59");
    } else {
      from = startOf(period);
      to   = new Date();
    }
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const d = toDate(o.createdAt);
      return d >= from && d <= to;
    });
  }, [orders, period, customRange]);

  // ── Filtro do histórico ──────────────────────────────────────────────────────
  const histFiltered = useMemo(() => {
    const now  = new Date();
    const start = histDateRange.start ? new Date(histDateRange.start) : null;
    const end   = histDateRange.end   ? new Date(histDateRange.end)   : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end)   end.setHours(23, 59, 59, 999);

    return orders.filter((o) => {
      const date = toDate(o.createdAt);
      if (!(date instanceof Date) || isNaN(date)) return false;
      if (histFilter === "day")    return date.toDateString() === now.toDateString();
      if (histFilter === "week")   { const w = new Date(); w.setDate(now.getDate() - 7); return date >= w && date <= now; }
      if (histFilter === "month")  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (histFilter === "custom" && start && end) return date >= start && date <= end;
      return true;
    });
  }, [orders, histFilter, histDateRange]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const fat    = filtered.reduce((a, o) => a + parsePreco(o.total), 0);
    const total  = filtered.length;
    const ticket = total > 0 ? fat / total : 0;
    const totalItens = filtered.reduce((a, o) => a + (o.items?.length || 0), 0);
    const itensMedio = total > 0 ? (totalItens / total).toFixed(1) : "0.0";
    return { fat, total, ticket, itensMedio };
  }, [filtered]);

  // ── KPIs do histórico ────────────────────────────────────────────────────────
  const histKpis = useMemo(() => {
    const totalVendas  = histFiltered.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const totalPedidos = histFiltered.length;
    const ticketMedio  = totalPedidos > 0 ? totalVendas / totalPedidos : 0;
    const metodos = histFiltered.reduce((acc, o) => {
      const pm  = normalize(o.paymentMethod);
      const val = Number(o.total || 0);
      if (pm.includes("pix"))                   { acc.pix.val += val; acc.pix.count++; }
      else if (pm.match(/cartao|credito|debito/)) { acc.cartao.val += val; acc.cartao.count++; }
      else if (pm.includes("dinheiro"))           { acc.dinheiro.val += val; acc.dinheiro.count++; }
      return acc;
    }, { pix: { val: 0, count: 0 }, cartao: { val: 0, count: 0 }, dinheiro: { val: 0, count: 0 } });
    return { totalVendas, totalPedidos, ticketMedio, metodos };
  }, [histFiltered]);

  // ── Gráficos do dashboard ────────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    let from, to;
    if (period === "custom") {
      from = new Date(customRange.start + "T00:00:00");
      to   = new Date(customRange.end   + "T23:59:59");
    } else {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      to   = new Date();
      from = new Date(); from.setDate(from.getDate() - (days - 1)); from.setHours(0,0,0,0);
    }
    const map = {};
    const cursor = new Date(from);
    while (cursor <= to) {
      map[cursor.toISOString().slice(0, 10)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    filtered.forEach((o) => {
      const key = toDate(o.createdAt).toISOString().slice(0, 10);
      if (key in map) map[key] += parsePreco(o.total);
    });
    return {
      labels: Object.keys(map).map((k) => { const [, m, d] = k.split("-"); return `${d}/${m}`; }),
      values: Object.values(map),
    };
  }, [filtered, period, customRange]);

  const hourlyData = useMemo(() => {
    const map = Array(24).fill(0);
    filtered.forEach((o) => { const h = toDate(o.createdAt).getHours(); map[h]++; });
    return map;
  }, [filtered]);

  const paymentData = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const pm = normalize(o.paymentMethod);
      let label = "Outros";
      if (pm.includes("pix"))                   label = "Pix";
      else if (pm.match(/credito|crédito/))     label = "Crédito";
      else if (pm.match(/debito|débito/))       label = "Débito";
      else if (pm.match(/cartao|cartão/))       label = "Cartão";
      else if (pm.includes("dinheiro"))         label = "Dinheiro";
      else if (pm.includes("vr") || pm.includes("vale")) label = "VR/Vale";
      map[label] = (map[label] || 0) + 1;
    });
    return map;
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      (o.items || []).forEach((item) => {
        const name = item.name || "Sem nome";
        if (!map[name]) map[name] = { qty: 0, revenue: 0 };
        map[name].qty     += item.qty || 1;
        map[name].revenue += parsePreco(item.price) * (item.qty || 1);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty).slice(0, 7);
  }, [filtered]);

  const deliveryData = useMemo(() => {
    const map = { Delivery: 0, Retirada: 0, Mesa: 0 };
    filtered.forEach((o) => {
      const t = normalize(o.deliveryType || "");
      if (t.includes("deliver") || t.includes("entrega")) map["Delivery"]++;
      else if (t.includes("retir") || t.includes("balc"))  map["Retirada"]++;
      else                                                   map["Mesa"]++;
    });
    return map;
  }, [filtered]);

  // ── Exportar PDF (dashboard) ─────────────────────────────────────────────────
  const exportPDF = () => {
    setExporting(true);
    try {
      const docPdf = new jsPDF();
      const periodLabel = period === "custom"
        ? `${customRange.start} → ${customRange.end}`
        : PERIOD_OPTIONS.find((p) => p.key === period)?.label;

      docPdf.setFontSize(18);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text("Relatório de Vendas — CRM", 14, 20);
      docPdf.setFontSize(10);
      docPdf.setTextColor(100, 116, 139);
      docPdf.text(`Período: ${periodLabel}   |   Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
      docPdf.setFontSize(11);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text(`Faturamento: ${brl(kpis.fat)}   |   Pedidos: ${kpis.total}   |   Ticket médio: ${brl(kpis.ticket)}`, 14, 38);
      docPdf.setFontSize(12);
      docPdf.text("Top Produtos", 14, 50);
      autoTable(docPdf, {
        startY: 54,
        head: [["Produto", "Qtd vendida", "Faturamento"]],
        body: topProducts.map(([name, { qty, revenue }]) => [name, qty, brl(revenue)]),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 },
      });
      const afterTop = docPdf.lastAutoTable.finalY + 8;
      docPdf.setFontSize(12);
      docPdf.text("Pedidos Finalizados", 14, afterTop);
      autoTable(docPdf, {
        startY: afterTop + 4,
        head: [["Pedido", "Cliente", "Pagamento", "Tipo", "Total", "Data"]],
        body: filtered.map((o) => [
          "#" + (o.orderNumber || o.id.slice(-4).toUpperCase()),
          o.customer || "Consumidor",
          o.paymentMethod || "—",
          o.deliveryType || "—",
          brl(parsePreco(o.total)),
          o.createdAt ? toDate(o.createdAt).toLocaleDateString("pt-BR") : "—",
        ]),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
      });
      docPdf.save(`crm-relatorio-${period === "custom" ? customRange.start + "_" + customRange.end : period}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  // ── Exportar PDF (histórico) ─────────────────────────────────────────────────
  const exportHistPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18);
    docPdf.text("Relatório de Vendas Faturadas", 14, 20);
    const tableData = histFiltered.map((o) => [
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
      theme: "striped",
      headStyles: { fillColor: [31, 41, 55] },
    });
    docPdf.save(`relatorio-historico-${histFilter}.pdf`);
  };

  // ── Excluir pedido ───────────────────────────────────────────────────────────
  const deleteOrder = async (id) => {
    if (confirm("Deseja remover este pedido do histórico permanentemente?")) {
      try {
        await deleteDoc(doc(db, "lojas", lojaId, "orders", id));
      } catch (err) {
        console.error("Erro:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Cabeçalho com Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">CRM — Análise de Vendas</h1>
            <p className="text-slate-500 text-sm font-medium">Visão estratégica do desempenho do negócio</p>
          </div>

          {/* Botão de exportar contextual */}
          {activeTab === "dashboard" ? (
            <button
              onClick={exportPDF}
              disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-200 active:scale-95"
            >
              <FiDownload size={14} />
              {exporting ? "Gerando..." : "Exportar PDF"}
            </button>
          ) : (
            <button
              onClick={exportHistPDF}
              disabled={histFiltered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-200 active:scale-95"
            >
              <FiDownload size={14} />
              Exportar PDF
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<FiBarChart2 size={14} />}
            label="Dashboard"
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<FiList size={14} />}
            label="Histórico de Pedidos"
          />
        </div>
      </div>

      {/* ── Conteúdo das Tabs ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Seletor de período */}
            <div className="flex flex-wrap items-center gap-2">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all
                    ${period === p.key
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400"}`}
                >
                  {p.label}
                </button>
              ))}
              <AnimatePresence>
                {period === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input
                      type="date"
                      value={customRange.start}
                      max={customRange.end}
                      onChange={(e) => setCustomRange((r) => ({ ...r, start: e.target.value }))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <span className="text-slate-400 font-bold text-xs">→</span>
                    <input
                      type="date"
                      value={customRange.end}
                      min={customRange.start}
                      max={todayStr()}
                      onChange={(e) => setCustomRange((r) => ({ ...r, end: e.target.value }))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={<FiDollarSign />}  label="Faturamento"    value={brl(kpis.fat)}    color="emerald" />
              <KpiCard icon={<FiShoppingBag />} label="Pedidos"        value={kpis.total}        color="blue"   />
              <KpiCard icon={<FiTrendingUp />}  label="Ticket médio"   value={brl(kpis.ticket)}  color="purple" />
              <KpiCard icon={<FiPercent />}     label="Itens / pedido" value={kpis.itensMedio}   color="amber"  />
            </div>

            {/* Gráficos linha 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard title="Faturamento por dia" sub="Evolução das vendas no período" icon={<FiBarChart2 />}>
                  <LineChart data={dailyData} />
                </ChartCard>
              </div>
              <ChartCard title="Forma de pagamento" sub="Distribuição por método" icon={<FiPieChart />}>
                <DoughnutChart data={paymentData} />
              </ChartCard>
            </div>

            {/* Gráficos linha 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Top produtos" sub="Mais pedidos no período" icon={<FiShoppingBag />}>
                <TopProductsList data={topProducts} />
              </ChartCard>
              <ChartCard title="Pedidos por hora" sub="Pico de movimento do dia" icon={<FiClock />}>
                <HourlyChart data={hourlyData} />
              </ChartCard>
            </div>

            {/* Gráficos linha 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard title="Tipo de entrega" sub="Canal de atendimento" icon={<FiPieChart />}>
                <DeliveryBars data={deliveryData} total={kpis.total} />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard title="Últimos pedidos" sub="Histórico recente" icon={<FiCalendar />}>
                  <RecentOrders orders={filtered.slice(0, 8)} />
                </ChartCard>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* Filtros do histórico */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "day",    label: "Hoje"         },
                  { key: "week",   label: "Semana"       },
                  { key: "month",  label: "Mês"          },
                  { key: "custom", label: "Personalizado" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setHistFilter(f.key)}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
                      histFilter === f.key
                        ? "bg-slate-800 text-white shadow-md"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {histFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={histDateRange.start}
                    onChange={(e) => setHistDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2"
                  />
                  <span className="text-slate-400 font-bold">→</span>
                  <input
                    type="date"
                    value={histDateRange.end}
                    onChange={(e) => setHistDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2"
                  />
                </div>
              )}
            </div>

            {/* Tabela de pedidos */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Desktop */}
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
                    {histFiltered.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-5 font-bold text-slate-700">{o.customer || "Consumidor"}</td>
                        <td className="p-5 text-xs text-slate-500">
                          {o.createdAt ? toDate(o.createdAt).toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="p-5 text-xs font-medium text-slate-600 capitalize">{o.deliveryType}</td>
                        <td className="p-5 text-right font-black text-slate-800">{brl(o.total)}</td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-slate-100">
                {histFiltered.map((o) => (
                  <div key={o.id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-800">{o.customer || "Consumidor"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {o.createdAt ? toDate(o.createdAt).toLocaleString("pt-BR") : "—"}
                        </p>
                      </div>
                      <p className="font-black text-emerald-600">{brl(o.total)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">
                        {o.paymentMethod}
                      </span>
                      <button
                        onClick={() => deleteOrder(o.id)}
                        className="text-rose-500 text-sm font-bold flex items-center gap-1"
                      >
                        <FiTrash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {histFiltered.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-slate-400 font-medium tracking-tight italic">
                    Nenhum pedido finalizado no período selecionado.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
        active
          ? "bg-white text-slate-800 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── MetricCard (histórico) ───────────────────────────────────────────────────

function MetricCard({ title, value, sub, color, icon, bgColor }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center text-2xl shadow-inner`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{sub}</p>
      </div>
    </div>
  );
}

// ─── PaymentRow ───────────────────────────────────────────────────────────────

function PaymentRow({ label, val, count }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-slate-500 font-bold">{label}</span>
      <span className="text-slate-800 font-black">
        {brl(val)} <span className="text-slate-400 font-medium">({count})</span>
      </span>
    </div>
  );
}

// ─── KPI Card (dashboard) ─────────────────────────────────────────────────────

const colorMap = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    icon: "bg-blue-100 text-blue-600"       },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  icon: "bg-purple-100 text-purple-600"   },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   icon: "bg-amber-100 text-amber-600"     },
};

function KpiCard({ icon, label, value, color }) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} p-5 rounded-3xl border border-white shadow-sm flex items-center gap-4`}
    >
      <div className={`w-11 h-11 rounded-2xl ${c.icon} flex items-center justify-center text-lg flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className={`text-xl font-black ${c.text} truncate`}>{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, sub, icon, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="text-slate-400 mt-0.5">{icon}</span>
        <div>
          <p className="font-black text-slate-800 text-sm">{title}</p>
          <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.07)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8", maxTicksLimit: 8, autoSkip: true } },
          y: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 10 }, color: "#94a3b8", callback: (v) => "R$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v) } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return <div style={{ position: "relative", height: 180 }}><canvas ref={ref} /></div>;
}

// ─── Doughnut Chart ───────────────────────────────────────────────────────────

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444", "#0ea5e9"];

function DoughnutChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const labels = Object.keys(data);
  const values = Object.values(data);
  useEffect(() => {
    if (!ref.current || labels.length === 0) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data: values, backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { display: false } } },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-col gap-3">
      <div style={{ position: "relative", height: 140 }}><canvas ref={ref} /></div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {labels.map((l, i) => (
          <span key={l} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
            {l} {total > 0 ? Math.round((values[i] / total) * 100) : 0}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Top Products ─────────────────────────────────────────────────────────────

function TopProductsList({ data }) {
  if (data.length === 0) return <Empty />;
  const max = data[0]?.[1].qty || 1;
  return (
    <ul className="space-y-2.5">
      {data.map(([name, { qty, revenue }], i) => (
        <li key={name} className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-300 w-4 flex-shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{name}</span>
              <span className="text-xs font-black text-slate-500 ml-2 flex-shrink-0">{qty}x</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.round((qty / max) * 100)}%` }} />
            </div>
          </div>
          <span className="text-[11px] font-black text-emerald-600 flex-shrink-0">{brl(revenue)}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Hourly Chart ─────────────────────────────────────────────────────────────

function HourlyChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const max = Math.max(...data, 1);
  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map((_, i) => `${i}h`),
        datasets: [{ data, backgroundColor: data.map((v) => v === max && max > 0 ? "#2563eb" : "#dbeafe"), borderRadius: 4, borderSkipped: false }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#94a3b8", maxTicksLimit: 12, autoSkip: true } },
          y: { display: false },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);
  return <div style={{ position: "relative", height: 160 }}><canvas ref={ref} /></div>;
}

// ─── Delivery Bars ────────────────────────────────────────────────────────────

const DELIVERY_COLORS = {
  Delivery: { bar: "bg-blue-500",   badge: "bg-blue-50 text-blue-700"     },
  Retirada: { bar: "bg-amber-500",  badge: "bg-amber-50 text-amber-700"   },
  Mesa:     { bar: "bg-purple-500", badge: "bg-purple-50 text-purple-700" },
};

function DeliveryBars({ data, total }) {
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const c   = DELIVERY_COLORS[label] || { bar: "bg-slate-400", badge: "bg-slate-50 text-slate-600" };
        return (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${c.badge}`}>{label}</span>
              <span className="text-xs font-black text-slate-700">{count} <span className="text-slate-400 font-medium">({pct}%)</span></span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recent Orders ────────────────────────────────────────────────────────────

function RecentOrders({ orders }) {
  if (orders.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100">
            {["Pedido", "Cliente", "Pagamento", "Total", "Data"].map((h) => (
              <th key={h} className="pb-2 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 pr-4 font-black text-blue-600">#{o.orderNumber || o.id.slice(-4).toUpperCase()}</td>
              <td className="py-2.5 pr-4 font-bold text-slate-700 max-w-[120px] truncate">{o.customer || "Consumidor"}</td>
              <td className="py-2.5 pr-4">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase whitespace-nowrap">{o.paymentMethod || "—"}</span>
              </td>
              <td className="py-2.5 pr-4 font-black text-emerald-600 whitespace-nowrap">{brl(parsePreco(o.total))}</td>
              <td className="py-2.5 text-slate-400 whitespace-nowrap">{o.createdAt ? toDate(o.createdAt).toLocaleDateString("pt-BR") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="py-10 text-center text-slate-400 text-sm font-medium italic">
      Nenhum dado no período selecionado.
    </div>
  );
}