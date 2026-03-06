import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", "."));
  return 0;
}

export default function PainelSalgadinhos() {
  const [docData, setDocData] = useState({ produtos: [], adicionais: [] });
  const [editingIdx, setEditingIdx] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    desc: "",
    preco: "",
    image: "",
    available: true,
  });

  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Salgadinhos");
      const snap = await getDoc(ref);
      if (snap.exists()) setDocData(snap.data());
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Salgadinhos");
    await setDoc(ref, next, { merge: true });
    setDocData(next);
  }

  function resetForm() {
    setNovoProduto({ nome: "", desc: "", preco: "", image: "", available: true });
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
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-8 font-sans">
      
      {/* Formulário Profissional */}
      <section className={`p-6 rounded-2xl shadow-xl transition-all duration-300 ${editingIdx !== null ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            {editingIdx !== null ? "📝 Editando Porção" : "➕ Novo Salgadinho"}
          </h2>
          {editingIdx !== null && (
            <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full animate-pulse">MODO EDIÇÃO</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-gray-700 ml-1">Nome (ex: Cento de Coxinha)</span>
              <input
                placeholder="Nome do produto"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 border outline-none transition-all"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-700 ml-1">Descrição Curta</span>
              <input
                placeholder="Ex: Porção com 100 unidades"
                value={novoProduto.desc}
                onChange={(e) => setNovoProduto({ ...novoProduto, desc: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 border outline-none transition-all"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-gray-700 ml-1">Preço Total</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                className="mt-1 block w-full h-12 px-4 rounded-xl border-gray-200 bg-gray-50 border outline-none focus:ring-2 focus:yellow-500 shadow-sm"
              />
            </label>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-500 cursor-pointer transition-colors bg-gray-50">
                {loadingImg ? <span className="text-yellow-600 animate-bounce">⬆️</span> : (
                  <>
                    <span className="text-2xl">📸</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Imagem</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {novoProduto.image && (
                <div className="relative group">
                  <img src={novoProduto.image} alt="preview" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                  <button onClick={() => setNovoProduto({...novoProduto, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={addOrUpdateProduto}
            className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl shadow-lg shadow-yellow-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {editingIdx !== null ? "💾 Atualizar" : "🚀 Publicar Salgadinho"}
          </button>
          {editingIdx !== null && (
            <button onClick={resetForm} className="px-8 h-14 bg-gray-200 text-gray-600 font-bold rounded-xl">Cancelar</button>
          )}
        </div>
      </section>

      {/* Listagem em Cards de Grade */}
      <section className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 ml-2">Produtos no Ar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docData.produtos.map((p, idx) => (
            <div key={p.id} className={`flex flex-col p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all ${!p.available && 'opacity-50 grayscale'}`}>
              <div className="flex gap-4 mb-4">
                <img src={p.image || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-lg object-cover" alt={p.nome} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{p.nome}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{p.desc}</p>
                  <p className="text-yellow-600 font-black mt-1">R$ {parsePreco(p.preco).toFixed(2).replace(".", ",")}</p>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-3">
                <button 
                  onClick={() => { setNovoProduto({ ...p, preco: p.preco.toString() }); setEditingIdx(idx); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="flex-1 h-10 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg font-bold text-sm"
                >
                  Editar
                </button>
                <button 
                  onClick={() => { if(confirm('Excluir porção?')) saveDocData({...docData, produtos: docData.produtos.filter(i => i.id !== p.id)}) }}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-lg"
                >
                  🗑️
                </button>
                <button 
                  onClick={() => {
                    const nd = {...docData};
                    nd.produtos[idx].available = !nd.produtos[idx].available;
                    saveDocData(nd);
                  }}
                  className={`px-4 h-10 rounded-lg font-bold text-xs transition-all ${p.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {p.available ? 'DISPONÍVEL' : 'ESGOTADO'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}