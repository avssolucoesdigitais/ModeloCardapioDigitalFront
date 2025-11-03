import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

export default function PainelPizza() {
  const [docData, setDocData] = useState({ produtos: [], bordas: [], adicionais: [] });
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "",
  });
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Pizza");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Pizza");
    await setDoc(ref, next, { merge: false });
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      image: "",
      sizes: [],
      prices: {},
      available: true,
      categoria: "",
      category: "Pizza",
    });
    setEditingIdx(null);
  }

  const categorias = ["tradicional", "especial", "doce"];
  const pizzasPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Formulário */}
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Lista de produtos */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          🍕 Pizzas Cadastradas
        </h3>

        {pizzasPorCategoria.map(({ nome, itens }) => (
          <div key={nome} className="space-y-3">
            <h4 className="font-semibold capitalize text-gray-700 flex items-center gap-2 border-b pb-1">
              {nome === "tradicional" && "🍕 Tradicionais"}
              {nome === "especial" && "⭐ Especiais"}
              {nome === "doce" && "🍫 Doces"}
            </h4>

            {itens.length > 0 ? (
              itens.map((p) => {
                const realIdx = docData.produtos.indexOf(p);
                return (
                  <div
                    key={p.id || realIdx}
                    className="flex flex-col sm:flex-row gap-4 items-start border rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <img
                      src={p.image || "https://via.placeholder.com/100"}
                      alt={p.name}
                      className="w-24 h-24 rounded-lg object-cover border"
                    />

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-sm text-gray-600">{p.description}</p>

                      {p.sizes?.length > 0 && (
                        <p className="mt-2 text-sm text-gray-700">
                          <strong>Tamanhos:</strong>{" "}
                          {p.sizes
                            .map(
                              (s) =>
                                `${s} (R$ ${
                                  p.prices[s]
                                    ? Number(
                                        String(p.prices[s])
                                          .replace(",", ".")
                                          .replace(/[^\d.]/g, "")
                                      )
                                        .toFixed(2)
                                        .replace(".", ",")
                                    : "0,00"
                                })`
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setForm({ ...p, category: "Pizza" });
                          setEditingIdx(realIdx);
                        }}
                        className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
                        aria-label={`Editar ${p.name}`}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este item?")) {
                            const next = {
                              ...docData,
                              produtos: docData.produtos.filter((_, i) => i !== realIdx),
                            };
                            saveDocData(next);
                            setDocData(next);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                        aria-label={`Excluir ${p.name}`}
                      >
                        🗑️ Excluir
                      </button>

                      <button
                        onClick={() => {
                          const updated = { ...p, available: !p.available, category: "Pizza" };
                          const next = { ...docData };
                          next.produtos[realIdx] = updated;
                          saveDocData(next);
                          setDocData(next);
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          p.available
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }`}
                        aria-label={`Alterar disponibilidade de ${p.name}`}
                      >
                        {p.available ? "✅ Disponível" : "❌ Indisponível"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum item nessa categoria.</p>
            )}
          </div>
        ))}
      </section>

      {/* Bordas */}
      <SimpleItemSection
        title="🥖 Bordas"
        items={docData.bordas}
        onChange={(items) => {
          const next = { ...docData, bordas: items };
          setDocData(next);
          saveDocData(next);
        }}
      />

      {/* Adicionais */}
      <SimpleItemSection
        title="🧀 Adicionais"
        items={docData.adicionais}
        onChange={(items) => {
          const next = { ...docData, adicionais: items };
          setDocData(next);
          saveDocData(next);
        }}
      />
    </div>
  );
}

/* --------------------------- Componentes auxiliares --------------------------- */
function SimpleItemSection({ title, items, onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome.trim()) return;
    const precoNormalizado =
      parseFloat(String(novo.preco).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

    onChange([...items, { nome: novo.nome, preco: precoNormalizado, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50"
          >
            <span className="text-gray-800">
              {item.nome}{" "}
              {item.preco !== undefined && (
                <span className="text-blue-600 ml-1 font-medium">
                  +R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                </span>
              )}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-600 font-medium hover:text-red-800 transition"
            >
              Remover
            </button>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            placeholder="Nome"
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
          />
          <input
            placeholder="Preço"
            value={novo.preco}
            onChange={(e) => {
              // Permite apenas números, vírgulas e pontos
              const val = e.target.value.replace(/[^\d.,]/g, "");
              setNovo({ ...novo, preco: val });
            }}
            className="border rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
          />
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition"
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}
