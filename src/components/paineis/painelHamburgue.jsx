// src/pages/admin/PainelHamburguer.jsx (exemplo de caminho)
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import FormProduto from "../FormProduto";

// Helper para preço (igual ao do Pastel)
function parsePreco(preco) {
  if (typeof preco === "number") {
    return preco;
  }

  if (typeof preco === "string") {
    return parseFloat(preco.replace(",", "."));
  }

  return 0;
}

export default function PainelHamburguer() {
  const [docData, setDocData] = useState({
    produtos: [],
    adicionais: [], // adicionais do hambúrguer (bacon, cheddar, etc)
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    sizes: [],       // tamanhos (ex: simples, duplo, combo)
    prices: {},      // preços por tamanho
    available: true,
    categoria: "tradicional", // categoria padrão
    adicionais: [],  // adicionais por produto (se quiser usar)
  });

  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Hamburguer");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDocData(snap.data());
      }
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "hamburguer");
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
      categoria: "tradicional",
      adicionais: [],
    });
    setEditingIdx(null);
  }

  // Categorias de hambúrguer (você pode mudar os nomes se quiser)
  const categorias = ["tradicional", "especial", "combo"];
  const hamburgueresPorCategoria = categorias.map((cat) => ({
    nome: cat,
    itens: docData.produtos?.filter((p) => p.categoria === cat) || [],
  }));

  return (
    <div className="space-y-10">
      {/* Formulário de cadastro/edição (igual ao pastel) */}
      <FormProduto
        form={form}
        setForm={setForm}
        resetForm={resetForm}
        editingIdx={editingIdx}
        docData={docData}
        setDocData={setDocData}
        saveDocData={saveDocData}
      />

      {/* Lista agrupada por categoria */}
      <div className="bg-white rounded-xl shadow-md p-4 space-y-6">
        <h3 className="text-lg font-bold">🍔 Hambúrgueres Cadastrados</h3>

        {hamburgueresPorCategoria.map(({ nome, itens }) => (
          <div key={nome} className="space-y-3">
            <h4 className="font-semibold capitalize flex items-center gap-2">
              {nome === "tradicional" && "🍔 Tradicionais"}
              {nome === "especial" && "⭐ Especiais"}
              {nome === "combo" && "🥤 Combos"}
            </h4>

            {itens.length > 0 ? (
              itens.map((p) => {
                const realIdx = docData.produtos.indexOf(p);
                return (
                  <div
                    key={p.id || realIdx}
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

                      {/* Tamanhos */}
                      {p.sizes?.length > 0 && (
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          Tamanhos:{" "}
                          {p.sizes
                            .map(
                              (s) =>
                                `${s} (R$ ${
                                  p.prices[s]
                                    ? parsePreco(p.prices[s])
                                        .toFixed(2)
                                        .replace(".", ",")
                                    : "0,00"
                                })`
                            )
                            .join(", ")}
                        </p>
                      )}

                      {/* Adicionais por produto (se usar) */}
                      {p.adicionais?.length > 0 && (
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          Adicionais:{" "}
                          {p.adicionais
                            .map(
                              (a) =>
                                `${a.nome} (+R$ ${
                                  a.preco
                                    ? parsePreco(a.preco)
                                        .toFixed(2)
                                        .replace(".", ",")
                                    : "0,00"
                                })`
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setForm({ ...p, category: "Hamburguer" });
                          setEditingIdx(realIdx);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm("Tem certeza que deseja excluir este item?")
                          ) {
                            const next = {
                              ...docData,
                              produtos: docData.produtos.filter(
                                (_, i) => i !== realIdx
                              ),
                            };
                            saveDocData(next);
                            setDocData(next);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        🗑️ Excluir
                      </button>

                      <button
                        onClick={() => {
                          const updated = {
                            ...p,
                            available: !p.available,
                            category: "Hamburguer",
                          };
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
                      >
                        {p.available ? "✅ Disponível" : "❌ Indisponível"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                Nenhum hambúrguer nessa categoria.
              </p>
            )}
          </div>
        ))}
      </div>

      
      
    </div>
  );
}

// Componente para Adicionais (igual ao do Pastel, só mudei o nome)
function AdicionaisList({ items = [], onChange }) {
  const [novo, setNovo] = useState({ nome: "", preco: "" });

  function addItem() {
    if (!novo.nome || !novo.preco) return;

    const precoCorreto = parsePreco(novo.preco);

    onChange([
      ...items,
      { ...novo, preco: precoCorreto, id: Date.now() },
    ]);
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
                +R$ {parsePreco(item.preco).toFixed(2).replace(".", ",")}
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

      {/* Novo adicional */}
      <div className="flex gap-2">
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
