import { useState, useMemo, useEffect } from "react";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import useLojaConfig from "../hooks/useLojaConfig";
import useCep from "../hooks/useCep";
import { Loader2, MapPin } from "lucide-react";

function parsePreco(valor) {
  if (!valor) return 0;
  const normalized = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

function formatPreco(valor) {
  return parsePreco(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sanitize(obj) {
  if (Array.isArray(obj)) return obj.map(sanitize);
  else if (obj && typeof obj === "object") {
    const clean = {};
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined) clean[k] = sanitize(v); });
    return clean;
  }
  return obj;
}

// ── Formata customizações de um item para texto legível ──
function formatarCustomizacoes(customizacoes) {
  if (!customizacoes || typeof customizacoes !== "object") return "";
  const linhas = [];
  Object.entries(customizacoes).forEach(([key, valor]) => {
    if (valor === false || valor === "" || valor === null || valor === undefined) return;
    const label = key.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim();
    if (valor === true) {
      linhas.push(`   ✓ ${label}`);
    } else if (Array.isArray(valor) && valor.length > 0) {
      linhas.push(`   • ${label}: ${valor.join(", ")}`);
    } else if (typeof valor === "string" && valor.trim()) {
      linhas.push(`   • ${label}: ${valor}`);
    }
  });
  return linhas.join("\n");
}

