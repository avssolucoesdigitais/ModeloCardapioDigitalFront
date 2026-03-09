import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelBatata() {
  const [docData, setDocData] = useState({ produtos: [] });
  const [editingIdx, setEditingIdx] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    description: "",
    image: "",
    sizes: [],
    prices: {},
    preco: "",
    available: true,
    categoria: "tradicional",
  });

  const categorias = ["tradicional", "especial", "doce"];

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Batata");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Batata");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setNovoProduto({
      nome: "",
      description: "",
      image: "",
      sizes: [],
      prices: {},
      preco: "",
      available: true,
      categoria: "tradicional",
    });
    setEditingIdx(null);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingImg(true);
    try {
      const url = await uploadToCloudinary(file);
      setNovoProduto((prev) => ({ ...prev, image: url }));
    } catch (err) {
      alert("Erro no upload: " + err.message);
    } finally {
      setLoadingImg(false);
    }
  }

  function addOrUpdateProduto() {
    if (!novoProduto.nome || !novoProduto.preco) return;
    const precoCorreto = parsePreco(novoProduto.preco);
    const produtoAtualizado = { ...novoProduto, preco: precoCorreto, id: Date.now() };

    let novosProdutos = [...(docData.produtos || [])];
    if (editingIdx !== null) {
      novosProdutos[editingIdx] = { ...produtoAtualizado, id: docData.produtos[editingIdx].id };
    } else {
      novosProdutos.push(produtoAtualizado);
    }

    saveDocData({ ...docData, produtos: novosProdutos });
    resetForm();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-8">
      
      {/* Formulário de Cadastro/Edição */}
      <section className={`p-6 rounded-2xl shadow-lg transition-all ${editingIdx !== null ? 'bg-amber-50 border-2 border-amber-400' : 'bg-white border border-gray-100'}`}>
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          {editingIdx !== null ? "📝 Editando Batata" : "🍟 Nova Batata"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Nome do Produto</span>
              <input
                placeholder="Ex: Batata Cheddar e Bacon"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 border outline-none transition-all"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Descrição</span>
              <textarea
                placeholder="Descreva os ingredientes..."
                value={novoProduto.description}
                onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })}
                className="mt-1 block w-full p-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 border outline-none transition-all"
                rows="3"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-medium text-gray-700">Preço (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={novoProduto.preco}
                  onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                  className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">Categoria</span>
                <select 
                  value={novoProduto.categoria}
                  onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                  className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none"
                >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 cursor-pointer transition-colors bg-gray-50">
                {loadingImg ? <span className="animate-pulse text-amber-600 font-medium">Subindo...</span> : (
                  <>
                    <span className="text-2xl">📸</span>
                    <span className="text-xs text-gray-500">Foto do prato</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {novoProduto.image && (
                <div className="relative">
                  <img src={novoProduto.image} alt="preview" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                  <button onClick={() => setNovoProduto({...novoProduto, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={addOrUpdateProduto}
            className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
          >
            {editingIdx !== null ? "Salvar Alterações" : "Adicionar ao Cardápio"}
          </button>
          {editingIdx !== null && (
            <button onClick={resetForm} className="px-6 h-12 bg-gray-200 text-gray-600 font-medium rounded-xl">Cancelar</button>
          )}
        </div>
      </section>

      {/* Listagem Estilizada */}
      <div className="space-y-8">
        {categorias.map((cat) => {
          const itens = docData.produtos?.filter(p => p.categoria === cat) || [];
          return (
            <section key={cat}>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 ml-2">{cat}</h3>
              <div className="grid grid-cols-1 gap-3">
                {itens.map((p) => {
                  const idx = docData.produtos.indexOf(p);
                  return (
                    <div key={p.id} className={`flex items-center gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm ${!p.available && 'opacity-60 grayscale'}`}>
                      <img src={p.image || 'https://via.placeholder.com/80'} className="w-20 h-20 rounded-xl object-cover" alt={p.nome} />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{p.nome}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                        <p className="text-amber-600 font-black mt-1">R$ {parsePreco(p.preco).toFixed(2)}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => { setNovoProduto({ ...p, preco: p.preco.toString() }); setEditingIdx(idx); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => { if(confirm('Excluir item?')) saveDocData({...docData, produtos: docData.produtos.filter(i => i.id !== p.id)}) }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          🗑️
                        </button>
                        <button 
                          onClick={() => {
                            const nd = {...docData};
                            nd.produtos[idx].available = !nd.produtos[idx].available;
                            saveDocData(nd);
                          }}
                          className={`p-2 rounded-lg ${p.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {p.available ? '●' : '○'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}