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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Configurar Cardapio</h1>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveCat(cat.id)}
            className={`flex flex-col items-center justify-center w-32 h-32 rounded-xl shadow-md transition ${
              activeCat === cat.id ? `${cat.color} text-white` : "bg-gray-200"
            }`}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="mt-2 font-semibold">{cat.nome}</span>
          </motion.button>
        ))}
      </div>

      {fields.produtos && (
        <>
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
          <ListaProdutos
            docData={docData}
            setDocData={setDocData}
            saveDocData={saveDocData}
            handleEditProduct={(p, idx) => {
              setForm(p);
              setEditingIdx(idx);
            }}
            handleDeleteProduct={handleDeleteProduct}
            toggleAvailability={toggleAvailability}
          />
        </>
      )}

      {fields.adicionais && (
        <BlocoAdicionais docData={docData} setDocData={setDocData} saveDocData={saveDocData} />
      )}
      {fields.bordas && (
        <BlocoBordas docData={docData} setDocData={setDocData} saveDocData={saveDocData} />
      )}
      {fields.bases && (
        <BlocoBases docData={docData} setDocData={setDocData} saveDocData={saveDocData} />
      )}
      {fields.combos && (
        <BlocoCombos docData={docData} setDocData={setDocData} saveDocData={saveDocData} />
      )}
    </div>
  );
}