export default function CheckoutModal({ open, onClose, cart, whatsapp, lojaId }) {
  const { config, loading: loadingConfig } = useLojaConfig(lojaId);
  const { cep, setCep, loadingCep, cepErro, buscarCep } = useCep();

  const [nome, setNome]             = useState("");
  const [phone, setPhone]           = useState("");
  const [entrega, setEntrega]       = useState("entrega");
  const [rua, setRua]               = useState("");
  const [numero, setNumero]         = useState("");
  const [referencia, setReferencia] = useState("");
  const [bairro, setBairro]         = useState("");
  const [pagamento, setPagamento]   = useState("pix");
  const [troco, setTroco]           = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading]       = useState(false);
  const [cupom, setCupom]           = useState("");
  const [desconto, setDesconto]     = useState(0);

  const itensCarrinho = cart.items || [];

  const subtotal = useMemo(() =>
    itensCarrinho.reduce((acc, item) => acc + (item.qty || 0) * parsePreco(item.price), 0),
  [itensCarrinho]);

  const taxaEntrega = useMemo(() => {
    if (entrega !== "entrega") return 0;
    const b = config?.bairros?.find((b) => b.nome === bairro);
    return b ? parsePreco(b.taxa) : 0;
  }, [bairro, entrega, config]);

  const total = subtotal + taxaEntrega;

  const totalComDesconto = useMemo(() => {
    const valor = total - desconto;
    return valor < 0 ? 0 : valor;
  }, [total, desconto]);

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    if (!savedPhone) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", savedPhone));
        if (snap.exists()) {
          const data = snap.data();
          setNome(data.nome || "");
          setPhone(data.telefone || savedPhone);
          setBairro(data.bairro || "");
          setRua(data.rua || "");
          setNumero(data.numero || "");
          setReferencia(data.referencia || "");
          setPagamento(data.pagamentoPreferido || "pix");
          setCep(data.cep || "");
        }
      } catch (err) {
        console.error("Erro ao carregar cadastro no checkout:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!cupom.trim() || !config?.cupons) { setDesconto(0); return; }
    const codigo = cupom.trim().toLowerCase();
    const c = config.cupons.find((cup) => cup.codigo.toLowerCase() === codigo);
    if (!c) { setDesconto(0); return; }
    const valorDesconto = parsePreco(c.valor);
    if (valorDesconto > total) {
      alert("O valor do cupom não pode ser maior que o total do pedido.");
      setDesconto(0); return;
    }
    setDesconto(valorDesconto);
  }, [cupom, config, total]);

  const handleCepChange = (e) => {
    buscarCep(e.target.value, {
      onSuccess: ({ rua: ruaFound, bairroNome }) => {
        setRua(ruaFound);
        const match = config?.bairros?.find(b =>
          b.nome.toLowerCase().includes(bairroNome.toLowerCase()) ||
          bairroNome.toLowerCase().includes(b.nome.toLowerCase())
        );
        if (match) setBairro(match.nome);
      },
    });
  };

  if (!open) return null;
  if (loadingConfig || !config) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">Carregando…</div>
    </div>
  );

  const handleConfirmar = async () => {
    if (!nome.trim()) return alert("Digite seu nome.");
    if (!phone.trim()) return alert("Digite seu WhatsApp.");
    if (entrega === "entrega" && (!bairro || !rua.trim() || !numero.trim()))
      return alert("Preencha corretamente seu endereço.");
    if (itensCarrinho.length === 0) return alert("Seu carrinho está vazio.");

    setLoading(true);
    try {
      const enderecoFinal = entrega === "entrega"
        ? `${rua}, ${numero} - ${bairro} (Ref: ${referencia || "—"})`
        : "RETIRADA NA LOJA";
      const orderNumber = Date.now().toString().slice(-6);

      await setDoc(doc(db, "users", phone), {
        telefone: phone, nome, bairro, rua, numero,
        referencia, pagamentoPreferido: pagamento,
        cep, updatedAt: new Date(),
      }, { merge: true });
      localStorage.setItem("userPhone", phone);

      const orderData = sanitize({
        orderNumber, lojaId, customer: nome, phone,
        address: enderecoFinal, bairro, reference: referencia,
        paymentMethod: pagamento, deliveryType: entrega,
        items: itensCarrinho, subtotal, taxaEntrega, desconto,
        total: totalComDesconto, observacao,
        status: "PENDENTE", createdAt: new Date().toISOString(),
      });

      const orderDoc = await addDoc(collection(db, "lojas", lojaId, "orders"), orderData);

      await setDoc(doc(db, "users", phone, "pedidos", orderDoc.id), sanitize({
        orderNumber, lojaId, items: itensCarrinho,
        total: totalComDesconto, desconto,
        status: "PENDENTE", createdAt: new Date().toISOString(),
      }), { merge: true });

      // ── Monta mensagem WhatsApp ──
      let msg = `🛒 *Novo Pedido*\n`;
      msg += `👤 Cliente: ${nome}\n📱 WhatsApp: ${phone}\n`;
      if (entrega === "entrega") {
        msg += `🏠 Endereço: ${rua}, ${numero} - ${bairro}\n`;
        if (cep) msg += `📮 CEP: ${cep}\n`;
        if (referencia) msg += `📝 Ref: ${referencia}\n`;
      } else {
        msg += `📍 Retirada na loja\n`;
      }
      msg += `💳 Pagamento: ${pagamento.toUpperCase()}\n`;
      if (pagamento === "dinheiro" && troco) msg += `💵 Troco para: R$ ${troco}\n`;
      msg += `🚚 Forma: ${entrega === "entrega" ? "Entrega" : "Retirada"}\n`;
      if (observacao.trim()) msg += `📝 Observações: ${observacao}\n`;
      if (desconto > 0) msg += `🎟️ Cupom: ${cupom} - Desconto: R$ ${desconto.toFixed(2)}\n`;

      msg += `\n*Itens:*\n`;
      itensCarrinho.forEach((item) => {
        const qty = item?.qty ?? 0;
        const size = item?.size ? ` (${item.size})` : "";
        msg += `• ${qty}x ${item.name}${size}\n`;

        // Sabores / borda / adicionais (pizza/pastel)
        if (Array.isArray(item.flavors) && item.flavors.length > 0)
          msg += `   Sabores: ${item.flavors.join(" + ")}\n`;
        if (item.crust) {
          msg += `   Borda: ${item.crust.nome}`;
          if (parsePreco(item.crust.preco) > 0) msg += ` (+${formatPreco(item.crust.preco)})`;
          msg += `\n`;
        }
        if (Array.isArray(item.addons) && item.addons.length > 0)
          msg += `   Adicionais: ${item.addons.map((a) => `${a.nome} (+${formatPreco(a.preco)})`).join(", ")}\n`;

        // ── NOVO: customizações (açaí, marmita, etc.) ──
        if (item.customizacoes) {
          const custom = formatarCustomizacoes(item.customizacoes);
          if (custom) msg += `${custom}\n`;
        }

        msg += `   Preço unitário: ${formatPreco(parsePreco(item?.price ?? 0))}\n`;
      });

      msg += `\n💰 Subtotal: ${formatPreco(subtotal)}\n`;
      if (entrega === "entrega") msg += `🚚 Taxa de entrega: ${formatPreco(taxaEntrega)}\n`;
      if (desconto > 0) msg += `💸 Desconto aplicado: ${formatPreco(desconto)}\n`;
      msg += `✅ Total: ${formatPreco(totalComDesconto)}`;

      let adminPhone = "558999999999";
      if (typeof whatsapp === "string" && whatsapp.trim()) {
        const digits = whatsapp.replace(/\D/g, "");
        adminPhone = digits.startsWith("55") ? digits : `55${digits}`;
      }

      window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      if (cart.clear) cart.clear(); else if (cart.setItems) cart.setItems([]);
      onClose();
      alert("Pedido enviado com sucesso!");
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

        {/* Itens */}
        <div className="mb-4 space-y-2">
          {itensCarrinho.map((item, idx) => (
            <div key={idx} className="border rounded p-2 text-sm">
              <strong>{item.qty}x {item.name}</strong> {item.size && `(${item.size})`}<br />
              {item.flavors?.length > 0 && <div>🍕 Sabores: {item.flavors.join(" + ")}</div>}
              {item.crust && <div>🌟 Borda: {item.crust.nome} {parsePreco(item.crust.preco) > 0 ? `(${formatPreco(item.crust.preco)})` : "(Grátis)"}</div>}
              {item.addons?.length > 0 && <div>➕ Adicionais: {item.addons.map((a) => `${a.nome} (${formatPreco(a.preco)})`).join(", ")}</div>}

              {/* ── NOVO: exibe customizações no modal ── */}
              {item.customizacoes && Object.entries(item.customizacoes).map(([key, valor]) => {
                if (valor === false || valor === "" || valor === null || valor === undefined) return null;
                const label = key.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim();
                if (valor === true) return <div key={key}>✓ {label}</div>;
                if (Array.isArray(valor) && valor.length > 0)
                  return <div key={key}>• {label}: <strong>{valor.join(", ")}</strong></div>;
                if (typeof valor === "string" && valor.trim())
                  return <div key={key}>• {label}: <strong>{valor}</strong></div>;
                return null;
              })}

              <div>💵 Preço unitário: {formatPreco(item.price)}</div>
            </div>
          ))}
        </div>

        {/* Cupom */}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Cupom de desconto (opcional)</span>
          <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2" value={cupom} onChange={(e) => setCupom(e.target.value)} />
        </label>
        {desconto > 0 && <div className="text-sm text-green-600 mb-3">✅ Cupom aplicado! Desconto de R$ {desconto.toFixed(2)}</div>}

        {/* Totais */}
        <div className="text-sm text-gray-600 mb-3">
          <div>Subtotal: {formatPreco(subtotal)}</div>
          <div>Taxa de entrega: {formatPreco(taxaEntrega)}</div>
          {desconto > 0 && <div>Desconto: {formatPreco(desconto)}</div>}
          <div className="font-semibold">Total: {formatPreco(totalComDesconto)}</div>
        </div>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu nome</span>
          <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Seu WhatsApp</span>
          <input type="tel" className="mt-1 w-full border rounded-lg px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Observações do pedido</span>
          <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Entrega ou retirada</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2" value={entrega} onChange={(e) => setEntrega(e.target.value)}>
            <option value="entrega">Entrega</option>
            <option value="retirada">Retirada</option>
          </select>
        </label>

        {entrega === "entrega" && (
          <div className="mb-4 space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600">CEP</span>
              <div className="relative mt-1">
                <input type="text" placeholder="00000-000" maxLength={9}
                  value={cep} onChange={handleCepChange}
                  className="w-full border rounded-lg px-3 py-2 pr-9" />
                {loadingCep && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                {!loadingCep && cep.replace(/\D/g,"").length === 8 && !cepErro && (
                  <MapPin size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {cepErro && <p className="text-xs text-red-500 mt-1">{cepErro}</p>}
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Bairro</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2" value={bairro} onChange={(e) => setBairro(e.target.value)}>
                <option value="">Selecione...</option>
                {config?.bairros?.map((b, idx) => (
                  <option key={idx} value={b.nome}>{b.nome} - {formatPreco(b.taxa)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Rua</span>
              <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Número</span>
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Ponto de referência</span>
              <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Forma de pagamento</span>
          <select className="mt-1 w-full border rounded-lg px-3 py-2" value={pagamento} onChange={(e) => { setPagamento(e.target.value); setTroco(""); }}>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartão">Cartão</option>
          </select>
        </label>

        {pagamento === "dinheiro" && (
          <label className="block mb-3">
            <span className="text-sm text-gray-600">Troco para quanto? <span className="text-gray-400">(opcional)</span></span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
              <input
                type="number" min="0" step="0.01" placeholder="0,00"
                value={troco} onChange={(e) => setTroco(e.target.value)}
                className="w-full border rounded-lg pl-9 pr-3 py-2"
              />
            </div>
            {troco && parseFloat(troco) < totalComDesconto && (
              <p className="text-xs text-red-500 mt-1">⚠️ Valor menor que o total do pedido.</p>
            )}
          </label>
        )}

        <div className="flex gap-3">
          <button onClick={handleConfirmar} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-2xl hover:opacity-90">
            {loading ? "Processando..." : "Confirmar Pedido"}
          </button>
          <button onClick={onClose} className="flex-1 border py-2 rounded-2xl hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
}