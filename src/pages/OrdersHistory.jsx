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

export default function OrdersHistory() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("month"); // day | week | month | custom
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // helper para normalizar strings (minúsculo e sem acento)
  const normalize = (s) =>
    (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // helper para pegar Date do createdAt (Timestamp do Firestore ou ISO/string)
  const toDate = (createdAt) =>
    createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(
        docs.filter((o) => (o.status || "").toUpperCase() === "FINALIZADO")
      );
    });
    return () => unsub();
  }, []);

  // aplicar filtro
  useEffect(() => {
    const now = new Date();
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter((o) => {
      const date = toDate(o.createdAt);

      if (!(date instanceof Date) || isNaN(date)) return false;

      if (filter === "day") {
        return date.toDateString() === now.toDateString();
      }
      if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo && date <= now;
      }
      if (filter === "month") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }
      if (filter === "custom" && start && end) {
        return date >= start && date <= end;
      }
      return true;
    });

    setFiltered(filteredOrders);
  }, [orders, filter, dateRange]);

  // excluir pedido
  const deleteOrder = async (id) => {
    if (confirm("Tem certeza que deseja excluir este pedido do histórico?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (err) {
        console.error("❌ Erro ao excluir pedido:", err);
      }
    }
  };

  // exportar PDF
const exportReport = () => {
  const docPdf = new jsPDF();
  docPdf.text("Relatório de Vendas", 14, 20);

  const tableData = filtered.map((o) => [
    o.customer,
    o.paymentMethod || "—",
    `R$ ${Number(o.total || 0).toFixed(2)}`,
    o.deliveryType || "—",
    o.createdAt ? toDate(o.createdAt).toLocaleDateString("pt-BR") : "—",
  ]);

  const totalVendas = filtered.reduce(
    (acc, o) => acc + Number(o.total || 0),
    0
  );

  const pagamentosTotais = filtered.reduce(
    (acc, o) => {
      const pm = normalize(o.paymentMethod);
      const val = Number(o.total || 0);
      if (pm.includes("pix")) acc.pix += val;
      else if (
        pm.includes("cartao") ||
        pm.includes("credito") ||
        pm.includes("debito")
      )
        acc.cartao += val;
      else if (pm.includes("dinheiro")) acc.dinheiro += val;
      return acc;
    },
    { pix: 0, cartao: 0, dinheiro: 0 }
  );

  autoTable(docPdf, {
    head: [["Cliente", "Pagamento", "Total", "Tipo", "Data"]],
    body: tableData,
    startY: 30,
    foot: [
      [
        { content: "TOTAL PIX", colSpan: 2, styles: { halign: "right" } },
        {
          content: `R$ ${pagamentosTotais.pix.toFixed(2)}`,
          colSpan: 3,
          styles: { halign: "right" },
        },
      ],
      [
        { content: "TOTAL CARTÃO", colSpan: 2, styles: { halign: "right" } },
        {
          content: `R$ ${pagamentosTotais.cartao.toFixed(2)}`,
          colSpan: 3,
          styles: { halign: "right" },
        },
      ],
      [
        { content: "TOTAL DINHEIRO", colSpan: 2, styles: { halign: "right" } },
        {
          content: `R$ ${pagamentosTotais.dinheiro.toFixed(2)}`,
          colSpan: 3,
          styles: { halign: "right" },
        },
      ],
      [
        {
          content: "TOTAL GERAL",
          colSpan: 2,
          styles: { halign: "right", fontStyle: "bold" },
        },
        {
          content: `R$ ${totalVendas.toFixed(2)}`,
          colSpan: 3,
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
    ],
  });

  docPdf.save("relatorio.pdf");
};

  // métricas resumo
  const totalVendas = filtered.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const totalPedidos = filtered.length;
  const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

  // 🔸 Totais (R$) e contagem por método de pagamento
  const pagamentosTotais = filtered.reduce(
    (acc, o) => {
      const pm = normalize(o.paymentMethod);
      const val = Number(o.total || 0);
      if (pm.includes("pix")) acc.pix += val;
      else if (
        pm.includes("cartao") ||
        pm.includes("credito") ||
        pm.includes("debito")
      )
        acc.cartao += val;
      else if (pm.includes("dinheiro")) acc.dinheiro += val;
      return acc;
    },
    { pix: 0, cartao: 0, dinheiro: 0 }
  );

  const pagamentosCount = filtered.reduce(
    (acc, o) => {
      const pm = normalize(o.paymentMethod);
      if (pm.includes("pix")) acc.pix += 1;
      else if (
        pm.includes("cartao") ||
        pm.includes("credito") ||
        pm.includes("debito")
      )
        acc.cartao += 1;
      else if (pm.includes("dinheiro")) acc.dinheiro += 1;
      return acc;
    },
    { pix: 0, cartao: 0, dinheiro: 0 }
  );

  const entregas = filtered.filter((o) => o.deliveryType === "entrega").length;
  const retiradas = filtered.filter((o) => o.deliveryType === "retirada").length;

  // helper currency
  const brl = (n) =>
    `R$ ${Number(n || 0).toFixed(2)}`.replace(".", ",");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">💰 Total Vendas</p>
            <p className="text-xl font-bold text-green-600">
              {brl(totalVendas)}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">📦 Pedidos</p>
            <p className="text-xl font-bold">{totalPedidos}</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">🎯 Ticket Médio</p>
            <p className="text-xl font-bold">{brl(ticketMedio)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">🚚 Entregas / Retiradas</p>
            <p className="text-xl font-bold">
              {entregas} / {retiradas}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-sm text-gray-500">💳 Pagamentos</p>
            <p className="text-sm leading-6">
              PIX: <b>{brl(pagamentosTotais.pix)}</b> ({pagamentosCount.pix})<br />
              Cartão: <b>{brl(pagamentosTotais.cartao)}</b> ({pagamentosCount.cartao})<br />
              Dinheiro: <b>{brl(pagamentosTotais.dinheiro)}</b> ({pagamentosCount.dinheiro})
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("day")}
            className={`px-3 py-1 rounded ${
              filter === "day" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFilter("week")}
            className={`px-3 py-1 rounded ${
              filter === "week" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setFilter("month")}
            className={`px-3 py-1 rounded ${
              filter === "month" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setFilter("custom")}
            className={`px-3 py-1 rounded ${
              filter === "custom" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Intervalo
          </button>

          {filter === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="border px-2 py-1 rounded"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="border px-2 py-1 rounded"
              />
            </div>
          )}
        </div>

        {/* Botão Exportar */}
        <button
          onClick={exportReport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📑 Exportar Relatório
        </button>

        {/* Listagem */}
        {filtered.length === 0 ? (
          <p className="text-gray-500">Nenhum pedido encontrado.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <div
                key={o.id}
                className="border p-4 rounded-lg shadow bg-white space-y-2"
              >
                <div className="flex justify-between">
                  <p>
                    <b>Cliente:</b> {o.customer || "—"}
                  </p>
                  <span className="text-sm text-gray-500">
                    {o.createdAt
                      ? toDate(o.createdAt).toLocaleString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <p>💳 Pagamento: {o.paymentMethod || "—"}</p>
                <p>🚚 Tipo: {o.deliveryType || "—"}</p>
                <p className="font-bold">
                  💰 Total: {brl(o.total)}
                </p>
                <button
                  onClick={() => deleteOrder(o.id)}
                  className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  🗑️ Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
