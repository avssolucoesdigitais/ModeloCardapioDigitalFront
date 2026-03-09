import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelBebida() {
  const [docData, setDocData] = useState({ produtos: [] });
  const [editingIdx, setEditingIdx] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    description: "",
    image: "",
    preco: "",
    available: true,
    categoria: "tradicional",
    sizes: [],
    prices: {},
  });

  const categorias = ["tradicional", "especial", "doce"];

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Bebida");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Bebida");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setNovoProduto({
      nome: "",
      description: "",
      image: "",
      preco: "",
      available: true,
      categoria: "tradicional",
      sizes: [],
      prices: {},
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
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-8 font-sans text-gray-900">
      
      {/* Formulário Refatorado */}
      <section className={`p-6 rounded-2xl shadow-xl transition-all duration-300 ${editingIdx !== null ? 'bg-indigo-50 border-2 border-indigo-400' : 'bg-white border border-gray-100'}`}>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          {editingIdx !== null ? "🥤 Editando Bebida" : "🥤 Nova Bebida"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold ml-1">Nome da Bebida</span>
              <input
                placeholder="Ex: Coca-Cola 350ml"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 border outline-none transition-all shadow-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold ml-1">Descrição/Volume</span>
              <input
                placeholder="Ex: Lata gelada ou Garrafa 2L"
                value={novoProduto.description}
                onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 border outline-none transition-all shadow-sm"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-semibold ml-1">Preço (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={novoProduto.preco}
                  onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                  className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </label>
              <label>
                <span className="text-sm font-semibold ml-1">Categoria</span>
                <select 
                  value={novoProduto.categoria}
                  onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                  className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none shadow-sm"
                >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors bg-gray-50">
                {loadingImg ? <span className="animate-spin text-2xl">⏳</span> : (
                  <>
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs font-bold text-gray-400">Upload Imagem</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {novoProduto.image && (
                <div className="relative group">
                  <img src={novoProduto.image} alt="preview" className="w-24 h-24 object-cover rounded-xl shadow-inner border border-gray-100" />
                  <button onClick={() => setNovoProduto({...novoProduto, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={addOrUpdateProduto}
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {editingIdx !== null ? "💾 Atualizar Item" : "➕ Adicionar Bebida"}
          </button>
          {editingIdx !== null && (
            <button onClick={resetForm} className="px-8 h-14 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors">Cancelar</button>
          )}
        </div>
      </section>

      {/* Listagem de Bebidas */}
      <div className="space-y-10">
        {categorias.map((cat) => {
          const itens = docData.produtos?.filter(p => p.categoria === cat) || [];
          return (
            <section key={cat} className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-px flex-1 bg-gray-200"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{cat}</h3>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {itens.map((p) => {
                  const idx = docData.produtos.indexOf(p);
                  return (
                    <div key={p.id} className={`group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md ${!p.available && 'opacity-50 grayscale'}`}>
                      <div className="relative">
                        <img src={p.image || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-xl object-cover shadow-sm" alt={p.nome} />
                        {!p.available && <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl text-[10px] text-white font-bold uppercase">Esgotado</span>}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-lg leading-tight">{p.nome}</h4>
                        <p className="text-sm text-gray-500 truncate">{p.description}</p>
                        <p className="text-indigo-600 font-black mt-1 text-lg">R$ {parsePreco(p.preco).toFixed(2)}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={() => { setNovoProduto({ ...p, preco: p.preco.toString() }); setEditingIdx(idx); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                          className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => { if(confirm('Remover esta bebida?')) saveDocData({...docData, produtos: docData.produtos.filter(i => i.id !== p.id)}) }}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                        <button 
                          onClick={() => {
                            const nd = {...docData};
                            nd.produtos[idx].available = !nd.produtos[idx].available;
                            saveDocData(nd);
                          }}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${p.available ? 'bg-green-100 text-green-600 shadow-inner' : 'bg-gray-200 text-gray-500'}`}
                          title={p.available ? "Ativo" : "Inativo"}
                        >
                          {p.available ? '✔' : '✖'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {itens.length === 0 && <p className="text-center py-4 text-gray-400 text-sm italic">Nenhuma bebida nesta categoria.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}