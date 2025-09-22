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

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true); // 🔊 controle de som
  const audioRef = useRef(null);
  const prevIdsRef = useRef([]); // 🔹 lista de pedidos já conhecidos

  // 🔹 Carregar pedidos em tempo real
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);

      const currentIds = docs.map((o) => o.id);

      // Filtra apenas pedidos PENDENTES que não existiam antes
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

      // Atualiza histórico de pedidos já processados
      prevIdsRef.current = currentIds;
    });

    return () => unsub();
  }, [soundEnabled]);

  // 🔹 Atualizar status + enviar mensagem WhatsApp
  const updateStatus = async (id, status, pedido) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: status.trim().toUpperCase(),
      });

      if (!pedido?.phone) return;

      const numeroPedido = pedido.orderNumber || id.slice(-4).toUpperCase();
      let msg = "";

      if (status.trim().toUpperCase() === "EM ANDAMENTO") {
        msg = `✅ Olá ${
          pedido.customer || "cliente"
        }! Seu pedido *#${numeroPedido}* foi confirmado e já está em produção 🍕🔥.`;
      }

      if (status.trim().toUpperCase() === "FINALIZADO") {
        if (pedido.deliveryType === "retirada") {
          msg = `✅ Olá ${
            pedido.customer || "cliente"
          }! Seu pedido *#${numeroPedido}* já está pronto para retirada 🏠.`;
        } else {
          msg = `🚚 Olá ${
            pedido.customer || "cliente"
          }! Seu pedido *#${numeroPedido}* já está saindo para entrega 🛵.`;
        }
      }

      if (msg) {
        const phone = pedido.phone.startsWith("55")
          ? pedido.phone
          : `55${pedido.phone.replace(/\D/g, "")}`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("❌ Erro ao atualizar status:", err);
    }
  };

  // 🔹 Excluir pedido
  const deleteOrder = async (id) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (err) {
        console.error("❌ Erro ao excluir pedido:", err);
      }
    }
  };

  // 🔹 Recibo da Cozinha
  const printOrderKitchen = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();

    const itensHTML = (pedido.items || [])
      .map(
        (item) => `
        <tr>
          <td>${item.qty || 1}x</td>
          <td>${item.name}</td>
          <td style="font-size:14px;color:red;">${item.observacoes || ""}</td>
        </tr>
      `
      )
      .join("");

    const conteudo = `
      <html>
        <head>
          <title>Cozinha - Pedido #${numeroPedido}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 26px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; border-bottom: 1px solid #ccc; font-size: 20px; }
            th { text-align: left; }
          </style>
        </head>
        <body>
          <h1>👨‍🍳 Cozinha - Pedido #${numeroPedido}</h1>
          <table>
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Produto</th>
                <th>Obs</th>
              </tr>
            </thead>
            <tbody>
              ${itensHTML || "<tr><td colspan='3'>Nenhum item</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  // 🔹 Recibo do Entregador
  const printOrderDelivery = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();

    const itensHTML = (pedido.items || [])
      .map(
        (item) => `
        <tr>
          <td>${item.qty || 1}x</td>
          <td>${item.name}</td>
          <td style="text-align:right">R$ ${(
            (item.price || 0) * (item.qty || 1)
          ).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const conteudo = `
      <html>
        <head>
          <title>Entrega - Pedido #${numeroPedido}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 22px; margin-bottom: 15px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 6px; border-bottom: 1px solid #ccc; font-size: 14px; }
            th { text-align: left; }
            .total { font-size: 18px; font-weight: bold; margin-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>🚚 Entrega - Pedido #${numeroPedido}</h1>
          <p><strong>Cliente:</strong> ${pedido.customer || "—"}</p>
          <p><strong>Telefone:</strong> ${pedido.phone || "—"}</p>
          ${
            pedido.address
              ? `<p><strong>Endereço:</strong> ${pedido.address}</p>`
              : ""
          }
          <p><strong>Pagamento:</strong> ${pedido.paymentMethod || "—"}</p>
          <p><strong>Tipo:</strong> ${pedido.deliveryType || "—"}</p>
          ${
            pedido.observacoes
              ? `<p><strong>Observações:</strong> ${pedido.observacoes}</p>`
              : ""
          }

          <h2>Itens</h2>
          <table>
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Produto</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itensHTML || "<tr><td colspan='3'>Nenhum item</td></tr>"}
            </tbody>
          </table>

          <p class="total">💰 Total: R$ ${Number(pedido.total || 0).toFixed(2)}</p>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank");
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  // 🔹 Pedidos ativos
  const ativos = orders.filter(
    (o) => (o.status || "").trim().toUpperCase() !== "FINALIZADO"
  );

  // 🔹 Estatísticas
  const totalVendas = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const pagamentos = orders.reduce(
    (acc, o) => {
      const metodo = (o.paymentMethod || "").toLowerCase();
      if (metodo.includes("pix")) acc.pix += o.total || 0;
      else if (
        metodo.includes("cartao") ||
        metodo.includes("crédito") ||
        metodo.includes("débito")
      )
        acc.cartao += o.total || 0;
      else if (metodo.includes("dinheiro")) acc.dinheiro += o.total || 0;
      return acc;
    },
    { pix: 0, cartao: 0, dinheiro: 0 }
  );

  const tiposEntrega = orders.reduce(
    (acc, o) => {
      if (o.deliveryType === "entrega") acc.entrega++;
      else acc.retirada++;
      return acc;
    },
    { entrega: 0, retirada: 0 }
  );

  const pedidosFinalizados = orders.filter(
    (o) => (o.status || "").trim().toUpperCase() === "FINALIZADO"
  ).length;

  return (
    <div className="bg-gray-50 min-h-screen p-6 sm:p-8">
      <audio
        ref={audioRef}
        src="/src/sound/notificacao.mp3"
        preload="auto"
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Painel de Pedidos</h1>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            🔊 Notificação sonora
          </label>
        </div>

        {/* 🔹 Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">💰 Total Vendas</h2>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalVendas.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">📲 PIX</h2>
            <p className="text-xl font-bold text-blue-600">
              R$ {pagamentos.pix.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">💳 Cartão</h2>
            <p className="text-xl font-bold text-purple-600">
              R$ {pagamentos.cartao.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">💵 Dinheiro</h2>
            <p className="text-xl font-bold text-yellow-600">
              R$ {pagamentos.dinheiro.toFixed(2)}
            </p>
          </div>
        </div>

        {/* 🔹 Outras métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">🚚 Entregas</h2>
            <p className="text-2xl font-bold text-orange-600">{tiposEntrega.entrega}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">🏠 Retiradas</h2>
            <p className="text-2xl font-bold text-indigo-600">{tiposEntrega.retirada}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">✅ Finalizados</h2>
            <p className="text-2xl font-bold text-green-700">{pedidosFinalizados}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-600">📦 Ativos</h2>
            <p className="text-2xl font-bold text-red-600">{ativos.length}</p>
          </div>
        </div>

        {/* 🔹 Lista de Pedidos */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Pedidos Ativos
          </h2>

          {ativos.length === 0 && (
            <p className="text-gray-500 text-center text-lg py-8">
              Nenhum pedido ativo no momento 🚫
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {ativos.map((o) => {
              const status = (o.status || "").toUpperCase();
              return (
                <div
                  key={o.id}
                  className="p-5 rounded-xl border shadow-sm bg-gray-50 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-semibold text-gray-800">
                      👤 {o.customer || "Cliente"} —{" "}
                      <span className="text-yellow-600">
                        #{o.orderNumber || o.id.slice(-4)}
                      </span>
                    </p>
                    <span className="text-xs text-gray-500">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString("pt-BR")
                        : "—"}
                    </span>
                  </div>

                  <p className="mt-3 font-bold text-lg text-green-600">
                    💰 R$ {Number(o.total || 0).toFixed(2)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(o.id, "PENDENTE", o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        status === "PENDENTE"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ⏳ Pendente
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "EM ANDAMENTO", o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        status === "EM ANDAMENTO"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🔄 Em andamento
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "FINALIZADO", o)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600"
                    >
                      ✅ Finalizar
                    </button>
                    <button
                      onClick={() => printOrderKitchen(o)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600"
                    >
                      👨‍🍳 Imprimir Cozinha
                    </button>
                    <button
                      onClick={() => printOrderDelivery(o)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-white hover:bg-gray-800"
                    >
                      🚚 Imprimir Entrega
                    </button>
                    <button
                      onClick={() => deleteOrder(o.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
