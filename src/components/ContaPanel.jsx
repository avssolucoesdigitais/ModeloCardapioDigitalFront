import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function ContaPanel({ open, onClose, onLogin }) {
  const { lojaSlug } = useParams();
  const lojaId = lojaSlug;

  const [phone, setPhone] = useState("");
  const [nome, setNome] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [referencia, setReferencia] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [tab, setTab] = useState("cadastro");
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState([]);

  useEffect(() => {
    if (!lojaId) return;
    const loadConfig = async () => {
      try {
        const ref = doc(db, "lojas", lojaId, "config", "principal");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setBairrosDisponiveis(snap.data().bairros || []);
        }
      } catch (err) {
        console.error("Erro ao carregar bairros:", err);
      }
    };
    loadConfig();
  }, [lojaId]);

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (savedPhone) loadUser(savedPhone);
  }, []);

  const loadUser = async (phoneNumber) => {
    try {
      const userRef = doc(db, "users", phoneNumber);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.telefone || phoneNumber);
        setNome(data.nome || "");
        setBairro(data.bairro || "");
        setRua(data.rua || "");
        setNumero(data.numero || "");
        setReferencia(data.referencia || "");
        setPagamento(data.pagamentoPreferido || "pix");
        onLogin({ id: phoneNumber, ...data });

        // ✅ Escuta pedidos em tempo real com status correto
        const pedidosRef = collection(db, "users", phoneNumber, "pedidos");
        onSnapshot(pedidosRef, (snap) => {
          const unsubscribes = [];
          const pedidosMap = {};

          snap.docs.forEach((d) => {
            const pedidoBase = { id: d.id, ...d.data() };
            pedidosMap[d.id] = pedidoBase;

            // ✅ Caminho correto: lojas/{lojaId}/orders/{id}
            const orderRef = doc(db, "lojas", lojaId, "orders", d.id);
            const unsub = onSnapshot(orderRef, (orderSnap) => {
              pedidosMap[d.id] = {
                ...pedidosMap[d.id],
                status: orderSnap.exists()
                  ? orderSnap.data().status
                  : pedidoBase.status || "PENDENTE",
              };
              const arr = Object.values(pedidosMap).sort((a, b) =>
                b.createdAt > a.createdAt ? 1 : -1
              );
              setPedidos(arr);
            });
            unsubscribes.push(unsub);
          });

          return () => unsubscribes.forEach((u) => u());
        });
      }
    } catch (err) {
      console.error("Erro ao carregar cadastro:", err);
    }
  };

  const handleSave = async () => {
    if (!phone || !nome) return alert("Preencha telefone e nome!");
    if (!bairro) return alert("Selecione um bairro válido!");

    setLoading(true);
    try {
      const userRef = doc(db, "users", phone);
      await setDoc(
        userRef,
        {
          telefone: phone,
          nome,
          bairro,
          rua,
          numero,
          referencia,
          pagamentoPreferido: pagamento,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      localStorage.setItem("userPhone", phone);
      onLogin({ id: phone, telefone: phone, nome, bairro, rua, numero, referencia, pagamentoPreferido: pagamento });
      alert("Cadastro atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar cadastro:", err);
      alert("Não foi possível salvar cadastro.");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop acima de tudo */}
      <div
        className="fixed inset-0 z-[200] bg-black/40"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        className="fixed top-0 right-0 z-[201] w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
        style={{ height: "100dvh" }}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white shrink-0">
          <h2 className="text-lg font-semibold">Minha Conta</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-full transition">
            <X />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setTab("cadastro")}
            className={`flex-1 py-3 font-medium ${
              tab === "cadastro" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-500 hover:text-black"
            }`}
          >
            Cadastro
          </button>
          <button
            onClick={() => setTab("pedidos")}
            className={`flex-1 py-3 font-medium ${
              tab === "pedidos" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-500 hover:text-black"
            }`}
          >
            Pedidos
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {tab === "cadastro" && (
            <div className="flex flex-col gap-3">
              <input type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />

              <select value={bairro} onChange={(e) => setBairro(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione um bairro...</option>
                {bairrosDisponiveis.map((b, idx) => (
                  <option key={idx} value={b.nome}>
                    {b.nome} - R$ {Number(b.taxa).toFixed(2)}
                  </option>
                ))}
              </select>

              <input type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Ponto de referência" value={referencia} onChange={(e) => setReferencia(e.target.value)}
                className="border text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500" />

              <button onClick={handleSave} disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}

          {tab === "pedidos" && (
            <div>
              {pedidos.length === 0 ? (
                <p className="text-gray-600 text-center">Nenhum pedido encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((p) => (
                    <div key={p.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Pedido #{p.orderNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          p.status === "FINALIZADO" ? "bg-green-100 text-green-700"
                          : p.status === "EM ANDAMENTO" ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {p.status || "PENDENTE"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        Total: <strong>R$ {Number(p.total).toFixed(2)}</strong>
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        }) : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}