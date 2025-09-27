import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço
function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelCalzone() {
  const [docData, setDocData] = useState({
    produtos: [],
    bases: [],
    bordas: [],
    adicionais: [],
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    available: true,
    categoria: "calzone",
  });

  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Calzone");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Calzone");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      image: "",
      sizes: [],
      prices: {},
      available: true,
      categoria: "calzone",
    });
    setEditingIdx(null);
  }

  return (
    <div className="space-y-10">
      {/* Formulário de cadastro/edição */}
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Lista de Calzones */}
      <div className="bg-white rounded-xl shadow-md p-4 space-y-6">
        <h3 className="text-lg font-bold">🥟 Calzones Cadastrados</h3>

        {docData.produtos?.length > 0 ? (
          docData.produtos.map((p, idx) => (
            <div
              key={p.id || idx}
              className="flex flex-col sm:flex-row gap-4 items-start border rounded-lg p-4 bg-white shadow-sm"
            >
              {/* Imagem */}
              <img
                src={p.image || "https://via.placeholder.com/100"}
                alt={p.name}
                className="w-24 h-24 rounded-md object-cover border"
              />

              {/* Infos */}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{p.name}</h4>
                <p className="text-sm text-gray-600">{p.description}</p>

                {p.sizes?.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Tamanhos:{" "}
                    {p.sizes
                      .map(
                        (s) =>
                          `${s} (R$ ${
                            p.prices[s]
                              ? parsePreco(p.prices[s]).toFixed(2).replace(".", ",")
                              : "0,00"
                          })`
                      )
                      .join(", ")}
                  </p>
                )}

                {p.adicionais?.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Adicionais:{" "}
                    {p.adicionais
                      .map(
                        (a) =>
                          `${a.nome} (+R$ ${a.preco ? parsePreco(a.preco).toFixed(2).replace(".", ",") : "0,00"})`
                      )
                      .join(", ")}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setForm({ ...p, categoria: "calzone" });
                    setEditingIdx(idx);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  ✏️ Editar
                </button>

                <button
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este item?")) {
                      const next = {
                        ...docData,
                        produtos: docData.produtos.filter((_, i) => i !== idx),
                      };
                      saveDocData(next);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  🗑️ Excluir
                </button>

                <button
                  onClick={() => {
                    const updated = { ...p, available: !p.available };
                    const next = { ...docData };
                    next.produtos[idx] = updated;
                    saveDocData(next);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    p.available
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-400 hover:bg-gray-500 text-white"
                  }`}
                >
                  {p.available ? "✅ Disponível" : "❌ Indisponível"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Nenhum calzone cadastrado.</p>
        )}
      </div>

      {/* Bases */}
      <section>
        <h2 className="text-lg font-bold mb-3">🍞 Bases</h2>
        <ItemList
          items={docData.bases}
          onChange={(items) => {
            const next = { ...docData, bases: items };
            saveDocData(next);
          }}
        />
      </section>

      {/* Bordas */}
      <section>
        <h2 className="text-lg font-bold mb-3">🥖 Bordas</h2>
        <ItemList
          items={docData.bordas}
          onChange={(items) => {
            const next = { ...docData, bordas: items };
            saveDocData(next);
          }}
        />
      </section>

      {/* Adicionais */}
      <section>
        <h2 className="text-lg font-bold mb-3">🧀 Adicionais</h2>
        <ItemList
          items={docData.adicionais}
          onChange={(items) => {
            const next = { ...docData, adicionais: items };
            saveDocData(next);
          }}
        />
      </section>
    </div>
  );
}

/* ======================================================
   Componente genérico para Bases, Bordas e Adicionais
   ====================================================== */
function ItemList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome) return;
    const precoCorreto = parsePreco(novo.preco);
    onChange([...items, { ...novo, preco: precoCorreto, id: Date.now() }]);
    setNovo({ nome: "", preco: "" });
  }

  function removeItem(id) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border p-2 rounded"
        >
          <span>
            {item.nome}{" "}
            {item.preco && (
              <span className="text-green-600">
                +R$ {Number(item.preco).toFixed(2)}
              </span>
            )}
          </span>
          <button
            onClick={() => removeItem(item.id)}
            className="text-red-600 hover:underline"
          >
            Remover
          </button>
        </div>
      ))}

      {/* Novo item */}
      <div className="flex gap-2 mt-2">
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          className="border px-2 py-1 rounded flex-1"
        />
        <input
          placeholder="Preço"
          value={novo.preco}
          onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
          className="border px-2 py-1 rounded w-28"
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-3 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}
