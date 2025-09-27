import { useState, useMemo, useEffect } from "react";

export default function PizzaBuilderModal({
  open,
  onClose,
  products,
  baseProduct,
  onAdd,
  preset, // { size?: string, firstFlavorId?: string }
}) {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState("");
  const [tipo, setTipo] = useState("inteira"); // inteira | meio
  const [sabores, setSabores] = useState([]);
  const [selectedBorda, setSelectedBorda] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);

  // ---------- listas ----------
  const pizzas = useMemo(
    () =>
      products.filter(
        (p) => p.category?.toLowerCase() === "pizza" && p.available !== false
      ),
    [products]
  );

  const extras = useMemo(() => {
    const arr = [
      ...(baseProduct?.adicionais || []),
      ...sabores.flatMap((s) => s.adicionais || []),
    ];
    const map = new Map();
    arr.forEach((a) => map.set(a.nome, a));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const bordas = useMemo(() => {
    let arr = baseProduct?.bordas || [];
    sabores.forEach((s) => (arr = [...arr, ...(s.bordas || [])]));
    const map = new Map();
    arr.forEach((b) => map.set(b.nome, b));
    return Array.from(map.values());
  }, [sabores, baseProduct]);

  const precoBase = useMemo(() => {
    if (!size || sabores.length === 0) return 0;
    if (tipo === "meio" && sabores.length > 1) {
      const prices = sabores.map((s) => Number(s.prices?.[size] || 0));
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    return Number(sabores[0]?.prices?.[size] || 0);
  }, [size, sabores, tipo]);

  const precoAddons = selectedAddons.reduce((acc, nome) => {
    const addon = extras.find((a) => a.nome === nome);
    return acc + Number(addon?.preco || 0);
  }, 0);

  const precoBorda = selectedBorda ? Number(selectedBorda.preco || 0) : 0;
  const total = (precoBase + precoAddons + precoBorda) * qty;

  // ---------- reset ao abrir ----------
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTipo("inteira");
    setSabores([]);
    setSelectedBorda(null);
    setSelectedAddons([]);
    setQty(1);

    const keys = Object.keys(baseProduct?.prices || {});
    const onlyOne = keys.length === 1 ? keys[0] : "";
    const presetSize =
      preset?.size && keys.includes(preset.size) ? preset.size : "";
    setSize(presetSize || onlyOne || "");
  }, [open, baseProduct, preset]);

  // aplica 1º sabor: preset.firstFlavorId OU fallback baseProduct.id
  useEffect(() => {
    if (!open) return;
    const initialFlavorId = preset?.firstFlavorId ?? baseProduct?.id ?? null;
    if (initialFlavorId) {
      const first = pizzas.find((p) => p.id === initialFlavorId) || baseProduct;
      if (first) setSabores([first]);
    }
  }, [open, pizzas, preset, baseProduct]);

  if (!open || !baseProduct) return null;

  const pinnedFirstId =
    tipo === "meio" ? (preset?.firstFlavorId ?? baseProduct?.id ?? null) : null;

  // ---------- seleção de sabores ----------
  const handleToggleSabor = (sabor) => {
    if (tipo === "inteira") {
      setSabores([sabor]);
      return;
    }

    // meio a meio
    const exists = sabores.find((s) => s.id === sabor.id);
    if (exists) {
      if (pinnedFirstId && sabor.id === pinnedFirstId) return;
      setSabores(sabores.filter((s) => s.id !== sabor.id));
      return;
    }

    if (sabores.length >= 2) {
      alert("Você só pode escolher 2 sabores no meio a meio.");
      return;
    }

    if (sabores.some((s) => s.id === sabor.id)) return;

    setSabores([...sabores, sabor]);
  };

  const handleNextFromStep1 = () => {
    setStep(2); // sempre vai para seleção de sabores
  };

  const handleConfirm = () => {
    if (!size) return alert("Escolha um tamanho!");
    if (tipo === "inteira" && sabores.length !== 1)
      return alert("Escolha 1 sabor!");
    if (tipo === "meio" && sabores.length < 2)
      return alert("Escolha os 2 sabores!");

    const item = {
      id: `pizza-${tipo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name:
        tipo === "inteira"
          ? sabores[0].name
          : sabores.map((s) => `1/2 ${s.name}`).join(" + "),
      flavors:
        tipo === "meio"
          ? sabores.map((s) => `1/2 ${s.name}`)
          : sabores.map((s) => s.name),
      size,
      qty,
      price: total,
      addons: extras.filter((a) => selectedAddons.includes(a.nome)),
      crust: selectedBorda
        ? { nome: selectedBorda.nome, preco: precoBorda }
        : null,
      image: sabores[0]?.image || baseProduct.image,
      category: "Pizza",
    };

    onAdd(item);
    onClose();
  };

  // ---------- UI ----------
  const StepBadge = ({ idx, label }) => (
    <div
      className={`flex items-center gap-2 ${
        step === idx ? "font-semibold" : "opacity-70"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
        ${step === idx ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
      >
        {idx}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl
                      max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">🍕 Montar Pizza</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          <StepBadge idx={1} label="Tamanho" />
          <StepBadge idx={2} label="Sabores" />
          <StepBadge idx={3} label="Borda" />
          <StepBadge idx={4} label="Adicionais" />
          <StepBadge idx={5} label="Resumo" />
        </div>

        {/* Step 1 - Tamanho + tipo */}
        {step === 1 && (
          <>
            <select
              className="w-full border p-2 rounded mb-3"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">Escolha o tamanho</option>
              {Object.entries(baseProduct.prices || {}).map(([s, val]) => (
                <option key={s} value={s}>
                  {s} — R$ {Number(val).toFixed(2)}
                </option>
              ))}
            </select>

            <div className="flex gap-3 mb-3">
              <label
                className={`flex-1 px-3 py-2 border rounded-lg text-center cursor-pointer ${
                  tipo === "inteira" ? "bg-yellow-500 text-white" : ""
                }`}
              >
                <input
                  type="radio"
                  className="hidden"
                  checked={tipo === "inteira"}
                  onChange={() => setTipo("inteira")}
                />
                Inteira
              </label>
              <label
                className={`flex-1 px-3 py-2 border rounded-lg text-center cursor-pointer ${
                  tipo === "meio" ? "bg-yellow-500 text-white" : ""
                }`}
              >
                <input
                  type="radio"
                  className="hidden"
                  checked={tipo === "meio"}
                  onChange={() => setTipo("meio")}
                />
                Meio a Meio
              </label>
            </div>

            <button
              onClick={handleNextFromStep1}
              disabled={!size}
              className="w-full bg-yellow-500 disabled:opacity-50 text-white py-2 rounded-lg mt-2"
            >
              Próximo
            </button>
          </>
        )}

        {/* Step 2 - Sabores */}
        {step === 2 && (
          <>
            <h3 className="font-semibold mb-2">
              {tipo === "inteira"
                ? "Escolha o sabor"
                : pinnedFirstId
                ? "Escolha o 2º sabor"
                : "Escolha os 2 sabores"}
            </h3>

            {sabores.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {sabores.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs"
                  >
                    {s.name}
                    {pinnedFirstId === s.id && " (fixo)"}
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-60 overflow-y-auto border rounded mb-3 divide-y">
              {pizzas.map((pz) => {
                const preco = pz.prices?.[size];
                if (!preco) return null;

                const selected = sabores.some((s) => s.id === pz.id);
                const isPinned = tipo === "meio" && pinnedFirstId === pz.id;

                return (
                  <label
                    key={pz.id}
                    className={`flex items-center justify-between gap-2 p-2 cursor-pointer
                                ${selected ? "bg-yellow-50" : ""} ${
                      isPinned ? "opacity-70" : ""
                    }`}
                    title={isPinned ? "1º sabor já escolhido" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type={tipo === "inteira" ? "radio" : "checkbox"}
                        checked={selected}
                        disabled={isPinned}
                        onChange={() => handleToggleSabor(pz)}
                      />
                      <span>{pz.name}</span>
                    </div>
                    <span className="text-sm">
                      R$ {Number(preco).toFixed(2)}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  (tipo === "inteira" && sabores.length < 1) ||
                  (tipo === "meio" && sabores.length < 2)
                }
                className="px-4 py-2 bg-yellow-500 disabled:opacity-50 text-white rounded-lg"
              >
                Próximo
              </button>
            </div>
          </>
        )}

        {/* Step 3 - Borda */}
        {step === 3 && (
          <>
            <h3 className="font-semibold mb-2">Borda recheada</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <label
                className={`px-3 py-1 border rounded-full cursor-pointer ${
                  !selectedBorda ? "bg-yellow-50" : ""
                }`}
              >
                <input
                  type="radio"
                  className="hidden"
                  checked={!selectedBorda}
                  onChange={() => setSelectedBorda(null)}
                />
                Sem borda
              </label>
              {bordas.map((b, idx) => (
                <label
                  key={idx}
                  className={`px-3 py-1 border rounded-full cursor-pointer ${
                    selectedBorda?.nome === b.nome
                      ? "bg-yellow-500 text-white"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={selectedBorda?.nome === b.nome}
                    onChange={() => setSelectedBorda(b)}
                  />
                  {b.nome} (
                  {Number(b.preco) > 0
                    ? `+R$ ${Number(b.preco).toFixed(2)}`
                    : "Grátis"}
                  )
                </label>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
              >
                Próximo
              </button>
            </div>
          </>
        )}

        {/* Step 4 - Adicionais */}
        {step === 4 && (
          <>
            <h3 className="font-semibold mb-2">Adicionais</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {extras.map((a, idx) => (
                <label
                  key={idx}
                  className={`px-3 py-1 border rounded-full cursor-pointer ${
                    selectedAddons.includes(a.nome)
                      ? "bg-yellow-500 text-white"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedAddons.includes(a.nome)}
                    onChange={() =>
                      setSelectedAddons((prev) =>
                        prev.includes(a.nome)
                          ? prev.filter((n) => n !== a.nome)
                          : [...prev, a.nome]
                      )
                    }
                  />
                  {a.nome} (+R$ {Number(a.preco).toFixed(2)})
                </label>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
              >
                Próximo
              </button>
            </div>
          </>
        )}

        {/* Step 5 - Resumo */}
        {step === 5 && (
          <>
            <h3 className="font-semibold mb-2">Resumo</h3>
            <p className="text-sm mb-1">Tamanho: {size}</p>
            <p className="text-sm mb-1">
              Sabores:{" "}
              {tipo === "meio"
                ? sabores.map((s) => `1/2 ${s.name}`).join(" + ")
                : sabores.map((s) => s.name).join(" + ")}
            </p>
            {selectedBorda && (
              <p className="text-sm mb-1">
                Borda: {selectedBorda.nome} (
                {Number(selectedBorda.preco) > 0
                  ? `+R$ ${Number(selectedBorda.preco).toFixed(2)}`
                  : "Grátis"}
                )
              </p>
            )}
            {selectedAddons.length > 0 && (
              <p className="text-sm mb-1">
                Adicionais: {selectedAddons.join(", ")}
              </p>
            )}
            <p className="font-bold text-lg mb-4">
              Total: R$ {total.toFixed(2)}
            </p>

            <div className="flex items-center justify-between mb-4">
              <button
                className="w-8 h-8 border rounded-full"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span>{qty}</span>
              <button
                className="w-8 h-8 border rounded-full"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 border rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
