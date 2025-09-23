import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

import FormProduto from "../components/FormProduto";
import ListaProdutos from "../components/ListaProdutos";
import BlocoAdicionais from "../components/BlocoAdicionais";
import BlocoBordas from "../components/BlocoBordas";
import BlocoBases from "../components/BlocoBases";
import BlocoCombos from "../components/BlocoCombos";

import { CATEGORIES, CATEGORY_FIELDS, initialDocFor } from "../utils/.categoriasConfig";

export default function OpcoesCategoriaAdmin({ lojaId = "daypizza" }) {
  const [activeCat, setActiveCat] = useState("Pizza");
  const [docData, setDocData] = useState(initialDocFor("Pizza"));
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    image: "",
    prices: {},
    sizes: [],
    available: true,
  });
  const [editingIdx, setEditingIdx] = useState(null);

  // carrega dados da categoria ativa
  useEffect(() => {
    (async () => {
      const ref = doc(db, "lojas", lojaId, "opcoes", activeCat);
      const snap = await getDoc(ref);
      const payload = snap.exists() ? snap.data() : initialDocFor(activeCat);
      setDocData(payload);
    })();
  }, [activeCat, lojaId]);

  const fields = useMemo(() => CATEGORY_FIELDS[activeCat] || {}, [activeCat]);

  async function saveDocData(next) {
    const ref = doc(db, "lojas", lojaId, "opcoes", activeCat);
    await setDoc(ref, { categoria: activeCat, ...next }, { merge: true });
  }

  function resetForm() {
    setForm({
      id: "",
      name: "",
      description: "",
      image: "",
      prices: {},
      sizes: [],
      available: true,
    });
    setEditingIdx(null);
  }

  async function handleDeleteProduct(idx) {
    if (!confirm("Excluir item?")) return;
    try {
      const next = { ...docData };
      next.produtos = (next.produtos || []).filter((_, i) => i !== idx);
      next.produtos = next.produtos.map((p, i) => ({ ...p, ordem: i + 1 }));
      await saveDocData(next);
      setDocData(next);
      if (editingIdx === idx) resetForm();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert("❌ Erro ao excluir produto, veja o console.");
    }
  }

  async function toggleAvailability(idx) {
    try {
      const next = { ...docData };
      const p = next.produtos[idx];
      next.produtos[idx] = { ...p, available: !(p.available !== false) };
      await saveDocData(next);
      setDocData(next);
    } catch (err) {
      console.error("Erro ao alterar disponibilidade:", err);
      alert("❌ Erro ao alterar disponibilidade.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Cabeçalho */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          ⚙️ Configurar Cardápio
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Gerencie produtos, adicionais e opções por categoria.
        </p>
      </header>

      {/* Categorias */}
      <section aria-labelledby="categorias-title" className="space-y-3">
        <h2 id="categorias-title" className="text-base font-semibold text-gray-700">
          Categorias
        </h2>

        {/* Grid responsivo em vez de carrossel horizontal fixo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCat(cat.id)}
                className={[
                  "group relative flex flex-col items-center justify-center rounded-xl",
                  "p-3 sm:p-4 shadow-sm ring-1 ring-inset",
                  "transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  isActive
                    ? `${cat.color} text-white ring-transparent`
                    : "bg-gray-50 ring-gray-200 hover:bg-gray-100",
                ].join(" ")}
                aria-pressed={isActive}
                aria-label={`Selecionar categoria ${cat.nome}`}
              >
                <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                <span className="mt-2 text-sm sm:text-base font-semibold">
                  {cat.nome}
                </span>
                {isActive && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Produtos */}
      {fields.produtos && (
        <section aria-labelledby="produtos-title" className="space-y-4">
          <h2 id="produtos-title" className="text-base font-semibold text-gray-700">
            Produtos
          </h2>

          {/* Card do Formulário */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <FormProduto
              form={form}
              setForm={setForm}
              resetForm={resetForm}
              editingIdx={editingIdx}
              setEditingIdx={setEditingIdx}
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
            />
          </div>

          {/* Card da Lista */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <ListaProdutos
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
              handleEditProduct={(p, idx) => {
                setForm(p);
                setEditingIdx(idx);
                // scroll suave para o formulário quando editar
                if (typeof window !== "undefined") {
                  const el = document.querySelector("#produtos-title");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              handleDeleteProduct={handleDeleteProduct}
              toggleAvailability={toggleAvailability}
            />
          </div>
        </section>
      )}

      {/* Adicionais */}
      {fields.adicionais && (
        <section aria-labelledby="adicionais-title" className="space-y-3">
          <h2 id="adicionais-title" className="text-base font-semibold text-gray-700">
            Adicionais
          </h2>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BlocoAdicionais
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
            />
          </div>
        </section>
      )}

      {/* Bordas */}
      {fields.bordas && (
        <section aria-labelledby="bordas-title" className="space-y-3">
          <h2 id="bordas-title" className="text-base font-semibold text-gray-700">
            Bordas
          </h2>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BlocoBordas
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
            />
          </div>
        </section>
      )}

      {/* Bases */}
      {fields.bases && (
        <section aria-labelledby="bases-title" className="space-y-3">
          <h2 id="bases-title" className="text-base font-semibold text-gray-700">
            Bases
          </h2>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BlocoBases
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
            />
          </div>
        </section>
      )}

      {/* Combos */}
      {fields.combos && (
        <section aria-labelledby="combos-title" className="space-y-3">
          <h2 id="combos-title" className="text-base font-semibold text-gray-700">
            Combos
          </h2>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BlocoCombos
              docData={docData}
              setDocData={setDocData}
              saveDocData={saveDocData}
            />
          </div>
        </section>
      )}
    </div>
  );
}
