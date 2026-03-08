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
    formRefs.current = formRefs.current.slice(0, 25);
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
      alert("❌ Erve um erro ao salvar.");
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
      className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 max-w-2xl mx-auto border border-gray-100"
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveProduct();
      }}
    >
      <header className="border-b border-gray-100 pb-6">
        <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          {editingIdx !== null ? (
            <span className="flex items-center gap-2 text-indigo-600">
              <span className="p-2 bg-indigo-50 rounded-xl text-2xl">✏️</span> Editar Item
            </span>
          ) : (
            <span className="flex items-center gap-2 text-green-600">
              <span className="p-2 bg-green-50 rounded-xl text-2xl">➕</span> Novo Item
            </span>
          )}
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Preencha as informações para atualizar o cardápio digital.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-6">
        <label className="sm:col-span-2 group">
          <span className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-indigo-600 transition-colors">Nome do Produto</span>
          <input
            type="text"
            placeholder="Ex: Combo Família"
            value={form.name}
            ref={(el) => (formRefs.current[0] = el)}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full h-14 border-2 border-gray-100 rounded-2xl px-5 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-medium"
          />
        </label>

        <label className="group">
          <span className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-indigo-600 transition-colors">Status</span>
          <select
            value={form.available ? "true" : "false"}
            ref={(el) => (formRefs.current[1] = el)}
            onKeyDown={(e) => handleKeyDown(e, 1)}
            onChange={(e) => setForm({ ...form, available: e.target.value === "true" })}
            className="mt-1.5 w-full h-14 border-2 border-gray-100 rounded-2xl px-4 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
          >
            <option value="true" className="text-green-600 font-bold">✅ Disponível</option>
            <option value="false" className="text-red-600 font-bold">❌ Indisponível</option>
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-1 gap-6">
        <label className="group">
          <span className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-indigo-600 transition-colors">Categoria Principal</span>
          <select
            value={form.categoria || ""}
            ref={(el) => (formRefs.current[2] = el)}
            onKeyDown={(e) => handleKeyDown(e, 2)}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="mt-1.5 w-full h-14 border-2 border-gray-100 rounded-2xl px-5 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
          >
            <option value="">Selecione a categoria...</option>
            <option value="tradicional">🍔 Tradicional</option>
            <option value="especial">🌟 Especial</option>
            <option value="doce">🍩 Doce</option>
          </select>
        </label>
      </div>

      <label className="block group">
        <span className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-indigo-600 transition-colors">Descrição / Ingredientes</span>
        <textarea
          placeholder="Descreva o que vem neste item..."
          value={form.description}
          ref={(el) => (formRefs.current[3] = el)}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-1.5 w-full border-2 border-gray-100 rounded-2xl px-5 py-4 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium min-h-[120px]"
        />
      </label>

      {/* Seção de Tamanhos Dinâmicos */}
      <section className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
        <h3 className="text-indigo-900 font-black mb-4 flex items-center gap-2">
          📏 Preços por Tamanho
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ex: 500ml, Grande, Combo..."
            value={newSize}
            ref={(el) => (formRefs.current[4] = el)}
            onKeyDown={(e) => { if(e.key === 'Enter') handleAddSize(); handleKeyDown(e, 4); }}
            onChange={(e) => setNewSize(e.target.value)}
            className="flex-1 h-12 border-2 border-white rounded-xl px-4 bg-white shadow-sm focus:border-indigo-400 outline-none transition-all"
          />
          <button
            type="button"
            onClick={handleAddSize}
            className="bg-indigo-600 text-white h-12 px-6 rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95 transition whitespace-nowrap"
          >
            + Adicionar
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {form.sizes.map((size, idx) => (
            <div key={size} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm animate-fadeIn border border-white">
              <span className="flex-1 font-bold text-gray-700 ml-2">{size}</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-9 pr-4 py-2 w-32 border-2 border-gray-50 bg-gray-50 rounded-xl focus:border-indigo-400 focus:bg-white outline-none font-black text-indigo-600 transition-all"
                  value={form.prices[size] !== undefined ? String(form.prices[size]).replace(".", ",") : ""}
                  ref={(el) => (formRefs.current[5 + idx] = el)}
                  onKeyDown={(e) => handleKeyDown(e, 5 + idx)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d.,]/g, "");
                    setForm({ ...form, prices: { ...form.prices, [size]: val } });
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSize(size)}
                className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          {form.sizes.length === 0 && (
            <p className="text-center py-4 text-sm text-indigo-400 italic">Nenhum tamanho definido.</p>
          )}
        </div>
      </section>

      {/* Foto do Produto */}
      <section className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
        <label className="block text-center font-bold text-gray-600 mb-4 cursor-pointer">
          🖼️ Foto do Produto
          <input
            type="file"
            accept="image/*"
            ref={(el) => (formRefs.current[20] = el)}
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        <div className="flex flex-col items-center">
          {(file || form.image) ? (
            <div className="relative group">
              <img
                src={file ? URL.createObjectURL(file) : form.image}
                className="h-40 w-40 rounded-2xl object-cover border-4 border-white shadow-xl transition-transform group-hover:scale-105"
                alt="Preview"
              />
              <button
                type="button"
                onClick={() => { setFile(null); setForm({ ...form, image: "" }); }}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold hover:bg-red-700 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div 
               onClick={() => formRefs.current[20].click()}
               className="h-40 w-full rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
            >
                <span className="text-4xl">📸</span>
                <span className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Clique para subir imagem</span>
            </div>
          )}
        </div>
      </section>

      {/* Botão de Ação Final */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loadingSave}
          className="w-full h-16 rounded-2xl font-black text-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loadingSave ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              {editingIdx !== null ? "💾 Salvar Alterações" : "🚀 Publicar Item"}
            </>
          )}
        </button>
        <button 
          type="button" 
          onClick={resetForm}
          className="w-full mt-4 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
        >
          Limpar campos e cancelar
        </button>
      </div>
    </form>
  );
}