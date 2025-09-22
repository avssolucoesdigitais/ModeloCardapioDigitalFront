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
  const audioRef = useRef(null);
  const prevCountRef = useRef(0);

  // 🔹 Desbloquear som na primeira interação do usuário
  useEffect(() => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setOrders(docs);

    // 🔔 Verificar se existe algum pedido novo PENDENTE que não existia antes
    const pedidosPendentesNovos = docs.filter(
      (o) =>
        (o.status || "").trim().toUpperCase() === "PENDENTE" &&
        !prevCountRef.current.includes(o.id) // só toca se for realmente novo
    );

    if (pedidosPendentesNovos.length > 0) {
      toast.success("📦 Novo pedido recebido!");
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((err) => console.error("Erro ao tocar áudio:", err));
      }
    }

    // Atualiza a lista de IDs já notificados
    prevCountRef.current = docs.map((o) => o.id);
  });

  return () => unsub();
}, []);


  // 🔹 Carregar pedidos em tempo real
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);

      // 🔔 Notificação sonora para novos pedidos
      if (docs.length > prevCountRef.current) {
        toast.success("📦 Novo pedido recebido!");
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .catch((err) => console.error("Erro ao tocar áudio:", err));
        }
      }
      prevCountRef.current = docs.length;
    });
    return () => unsub();
  }, []);

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
    <div className="flex flex-col bg-gray-100 min-h-screen p-6">
      {/* 🔊 Player escondido para tocar som */}
      <audio ref={audioRef} src="/src/sound/sequencetext1-33977.mp3" preload="auto" />

      <h1 className="text-2xl font-bold mb-6">📦 Pedidos e Estatísticas</h1>

      {/* 🔹 Dashboard Resumo */}
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

      {/* 🔹 Lista de Pedidos Ativos */}
      <div className="bg-white/90 rounded-lg shadow-lg p-6">
        {ativos.length === 0 && (
          <p className="text-gray-500 text-center text-lg mt-6">
            Nenhum pedido ativo no momento
          </p>
        )}

        <div className="space-y-6">
          {ativos.map((o) => {
            const status = (o.status || "").toUpperCase();
            return (
              <div
                key={o.id}
                className="p-5 rounded-2xl shadow-md bg-white border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-lg">
                    👤 {o.customer || "Cliente não informado"} —{" "}
                    <span className="text-yellow-600">
                      #{o.orderNumber || o.id.slice(-4)}
                    </span>
                  </p>
                  <span className="text-sm text-gray-500">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString("pt-BR")
                      : "—"}
                  </span>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  {o.phone && <p>📱 WhatsApp: {o.phone}</p>}
                  {o.deliveryType === "entrega" && (
                    <>
                      {o.address && <p>🏘️ Endereço: {o.address}</p>}
                      {o.taxaEntrega && (
                        <p className="text-orange-600 font-semibold">
                          🚚 Taxa de entrega: R$ {Number(o.taxaEntrega).toFixed(2)}
                        </p>
                      )}
                    </>
                  )}
                  <p>💳 Pagamento: {o.paymentMethod || "—"}</p>
                  <p>🚚 Tipo: {o.deliveryType || "—"}</p>
                  {o.observacoes && (
                    <p className="text-red-600 font-medium">
                      ✍️ Obs: {o.observacoes}
                    </p>
                  )}
                </div>

                <p className="mt-3 font-bold text-lg text-green-600">
                  💰 Total: R$ {Number(o.total || 0).toFixed(2)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(o.id, "PENDENTE", o)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      status === "PENDENTE"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ⏳ Pendente
                  </button>

                  <button
                    onClick={() => updateStatus(o.id, "EM ANDAMENTO", o)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      status === "EM ANDAMENTO"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🔄 Em andamento
                  </button>

                  <button
                    onClick={() => updateStatus(o.id, "FINALIZADO", o)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition"
                  >
                    ✅ Finalizar
                  </button>

                  <button
                    onClick={() => deleteOrder(o.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
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
  );
}
