import { useState } from "react";
import uploadToCloudinary from "../utils/uploadToCloudinary";

export default function FormProduto({
  form,
  setForm,
  resetForm,
  editingIdx,
  docData,
  setDocData,
  saveDocData,
}) {
  const [newSize, setNewSize] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [file, setFile] = useState(null);

  async function handleSaveProduct() {
    if (!form.name) {
      alert("Nome obrigatório");
      return;
    }
    setLoadingSave(true);

    try {
      let imageUrl = form.image;
      if (file) {
        imageUrl = await uploadToCloudinary(file);
      }

      // 🔹 Normaliza os preços (troca vírgula por ponto e converte em número)
      const normalizedPrices = Object.fromEntries(
        Object.entries(form.prices || {}).map(([k, v]) => [
          k,
          parseFloat((v + "").replace(",", ".")) || 0,
        ])
      );

      const produto = {
        ...form,
        image: imageUrl,
        prices: normalizedPrices,
      };

      const next = { ...docData };
      if (editingIdx !== null) {
        next.produtos[editingIdx] = produto;
      } else {
        next.produtos = [...(next.produtos || []), produto];
      }

      await saveDocData(next);
      setDocData(next);
      resetForm();
      setFile(null);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("❌ Erro ao salvar produto, veja o console.");
    } finally {
      setLoadingSave(false);
    }
  }

  function handleAddSize() {
    if (!newSize) return;
    if (form.sizes.includes(newSize)) return;
    setForm({
      ...form,
      sizes: [...form.sizes, newSize],
      prices: { ...form.prices, [newSize]: "" },
    });
    setNewSize("");
  }

  function handleRemoveSize(size) {
    const { [size]: _, ...rest } = form.prices;
    setForm({
      ...form,
      sizes: form.sizes.filter((s) => s !== size),
      prices: rest,
    });
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="font-bold text-lg">➕ Adicionar / Editar Item</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do produto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="flex-1 border rounded px-2 py-1"
        />
        <select
          value={form.available ? "true" : "false"}
          onChange={(e) =>
            setForm({ ...form, available: e.target.value === "true" })
          }
          className="border rounded px-2 py-1"
        >
          <option value="true">Disponível</option>
          <option value="false">Indisponível</option>
        </select>
      </div>

      <textarea
        placeholder="Descrição"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border rounded px-2 py-1"
        rows={3}
      />

      {/* 🔹 Gerenciar tamanhos */}
      <div>
        <label className="font-semibold">Tamanhos (opcional)</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Ex: 250ml, Médio, Grande..."
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            type="button"
            onClick={handleAddSize}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            + Adicionar
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {form.sizes.map((size) => (
            <div key={size} className="flex items-center gap-2">
              <span className="w-16 font-medium">{size}</span>
              <input
                type="text"
                className="border rounded px-2 py-1 w-24"
                value={
                  form.prices[size] !== undefined && form.prices[size] !== null
                    ? String(form.prices[size]).replace(".", ",")
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.,]/g, "");
                  setForm({
                    ...form,
                    prices: { ...form.prices, [size]: val },
                  });
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveSize(size)}
                className="text-red-500 font-bold"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Imagem */}
      <div>
        <label className="font-semibold">Imagem do Item:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button
        type="button"
        onClick={handleSaveProduct}
        disabled={loadingSave}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        {loadingSave ? "Salvando..." : "Adicionar Item"}
      </button>
    </div>
  );
}
