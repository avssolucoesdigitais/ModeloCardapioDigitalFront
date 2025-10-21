import { useState, useMemo, useEffect } from "react";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import useLojaConfig from "../hooks/useLojaConfig";

/* Helpers */
function parsePreco(valor) {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

function formatPreco(valor) {
  return parsePreco(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function sanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  } else if (obj && typeof obj === "object") {
    const clean = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = sanitize(v);
    });
    return clean;
  }
  return obj;
}

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

  // ===== NOVO: CUPOM =====
  const [cupom, setCupom] = useState("");
  const [desconto, setDesconto] = useState(0);

  const itensCarrinho = cart.items || [];

  const subtotal = useMemo(() => {
    return itensCarrinho.reduce(
      (acc, item) => acc + (item.qty || 0) * parsePreco(item.price),
      0
    );
  }, [itensCarrinho]);

  const taxaEntrega = useMemo(() => {
    if (entrega !== "entrega") return 0;
    const b = config?.bairros?.find((b) => b.nome === bairro);
    return b ? parsePreco(b.taxa) : 0;
  }, [bairro, entrega, config]);

  const total = subtotal + taxaEntrega;

  // ===== NOVO: total com desconto =====
  const totalComDesconto = total - desconto;

  // Carregar cadastro salvo
  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (!savedPhone) return;

    const loadUser = async () => {
      try {
        const userRef = doc(db, "users", savedPhone);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setNome(data.nome || "");
          setPhone(data.telefone || savedPhone);
          setBairro(data.bairro || "");
          setRua(data.rua || "");
          setNumero(data.numero || "");
          setReferencia(data.referencia || "");
          setPagamento(data.pagamentoPreferido || "pix");
        }
      } catch (err) {
        console.error("Erro ao carregar cadastro no checkout:", err);
      }
    };

    loadUser();
  }, []);

  // ===== NOVO: validar cupom =====
  useEffect(() => {
    if (!cupom.trim() || !config?.cupons) return setDesconto(0);
    const c = config.cupons.find(
      (c) => c.codigo.toLowerCase() === cupom.trim().toLowerCase()
    );
    if (c) setDesconto(parseFloat(c.valor));
    else setDesconto(0);
  }, [cupom, config]);

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

      // atualiza cadastro
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

      // monta dados limpos
      const orderData = sanitize({
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
        desconto, // cupom aplicado
        total: totalComDesconto, // total com desconto
        observacao,
        status: "PENDENTE",
        createdAt: new Date().toISOString(),
      });

      // salva pedido global
      const orderDoc = await addDoc(collection(db, "orders"), orderData);

      // salva no histórico
      await setDoc(
        doc(db, "users", phone, "pedidos", orderDoc.id),
        sanitize({
          orderNumber,
          items: itensCarrinho,
          total: totalComDesconto,
          desconto,
          status: "PENDENTE",
          createdAt: new Date().toISOString(),
        }),
        { merge: true }
      );

      // mensagem whatsapp
      let msg = `🛒 *Novo Pedido*%0A`;
      msg += `👤 Cliente: ${nome}%0A`;
      msg += `📱 WhatsApp: ${phone}%0A`;

      if (entrega === "entrega") {
        msg += `🏠 Endereço: ${rua}, ${numero} - ${bairro}%0A`;
        if (referencia) msg += `📝 Ref: ${referencia}%0A`;
      } else {
        msg += `📍 Retirada na loja%0A`;
      }

      msg += `💳 Pagamento: ${pagamento.toUpperCase()}%0A`;
      msg += `🚚 Forma: ${entrega === "entrega" ? "Entrega" : "Retirada"}%0A`;

      if (observacao.trim()) {
        msg += `📝 Observações: ${observacao}%0A`;
      }

      if (desconto > 0) {
        msg += `🎟️ Cupom: ${cupom} - Desconto: R$ ${desconto.toFixed(2)}%0A`;
      }

      msg += `%0A*Itens:*%0A`;
      itensCarrinho.forEach((item) => {
        const qty = item?.qty ?? 0;
        const size = item?.size ? `(${item.size})` : "";
        const unitPrice = formatPreco(parsePreco(item?.price ?? 0));

        msg += `- ${qty}x ${item.name} ${size}%0A`;

        if (Array.isArray(item.flavors) && item.flavors.length > 0) {
          msg += `   Sabores: ${item.flavors.join(" + ")}%0A`;
        }
        if (item.crust) {
          msg += `   Borda: ${item.crust.nome}`;
          if (parsePreco(item.crust.preco) > 0)
            msg += ` (+${formatPreco(item.crust.preco)})`;
          msg += `%0A`;
        }
        if (Array.isArray(item.addons) && item.addons.length > 0) {
          msg += `   Adicionais: ${item.addons
            .map((a) => `${a.nome} (+${formatPreco(a.preco)})`)
            .join(", ")}%0A`;
        }
        msg += `   Preço unitário: ${unitPrice}%0A`;
      });

      msg += `%0A💰 Subtotal: ${formatPreco(subtotal)}%0A`;
      if (entrega === "entrega") {
        msg += `🚚 Taxa de entrega: ${formatPreco(taxaEntrega)}%0A`;
      }
      if (desconto > 0) {
        msg += `💸 Desconto aplicado: ${formatPreco(desconto)}%0A`;
      }
      msg += `✅ Total: ${formatPreco(totalComDesconto)}`;

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

        {/* Resumo dos itens */}
        <div className="mb-4 space-y-2">
          {itensCarrinho.map((item, idx) => (
            <div key={idx} className="border rounded p-2 text-sm">
              <strong>
                {item.qty}x {item.name}
              </strong>{" "}
              {item.size && `(${item.size})`}<br />
              {item.flavors?.length > 0 && <div>🍕 Sabores: {item.flavors.join(" + ")}</div>}
              {item.crust && (
                <div>
                  🌟 Borda: {item.crust.nome}{" "}
                  {parsePreco(item.crust.preco) > 0 ? `(${formatPreco(item.crust.preco)})` : "(Grátis)"}
                </div>
              )}
              {item.addons?.length > 0 && (
                <div>
                  ➕ Adicionais: {item.addons.map((a) => `${a.nome} (${formatPreco(a.preco)})`).join(", ")}
                </div>
              )}
              <div>💵 Preço unitário: {formatPreco(item.price)}</div>
            </div>
          ))}
        </div>

        {/* Cupom */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Cupom de desconto (opcional)</span>
          <input
            type="text"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={cupom}
            onChange={(e) => setCupom(e.target.value)}
          />
        </label>
        {desconto > 0 && (
          <div className="text-sm text-green-600 mb-3">
            ✅ Cupom aplicado! Desconto de R$ {desconto.toFixed(2)}
          </div>
        )}

        {/* Totais */}
        <div className="text-sm text-gray-600 mb-3">
          <div>Subtotal: {formatPreco(subtotal)}</div>
          <div>Taxa de entrega: {formatPreco(taxaEntrega)}</div>
          {desconto > 0 && <div>Desconto: {formatPreco(desconto)}</div>}
          <div className="font-semibold">Total: {formatPreco(totalComDesconto)}</div>
        </div>

        {/* Formulário */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu nome</span>
          <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2"
            value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu WhatsApp</span>
          <input type="tel" className="mt-1 w-full border rounded-lg px-3 py-2"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Observações do pedido</span>
          <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={3}
            value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Entrega ou retirada</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2"
            value={entrega} onChange={(e) => setEntrega(e.target.value)}>
            <option value="entrega">Entrega</option>
            <option value="retirada">Retirada</option>
          </select>
        </label>

        {entrega === "entrega" && (
          <div className="mb-4 space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600">Bairro</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2"
                value={bairro} onChange={(e) => setBairro(e.target.value)}>
                <option value="">Selecione...</option>
                {config.bairros?.map((b, idx) => (
                  <option key={idx} value={b.nome}>
                    {b.nome} - {formatPreco(b.taxa)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Rua</span>
              <input type="text" value={rua} onChange={(e) => setRua(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Número</span>
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Ponto de referência</span>
              <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Forma de pagamento</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2"
            value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartão">Cartão</option>
          </select>
        </label>

        <div className="flex gap-3">
          <button onClick={handleConfirmar} disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-2xl hover:opacity-90">
            {loading ? "Processando..." : "Confirmar Pedido"}
          </button>
          <button onClick={onClose}
            className="flex-1 border py-2 rounded-2xl hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
