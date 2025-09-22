import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Função para upload no Cloudinary
async function uploadToCloudinary(file) {
  const cloudName = "dze5gi1ft"; // seu cloud_name
  const uploadPreset = "uhadthkk"; // 🔹 preset NÃO-ASSINADO

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Erro no upload");
  return data.secure_url;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    image: "",
    prices: {},
    sizes: [],
  });
  const [newSize, setNewSize] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // carregar produtos
  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    list.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    setProducts(list);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // salvar produto
  const handleSaveProduct = async () => {
    if (!form.name || !form.category) {
      alert("⚠️ Preencha nome e categoria!");
      return;
    }
    setLoading(true);
    try {
      const productData = {
        name: form.name,
        description: form.description || "",
        category: form.category,
        image: form.image || "",
        available: true,
        prices: form.prices || {},
        sizes: form.sizes || [],
        ordem: form.ordem || products.length + 1,
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "products"), productData);
      }

      setForm({
        name: "",
        description: "",
        category: "",
        image: "",
        prices: {},
        sizes: [],
      });
      setNewSize("");
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Excluir produto?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const handleEditProduct = (p) => {
    setForm({
      ...p,
      prices: p.prices || {},
      sizes: p.sizes || [],
    });
    setEditingId(p.id);
  };

  const toggleAvailability = async (id, available) => {
    await updateDoc(doc(db, "products", id), { available });
    fetchProducts();
  };

  // adicionar novo tamanho
  const addSize = () => {
    if (!newSize.trim()) return;
    if (form.sizes.includes(newSize.trim())) return;
    setForm({
      ...form,
      sizes: [...form.sizes, newSize.trim()],
    });
    setNewSize("");
  };

  // remover tamanho
  const removeSize = (size) => {
    const newSizes = form.sizes.filter((s) => s !== size);
    const newPrices = { ...form.prices };
    delete newPrices[size];
    setForm({ ...form, sizes: newSizes, prices: newPrices });
  };

  // reordenar produtos via drag-and-drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(products);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setProducts(reordered);

    await Promise.all(
      reordered.map((p, idx) =>
        updateDoc(doc(db, "products", p.id), { ordem: idx + 1 })
      )
    );
    fetchProducts();
  };

  return (
    <div className="space-y-10">
      {/* Formulário */}
      <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#0C2340] mb-4">
          ➕ Adicionar / Editar Produto
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome do produto"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Categoria</option>
            <option value="Pastel">🥟 Pastel</option>
            <option value="Pizza">🍕 Pizza</option>
            <option value="Bebida">🥤 Bebida</option>
            <option value="Sanduiche">🍔 Hamburgue</option>
            <option value="Promocao">🔥 Promoção</option>
            <option value="HotDog">🌭 Hot dog</option>
            <option value="Batata">🍟 Batata Frita</option>
          </select>
        </div>

        <textarea
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 mt-4"
        />

        {/* Gerenciar tamanhos */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Tamanhos</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 250ml, grande, família..."
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={addSize}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ➕ Adicionar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {form.sizes.map((size) => (
              <div
                key={size}
                className="flex items-center gap-2 border p-2 rounded-lg"
              >
                <span className="font-medium">{size}</span>
                <input
                  type="number"
                  placeholder="Preço"
                  value={form.prices?.[size] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prices: {
                        ...form.prices,
                        [size]: Number(e.target.value),
                      },
                    })
                  }
                  className="flex-1 border rounded-lg px-3 py-1"
                />
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upload da imagem */}
        <div className="mt-4">
          <label className="block font-semibold mb-1">Imagem do Produto:</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const url = await uploadToCloudinary(file);
              setForm({ ...form, image: url });
            }}
          />
          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              className="w-24 h-24 object-cover mt-2 rounded border"
            />
          )}
        </div>

        <button
          onClick={handleSaveProduct}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 rounded-lg text-white font-semibold 
                     bg-gradient-to-r from-[#009DFF] to-[#0066CC] hover:opacity-90"
        >
          {loading
            ? "Salvando..."
            : editingId
            ? "Salvar Alterações"
            : "Adicionar Produto"}
        </button>
      </section>

      {/* Lista de produtos */}
      <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-[#0C2340] mb-4">
          📦 Produtos Cadastrados
        </h2>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="products">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {products.map((p, index) => (
                  <Draggable key={p.id} draggableId={p.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-[#F5F6FA] hover:shadow"
                      >
                        <div className="flex items-center gap-4">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-[#0C2340]">
                              {p.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {p.category}
                            </p>
                            <p className="text-xs text-gray-500">
                              {p.description}
                            </p>
                            {p.sizes?.length > 0 && (
                              <p className="text-xs mt-1">
                                <strong>Tamanhos:</strong>{" "}
                                {p.sizes.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="px-3 py-1 rounded-lg bg-yellow-400 text-white text-sm hover:opacity-90"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:opacity-90"
                          >
                            Excluir
                          </button>
                          <button
                            onClick={() =>
                              toggleAvailability(
                                p.id,
                                !(p.available !== false)
                              )
                            }
                            className={`px-3 py-1 rounded-lg text-sm ${
                              p.available !== false
                                ? "bg-green-600 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {p.available !== false ? "Disponível" : "Indisp."}
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </section>
    </div>
  );
}
