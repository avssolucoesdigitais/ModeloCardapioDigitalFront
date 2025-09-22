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
  const [soundEnabled] = useState(true);
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

  // 🔹 Recibo da Cozinha
  const printOrderKitchen = (pedido) => {
    const numeroPedido = pedido.orderNumber || pedido.id.slice(-4).toUpperCase();

    const itensHTML = (pedido.items || [])
      .map((item) => {
        const observacao =
          item.observacoes ||
          item.obs ||
          item.observacao ||
          (item.flavors && item.flavors[0]?.observacao) ||
          pedido.observacoes ||
          pedido.observacao ||
          "";

        return `
        <tr>
          <td>${item.qty || 1}x</td>
          <td>
            ${item.name} ${item.size ? `(${item.size})` : ""}
            ${item.flavors ? `<br/>🍕 Sabores: ${item.flavors.join(" / ")}` : ""}
            ${item.crust ? `<br/>🍞 Borda: ${item.crust.nome} (R$ ${item.crust.preco || 0})` : ""}
            ${
              item.addons?.length
                ? `<br/>➕ Adicionais: ${item.addons.map((a) => a.nome).join(", ")}`
                : ""
            }
          </td>
          <td style="font-size:14px;color:red;">${observacao}</td>
        </tr>
      `;
      })
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
      .map((item) => {
        const observacao =
          item.observacoes ||
          item.obs ||
          item.observacao ||
          (item.flavors && item.flavors[0]?.observacao) ||
          "";

        return `
        <tr>
          <td>${item.qty || 1}x</td>
          <td>
            ${item.name} ${item.size ? `(${item.size})` : ""}
            ${item.flavors ? `<br/>🍕 Sabores: ${item.flavors.join(" / ")}` : ""}
            ${item.crust ? `<br/>🍞 Borda: ${item.crust.nome} (R$ ${item.crust.preco || 0})` : ""}
            ${
              item.addons?.length
                ? `<br/>➕ Adicionais: ${item.addons.map((a) => a.nome).join(", ")}`
                : ""
            }
            ${
              observacao
                ? `<br/><span style="color:red">📝 ${observacao}</span>`
                : ""
            }
          </td>
          <td style="text-align:right">R$ ${(
            (item.price || 0) * (item.qty || 1)
          ).toFixed(2)}</td>
        </tr>
      `;
      })
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
          ${pedido.address ? `<p><strong>Endereço:</strong> ${pedido.address}</p>` : ""}
          <p><strong>Pagamento:</strong> ${pedido.paymentMethod || "—"}</p>
          <p><strong>Tipo:</strong> ${pedido.deliveryType || "—"}</p>
          ${
            pedido.observacoes || pedido.observacao
              ? `<p><strong>Observações:</strong> ${pedido.observacoes || pedido.observacao}</p>`
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

  const ativos = orders.filter(
    (o) => (o.status || "").trim().toUpperCase() !== "FINALIZADO"
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6 sm:p-8">
      <audio ref={audioRef} src="/src/sound/notificacao.mp3" preload="auto" />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          📦 Painel de Pedidos
        </h1>

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
                  </div>

                  <p className="mt-3 font-bold text-lg text-green-600">
                    💰 R$ {Number(o.total || 0).toFixed(2)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(o.id, "PENDENTE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        status === "PENDENTE"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ⏳ Pendente
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "EM ANDAMENTO")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        status === "EM ANDAMENTO"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🔄 Em andamento
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "FINALIZADO")}
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
