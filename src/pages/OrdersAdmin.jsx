import { useEffect, useState, useRef } from "react";
import { db } from "/src/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { FiBell, FiBellOff, FiPrinter, FiTrash2 } from "react-icons/fi";

import notificacaoSound from "../sound/notificação.mp3";

// 🔹 Helper para garantir que preço nunca vire NaN
function parsePreco(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return parseFloat(value.replace(",", ".").replace("R$", "").trim()) || 0;
  }
  return 0;
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem("soundEnabled") === "true"
  );
  const audioRef = useRef(null);
  const prevIdsRef = useRef([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);

      const currentIds = docs.map((o) => o.id);
      const novosPendentes = docs.filter(
        (o) =>
          (o.status || "").trim().toUpperCase() === "PENDENTE" &&
          !prevIdsRef.current.includes(o.id)
      );

      if (soundEnabled && novosPendentes.length > 0) {
        toast.success("📦 Novo pedido recebido!");
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .catch((err) => console.error("Erro ao tocar áudio:", err));
        }
      }

      prevIdsRef.current = currentIds;
    });

    return () => unsub();
  }, [soundEnabled]);

  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      localStorage.setItem("soundEnabled", "false");
      toast("🔕 Som desativado");
    } else {
      setSoundEnabled(true);
      localStorage.setItem("soundEnabled", "true");
      toast.success("🔔 Notificações sonoras ativadas!");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: status.trim().toUpperCase(),
      });
    } catch (err) {
      console.error("❌ Erro ao atualizar status:", err);
    }
  };

  const deleteOrder = async (id) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (err) {
        console.error("❌ Erro ao excluir pedido:", err);
      }
    }
  };

  // 🔹 Impressão da Cozinha
  const printOrderKitchen = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();

    const itensHTML = (pedido.items || [])
      .map(
        (item) => `
        <div style="margin-bottom:18px; border-bottom:1px dashed #000; padding-bottom:8px;">
          <p style="font-size:22px; font-weight:bold;">
            ${item.qty || 1}x ${item.name} ${item.size ? `(${item.size})` : ""}
          </p>
          ${item.flavors ? `<p>🍕 Sabores: ${item.flavors.join(" / ")}</p>` : ""}
          ${item.crust ? `<p>🍞 Borda: ${item.crust.nome}</p>` : ""}
          ${
            item.addons?.length
              ? `<p>➕ Adicionais: ${item.addons.map((a) => a.nome).join(", ")}</p>`
              : ""
          }
          ${
            item.observacoes
              ? `<p style="color:red; font-weight:bold; font-size:18px;">📝 OBS: ${item.observacoes}</p>`
              : ""
          }
        </div>
      `
      )
      .join("");

    const conteudo = `
      <html>
        <head>
          <title>Cozinha - Pedido #${numeroPedido}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 16px; }
            h1 { font-size: 24px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>👨‍🍳 COZINHA - PEDIDO #${numeroPedido}</h1>
          ${itensHTML || "<p>Nenhum item</p>"}
          <h2 style="margin-top:20px;">⚠️ Observação do Cliente:</h2>
          <p style="color:red; font-weight:bold; font-size:18px;">
            ${pedido.observacao || "Sem observações"}
          </p>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  // 🔹 Impressão do Entregador
  const printOrderDelivery = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();

    const itensHTML = (pedido.items || [])
      .map(
        (item) => `
        <tr>
          <td>${item.qty || 1}</td>
          <td>
            ${item.name} ${item.size ? `(${item.size})` : ""}
            ${item.flavors ? `<br/>🍕 ${item.flavors.join(" / ")}` : ""}
            ${item.crust ? `<br/>🍞 ${item.crust.nome}</p>` : ""}
            ${item.addons?.length ? `<br/>➕ ${item.addons.map((a) => a.nome).join(", ")}` : ""}
          </td>
          <td style="text-align:right;">R$ ${(parsePreco(item.price) * (item.qty || 1)).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

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
          ${
            pedido.observacao
              ? `<p><strong>OBS Cliente:</strong> ${pedido.observacao}</p>`
              : ""
          }
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  // 🔹 Estatísticas do dia
  const hoje = new Date().toISOString().slice(0, 10);
  const pedidosHoje = orders.filter((o) => {
    if (!o.createdAt) return false;
    const data = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return data.toISOString().slice(0, 10) === hoje;
  });

  const totalPedidosHoje = pedidosHoje.length;
  const totalFinalizados = pedidosHoje.filter(
    (o) => (o.status || "").toUpperCase() === "FINALIZADO"
  ).length;
  const valorTotalHoje = pedidosHoje.reduce(
    (acc, o) => acc + parsePreco(o.total),
    0
  );
  const ticketMedio =
    totalPedidosHoje > 0 ? valorTotalHoje / totalPedidosHoje : 0;

  const ativos = orders.filter(
    (o) => (o.status || "").trim().toUpperCase() !== "FINALIZADO"
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <audio ref={audioRef} src={notificacaoSound} preload="auto" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📦 Painel de Pedidos
          </h1>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto ${
              soundEnabled ? "bg-green-500 text-white" : "bg-gray-400 text-white"
            }`}
          >
            {soundEnabled ? <FiBell /> : <FiBellOff />}
            {soundEnabled ? "Som Ativado" : "Som Desativado"}
          </button>
        </div>

        {/* Dashboard */}
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            📊 Vendas do Dia ({hoje})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-blue-100 text-blue-800 shadow-sm">
              <p className="text-sm">Total de Pedidos</p>
              <p className="text-2xl font-bold">{totalPedidosHoje}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-100 text-green-800 shadow-sm">
              <p className="text-sm">Finalizados</p>
              <p className="text-2xl font-bold">{totalFinalizados}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-100 text-purple-800 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm">Faturamento</p>
              <p className="text-2xl font-bold">
                R$ {valorTotalHoje.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-pink-100 text-pink-800 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm">Ticket Médio</p>
              <p className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Pedidos Ativos */}
        <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            Pedidos Ativos
          </h2>
          {ativos.length === 0 && (
            <p className="text-gray-500 text-center text-base sm:text-lg py-6">
              Nenhum pedido ativo 🚫
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {ativos.map((o) => {
              const status = (o.status || "").toUpperCase();
              return (
                <article
                  key={o.id}
                  className="p-4 rounded-xl border shadow-sm bg-gray-50 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-700">
                      👤 {o.customer || "Cliente"} —{" "}
                      <span className="text-yellow-600">
                        #{o.orderNumber || o.id.slice(-4)}
                      </span>
                    </p>
                    <p className="mt-1 font-bold text-lg text-green-600">
                      💰 R$ {parsePreco(o.total).toFixed(2)}
                    </p>

                    {/* 🔹 Dados extras */}
                    <p className="text-sm text-gray-600">📱 {o.phone || "-"}</p>
                    <p className="text-sm text-gray-600">🏠 {o.address || "Endereço não informado"}</p>
                    <p className="text-sm text-gray-600">💳 {o.paymentMethod || "-"}</p>
                    {o.observacao && (
                      <p className="text-sm text-red-600 font-semibold">
                        📝 {o.observacao}
                      </p>
                    )}

                    {/* 🔹 Lista de itens */}
                    <div className="mt-2 text-sm text-gray-700">
                      {(o.items || []).map((item, idx) => (
                        <div key={idx} className="border-t pt-1 mt-1">
                          {item.qty}x {item.name} {item.size ? `(${item.size})` : ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(o.id, "PENDENTE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center ${
                        status === "PENDENTE"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ⏳ Pendente
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "EM ANDAMENTO")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center ${
                        status === "EM ANDAMENTO"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🔄 Em andamento
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "FINALIZADO")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center bg-green-500 text-white hover:bg-green-600"
                    >
                      ✅ Finalizar
                    </button>
                    <button
                      onClick={() => printOrderKitchen(o)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center gap-1"
                    >
                      <FiPrinter /> Cozinha
                    </button>
                    <button
                      onClick={() => printOrderDelivery(o)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center bg-gray-700 text-white hover:bg-gray-800 flex items-center justify-center gap-1"
                    >
                      <FiPrinter /> Entrega
                    </button>
                    <button
                      onClick={() => deleteOrder(o.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1 sm:flex-none text-center bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-1"
                    >
                      <FiTrash2 /> Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
