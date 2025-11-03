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
  const formRefs = useRef([]);

  useEffect(() => {
    formRefs.current = formRefs.current.slice(0, 20);
  }, []);

  function handleKeyDown(e, idx) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = formRefs.current[idx + 1];
      if (next) next.focus();
    }
  }

  async function handleSaveProduct() {
    if (!form.name) return alert("Nome obrigatório");
    if (!form.categoria) return alert("Categoria obrigatória");

    setLoadingSave(true);
    try {
      let imageUrl = form.image;
      if (file) imageUrl = await uploadToCloudinary(file);

      const normalizedPrices = Object.fromEntries(
        Object.entries(form.prices || {}).map(([k, v]) => [
          k,
          parseFloat((v + "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0,
        ])
      );

      const produto = { ...form, image: imageUrl, prices: normalizedPrices };
      const next = { ...docData };

      if (editingIdx !== null) next.produtos[editingIdx] = produto;
      else next.produtos = [...(next.produtos || []), produto];

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
    <form
      className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-6 max-w-screen-sm mx-auto"
      aria-label="Formulário de cadastro de produto"
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveProduct();
      }}
    >
      <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
        {editingIdx !== null ? "✏️ Editar Item" : "➕ Adicionar Novo Item"}
      </h2>

      {/* Nome e disponibilidade */}
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-gray-700">Nome</span>
          <input
            type="text"
            placeholder="Nome do produto"
            aria-label="Nome do produto"
            value={form.name}
            ref={(el) => (formRefs.current[0] = el)}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium text-gray-700">Status</span>
          <select
            aria-label="Status do produto"
            value={form.available ? "true" : "false"}
            ref={(el) => (formRefs.current[1] = el)}
            onKeyDown={(e) => handleKeyDown(e, 1)}
            onChange={(e) =>
              setForm({ ...form, available: e.target.value === "true" })
            }
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
          >
            <option value="true">Disponível</option>
            <option value="false">Indisponível</option>
          </select>
        </label>
      </div>

      {/* Categoria */}
      <label>
        <span className="text-sm font-medium text-gray-700">Categoria</span>
        <select
          aria-label="Categoria"
          value={form.categoria || ""}
          ref={(el) => (formRefs.current[2] = el)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
        >
          <option value="">Selecione...</option>
          <option value="tradicional">Tradicional</option>
          <option value="especial">Especial</option>
          <option value="doce">Doce</option>
        </select>
      </label>

      {/* Descrição */}
      <label>
        <span className="text-sm font-medium text-gray-700">Descrição</span>
        <textarea
          placeholder="Detalhes do produto"
          aria-label="Descrição do produto"
          value={form.description}
          ref={(el) => (formRefs.current[3] = el)}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none resize-none"
          rows={3}
        />
      </label>

      {/* Gerenciar tamanhos */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-2">
          Tamanhos (opcional)
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Ex: 250ml, Médio, Grande..."
            aria-label="Novo tamanho"
            value={newSize}
            ref={(el) => (formRefs.current[4] = el)}
            onKeyDown={(e) => handleKeyDown(e, 4)}
            onChange={(e) => setNewSize(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
          />
          <button
            type="button"
            onClick={handleAddSize}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition w-full sm:w-auto"
          >
            + Adicionar
          </button>
        </div>

        {/* Lista de tamanhos */}
        <div className="mt-3 space-y-2">
          {form.sizes.map((size, idx) => (
            <div
              key={size}
              className="flex flex-wrap items-center justify-between border rounded-lg p-2 bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium text-gray-800">{size}</span>
                <input
                  type="text"
                  aria-label={`Preço do tamanho ${size}`}
                  className="border rounded-lg px-2 py-1 w-28 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
                  value={
                    form.prices[size] !== undefined
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
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSize(size)}
                className="text-red-600 font-bold hover:text-red-800"
                aria-label={`Remover tamanho ${size}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Imagem */}
      <section>
        <label className="block font-semibold text-gray-800 mb-1">
          Imagem do Produto
        </label>
        <input
          type="file"
          accept="image/*"
          aria-label="Selecionar imagem do produto"
          ref={(el) => (formRefs.current[20] = el)}
          onKeyDown={(e) => handleKeyDown(e, 20)}
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {(file || form.image) && (
          <div className="mt-3 flex items-center gap-4">
            <img
              src={file ? URL.createObjectURL(file) : form.image}
              alt="Pré-visualização da imagem"
              className="h-24 w-24 rounded-md object-cover border"
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
      </section>

      {/* Botão principal */}
      <button
        type="submit"
        disabled={loadingSave}
        className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingSave
          ? "Salvando..."
          : editingIdx !== null
          ? "Salvar Alterações"
          : "Adicionar Item"}
      </button>
    </form>
  );
}
