import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelSalgados({ lojaId }) {
  const [docData, setDocData] = useState({ produtos: [], adicionais: [] });
  const [editingIdx, setEditingIdx] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    description: "",
    preco: "",
    image: "",
    available: true,
    sizes: [],
    prices: {},
  });

  useEffect(() => {
    (async () => {
      const ref = doc(db, "lojas", lojaId, "opcoes", "Salgados");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "lojas", lojaId, "opcoes", "Salgados");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setNovoProduto({
      nome: "",
      description: "",
      preco: "",
      image: "",
      available: true,
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
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-8 font-sans">
      
      {/* Formulário Salgado */}
      <section className={`p-6 rounded-2xl shadow-xl transition-all duration-300 ${editingIdx !== null ? 'bg-orange-50 border-2 border-orange-400' : 'bg-white border border-gray-100'}`}>
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          {editingIdx !== null ? "🥐 Editando Salgado" : "🥐 Novo Salgado"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-600 ml-1">Nome</span>
              <input
                placeholder="Ex: Coxinha de Frango"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 border outline-none transition-all shadow-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-600 ml-1">Descrição</span>
              <textarea
                placeholder="Ex: Massa de batata com recheio de frango desfiado..."
                value={novoProduto.description}
                onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })}
                className="mt-1 block w-full p-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 border outline-none transition-all shadow-sm"
                rows="3"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-600 ml-1">Preço (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              />
            </label>

            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 cursor-pointer transition-colors bg-gray-50">
                {loadingImg ? <span className="animate-pulse text-orange-600 font-bold">Enviando...</span> : (
                  <>
                    <span className="text-3xl mb-1">📷</span>
                    <span className="text-xs font-bold text-gray-400">Foto do Salgado</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {novoProduto.image && (
                <div className="relative group">
                  <img src={novoProduto.image} alt="preview" className="w-32 h-32 object-cover rounded-xl shadow-md border border-gray-100" />
                  <button 
                    onClick={() => setNovoProduto({...novoProduto, image: ''})} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={addOrUpdateProduto}
            className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {editingIdx !== null ? "💾 Salvar Alterações" : "➕ Cadastrar Salgado"}
          </button>
          {editingIdx !== null && (
            <button onClick={resetForm} className="px-8 h-14 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors">Cancelar</button>
          )}
        </div>
      </section>

      {/* Lista de Salgados */}
      <section className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Salgados Cadastrados</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {docData.produtos.map((p, idx) => (
            <div key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${!p.available && 'opacity-50 grayscale'}`}>
              <div className="relative shrink-0">
                <img src={p.image || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-xl object-cover" alt={p.nome} />
                {!p.available && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">OFF</span>
                    </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-lg leading-tight truncate">{p.nome}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                <p className="text-orange-600 font-black mt-1">R$ {parsePreco(p.preco).toFixed(2).replace(".", ",")}</p>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { 
                    setNovoProduto({ ...p, preco: p.preco.toString() }); 
                    setEditingIdx(idx); 
                    window.scrollTo({top: 0, behavior: 'smooth'}); 
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => { if(confirm('Excluir salgado?')) saveDocData({...docData, produtos: docData.produtos.filter(i => i.id !== p.id)}) }}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                >
                  🗑️
                </button>
                <button 
                  onClick={() => {
                    const nd = {...docData};
                    nd.produtos[idx].available = !nd.produtos[idx].available;
                    saveDocData(nd);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${p.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {p.available ? '✔' : '✖'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {docData.produtos.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">Nenhum salgado encontrado.</p>
          </div>
        )}
      </section>
    </div>
  );
}