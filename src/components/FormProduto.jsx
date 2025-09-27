import { useState, useRef, useEffect } from "react";
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

  // 🔹 Referências para inputs → Enter pula para o próximo
  const formRefs = useRef([]);

  useEffect(() => {
    formRefs.current = formRefs.current.slice(0, 10); // limita refs
  }, []);

  function handleKeyDown(e, idx) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = formRefs.current[idx + 1];
      if (next) next.focus();
    }
  }

  async function handleSaveProduct() {
    if (!form.name) {
      alert("Nome obrigatório");
      return;
    }
    if (!form.categoria) {
      alert("Categoria obrigatória");
      return;
    }

    setLoadingSave(true);

    try {
      let imageUrl = form.image;
      if (file) {
        imageUrl = await uploadToCloudinary(file);
      }

      // 🔹 Normaliza preços (aceita vírgula ou ponto)
      const normalizedPrices = Object.fromEntries(
        Object.entries(form.prices || {}).map(([k, v]) => [
          k,
          parseFloat((v + "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0,
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
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
        ➕ {editingIdx !== null ? "Editar Item" : "Adicionar Novo Item"}
      </h2>

      {/* Nome + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Nome do produto"
          value={form.name}
          ref={(el) => (formRefs.current[0] = el)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="sm:col-span-2 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={form.available ? "true" : "false"}
          ref={(el) => (formRefs.current[1] = el)}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          onChange={(e) =>
            setForm({ ...form, available: e.target.value === "true" })
          }
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="true">Disponível</option>
          <option value="false">Indisponível</option>
        </select>
      </div>

      {/* Categoria */}
      <div>
        <select
          value={form.categoria || ""}
          ref={(el) => (formRefs.current[2] = el)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Selecione a categoria</option>
          <option value="tradicional"> Tradicionais</option>
          <option value="especial">Especiais</option>
          <option value="doce"> Doces</option>
         
        </select>
      </div>

      {/* Descrição */}
      <textarea
        placeholder="Descrição do produto"
        value={form.description}
        ref={(el) => (formRefs.current[3] = el)}
        onKeyDown={(e) => handleKeyDown(e, 3)}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        rows={3}
      />

      {/* Gerenciar tamanhos */}
      <div className="space-y-3">
        <label className="font-semibold">Tamanhos (opcional)</label>

        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <input
            type="text"
            placeholder="Ex: 250ml, Médio, Grande..."
            value={newSize}
            ref={(el) => (formRefs.current[4] = el)}
            onKeyDown={(e) => handleKeyDown(e, 4)}
            onChange={(e) => setNewSize(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAddSize}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
          >
            + Adicionar
          </button>
        </div>

        <div className="grid gap-3">
          {form.sizes.map((size, idx) => (
            <div
              key={size}
              className="flex flex-wrap items-center gap-3 border rounded-lg p-2 bg-gray-50"
            >
              <span className="font-medium">{size}</span>
              <input
                type="text"
                className="border rounded-lg px-2 py-1 w-28 focus:ring-2 focus:ring-blue-500 outline-none"
                value={
                  form.prices[size] !== undefined && form.prices[size] !== null
                    ? String(form.prices[size]).replace(".", ",")
                    : ""
                }
                ref={(el) => (formRefs.current[5 + idx] = el)}
                onKeyDown={(e) => handleKeyDown(e, 5 + idx)}
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
                className="text-red-600 font-bold hover:text-red-800"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Imagem */}
      <div className="space-y-2">
        <label className="font-semibold">Imagem do Item</label>
        <input
          type="file"
          accept="image/*"
          ref={(el) => (formRefs.current[20] = el)}
          onKeyDown={(e) => handleKeyDown(e, 20)}
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {(file || form.image) && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={file ? URL.createObjectURL(file) : form.image}
              alt="Preview"
              className="h-24 rounded-md object-cover border"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setForm({ ...form, image: "" });
              }}
              className="text-red-600 font-semibold hover:text-red-800"
            >
              Remover imagem
            </button>
          </div>
        )}
      </div>

      {/* Botão principal */}
      <button
        type="button"
        onClick={handleSaveProduct}
        disabled={loadingSave}
        className="bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loadingSave
          ? "Salvando..."
          : editingIdx !== null
          ? "Salvar Alterações"
          : "Adicionar Item"}
      </button>
    </div>
  );
}
