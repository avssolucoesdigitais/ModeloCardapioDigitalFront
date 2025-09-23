import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

export default function ContaPanel({ open, onClose, onLogin, lojaId = "daypizza" }) {
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

  // 🔹 Carregar config da loja (bairros permitidos)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const ref = doc(db, "lojas", lojaId, "config", "principal");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setBairrosDisponiveis(data.bairros || []);
        }
      } catch (err) {
        console.error("Erro ao carregar bairros:", err);
      }
    };
    loadConfig();
  }, [lojaId]);

  // 🔹 Carregar dados do usuário salvo
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

        // 🔹 Pedidos anteriores com sync de status em /orders
        const pedidosRef = collection(db, "users", phoneNumber, "pedidos");
        onSnapshot(pedidosRef, async (snap) => {
          const arr = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();

              // sincronizar com orders
              const orderRef = doc(db, "orders", d.id);
              const orderSnap = await getDoc(orderRef);

              return {
                id: d.id,
                ...data,
                status: orderSnap.exists()
                  ? orderSnap.data().status
                  : data.status || "PENDENTE",
              };
            })
          );
          setPedidos(arr.sort((a, b) => (b.createdAt > a.createdAt ? -1 : 1)));
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

      onLogin({
        id: phone,
        telefone: phone,
        nome,
        bairro,
        rua,
        numero,
        referencia,
        pagamentoPreferido: pagamento,
      });
      alert("Cadastro atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar cadastro:", err);
      alert("Não foi possível salvar cadastro.");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[420px] h-full bg-white shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Minha Conta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab("cadastro")}
            className={`flex-1 py-3 font-medium ${
              tab === "cadastro"
                ? "border-b-4 border-green-600 text-green-600"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Cadastro
          </button>
          <button
            onClick={() => setTab("pedidos")}
            className={`flex-1 py-3 font-medium ${
              tab === "pedidos"
                ? "border-b-4 border-green-600 text-green-600"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Pedidos
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "cadastro" && (
            <div className="flex flex-col gap-3">
              <input
                type="tel"
                placeholder="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              />

              {/* 🔹 Select de bairros permitidos */}
              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecione um bairro...</option>
                {bairrosDisponiveis.map((b, idx) => (
                  <option key={idx} value={b.nome}>
                    {b.nome} - R$ {Number(b.taxa).toFixed(2)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Rua"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Número"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Ponto de referência"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="border border-black text-black bg-white p-3 rounded-lg focus:ring-2 focus:ring-green-500"
              />

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full border border-black text-black bg-white py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}

          {tab === "pedidos" && (
            <div>
              {pedidos.length === 0 ? (
                <p className="text-gray-600">Nenhum pedido encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((p) => (
                    <div
                      key={p.id}
                      className="border border-black rounded-lg p-4 bg-black text-white shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Pedido #{p.orderNumber}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            p.status === "FINALIZADO"
                              ? "bg-green-100 text-green-700"
                              : p.status === "EM ANDAMENTO"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        Total: <strong>R$ {Number(p.total).toFixed(2)}</strong>
                      </div>
                      <div className="text-xs text-gray-300">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
