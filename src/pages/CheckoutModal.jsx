import { useState, useMemo } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import useLojaConfig from "../hooks/useLojaConfig";

export default function CheckoutModal({ open, onClose, cart, whatsapp, lojaId = "daypizza" }) {
  const { config, loading: loadingConfig } = useLojaConfig(lojaId);

  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [entrega, setEntrega] = useState("entrega");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [referencia, setReferencia] = useState("");
  const [bairro, setBairro] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  const itensCarrinho = cart.items || [];

  const subtotal = useMemo(() => {
    return itensCarrinho.reduce(
      (acc, item) => acc + (item.qty || 0) * (item.price || 0),
      0
    );
  }, [itensCarrinho]);

  const taxaEntrega = useMemo(() => {
    if (entrega !== "entrega") return 0;
    const b = config?.bairros?.find((b) => b.nome === bairro);
    return b ? Number(b.taxa || 0) : 0;
  }, [bairro, entrega, config]);

  const total = subtotal + taxaEntrega;

  if (!open) return null;

  if (loadingConfig || !config) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
          Carregando configuração da loja…
        </div>
      </div>
    );
  }

  const handleConfirmar = async () => {
    if (!nome.trim()) return alert("Digite seu nome.");
    if (!phone.trim()) return alert("Digite seu WhatsApp.");
    if (entrega === "entrega" && (!bairro || !rua.trim() || !numero.trim())) {
      return alert("Preencha corretamente seu endereço.");
    }
    if (itensCarrinho.length === 0) return alert("Seu carrinho está vazio.");

    setLoading(true);
    try {
      const enderecoFinal =
        entrega === "entrega"
          ? `${rua}, ${numero} - ${bairro} (Ref: ${referencia || "—"})`
          : "RETIRADA NA LOJA";

      const orderNumber = Date.now().toString().slice(-6);

      await addDoc(collection(db, "orders"), {
        orderNumber,
        customer: nome,
        phone,
        address: enderecoFinal,
        bairro,
        reference: referencia,
        paymentMethod: pagamento,
        deliveryType: entrega,
        items: itensCarrinho,
        subtotal,
        taxaEntrega,
        total,
        observacao,
        status: "PENDENTE",
        createdAt: new Date().toISOString(),
      });

      let msg = `🛒 *Novo Pedido #${orderNumber}*%0A`;
      msg += `👤 Cliente: ${nome}%0A`;
      msg += `📱 WhatsApp: ${phone}%0A`;

      if (entrega === "entrega") {
        msg += `🏠 Endereço: ${rua}, ${numero}%0A`;
        msg += `📍 Bairro: ${bairro}%0A`;
        if (referencia) msg += `📝 Ref: ${referencia}%0A`;
      } else {
        msg += `📍 Retirada na loja%0A`;
      }

      msg += `💳 Pagamento: ${pagamento.toUpperCase()}%0A`;
      msg += `🚚 Forma: ${entrega === "entrega" ? "Entrega" : "Retirada"}%0A`;

      if (observacao.trim()) {
        msg += `📝 Observações: ${observacao}%0A`;
      }

      msg += `%0A*Itens:*%0A`;
      itensCarrinho.forEach((item) => {
        const qty = item?.qty ?? 0;
        const name = item?.name ?? "—";
        const size = item?.size ? `(${item.size})` : "";
        const price = Number(item?.price ?? 0).toFixed(2);

        let desc = `${qty}x ${name} ${size}`;
        if (Array.isArray(item.flavors) && item.flavors.length > 0) {
          desc += ` [${item.flavors.join(" + ")}]`;
        }
        msg += `- ${desc} (R$ ${price})%0A`;
      });

      msg += `%0A💰 *Subtotal:* R$ ${subtotal.toFixed(2)}%0A`;
      msg += `🚚 *Taxa de entrega:* R$ ${taxaEntrega.toFixed(2)}%0A`;
      msg += `✅ *Total:* R$ ${total.toFixed(2)}`;

      let adminPhone = "558999999999";
      if (typeof whatsapp === "string" && whatsapp.trim()) {
        adminPhone = whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`;
      }

      const url = `https://wa.me/${adminPhone}?text=${msg}`;
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("Erro ao processar o pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">Finalizar Pedido</h2>

        {/* Resumo */}
        <div className="text-sm text-gray-600 mb-3">
          <div>Subtotal: R$ {subtotal.toFixed(2)}</div>
          <div>Taxa de entrega: R$ {taxaEntrega.toFixed(2)}</div>
          <div className="font-semibold">Total: R$ {total.toFixed(2)}</div>
        </div>

        {/* Nome */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu nome</span>
          <input
            type="text"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite seu nome"
          />
        </label>

        {/* WhatsApp */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu WhatsApp</span>
          <input
            type="tel"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(DDD) 9xxxx-xxxx"
          />
        </label>

        {/* Observações */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Observações do pedido</span>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: sem cebola, sem maionese..."
          />
        </label>

        {/* Entrega ou retirada */}
        <label className="block mb-4">
          <span className="text-sm text-gray-600">Entrega ou retirada</span>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={entrega}
            onChange={(e) => setEntrega(e.target.value)}
          >
            <option value="entrega">Entrega</option>
            <option value="retirada">Retirada</option>
          </select>
        </label>

        {/* Endereço */}
        {entrega === "entrega" && (
          <div className="mb-4 space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600">Bairro</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              >
                <option value="">Selecione...</option>
                {config.bairros?.map((b, idx) => (
                  <option key={idx} value={b.nome}>
                    {b.nome} - R$ {Number(b.taxa).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Rua</span>
              <input
                type="text"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Número</span>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Ponto de referência</span>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>
        )}

        {/* Pagamento */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Forma de pagamento</span>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={pagamento}
            onChange={(e) => setPagamento(e.target.value)}
          >
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartão">Cartão</option>
          </select>
        </label>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-2xl hover:opacity-90"
          >
            {loading ? "Processando..." : "Confirmar Pedido"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-2xl hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
