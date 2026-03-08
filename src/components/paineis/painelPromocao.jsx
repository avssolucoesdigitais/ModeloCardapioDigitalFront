import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { FiPlus, FiEdit3, FiTrash2, FiCheck, FiX, FiCamera, FiZap, FiShoppingBag } from "react-icons/fi";

function parsePreco(preco) {
  if (typeof preco === "number") return preco;
  if (typeof preco === "string") return parseFloat(preco.replace(",", ".")) || 0;
  return 0;
}

export default function PainelPromocao() {
  const [docData, setDocData] = useState({ produtos: [] });
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
      const ref = doc(db, "opcoes", "Promocao");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDocData({ produtos: data.produtos || [] });
      }
    })();
  }, []);

  async function saveDocData(next) {
    const ref = doc(db, "opcoes", "Promocao");
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
    const produtoAtualizado = { ...novoProduto, preco: precoCorreto, id: novoProduto.id || Date.now() };

    let novosProdutos = [...docData.produtos];
    if (editingIdx !== null) {
      novosProdutos[editingIdx] = produtoAtualizado;
    } else {
      novosProdutos.push(produtoAtualizado);
    }

    saveDocData({ ...docData, produtos: novosProdutos });
    resetForm();
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 bg-white min-h-screen">
      
      {/* 💥 CABEÇALHO E FORMULÁRIO DE PROMOÇÃO */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 shadow-2xl shadow-orange-200 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <FiZap size={120} />
        </div>
        
        <header className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <FiZap size={24} className="text-yellow-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Ofertas Relâmpago</h2>
            <p className="text-orange-100 text-xs font-medium uppercase tracking-widest">Gerencie seus combos e descontos</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Upload de Imagem */}
          <div className="relative group h-48 lg:h-full min-h-[180px]">
            <div className={`h-full rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm ${novoProduto.image ? 'border-transparent' : 'border-orange-200 hover:border-white'}`}>
              {novoProduto.image ? (
                <img src={novoProduto.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <FiCamera size={32} className="mx-auto text-orange-200 mb-2" />
                  <span className="text-[10px] font-black uppercase">Imagem da Promo</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {loadingImg && <div className="absolute inset-0 bg-orange-600/80 flex items-center justify-center text-[10px] font-black italic">CARREGANDO...</div>}
            </div>
          </div>

          {/* Campos de Texto */}
          <div className="lg:col-span-2 space-y-3">
            <input
              placeholder="Nome da Promoção (ex: Combo Casal)"
              value={novoProduto.nome}
              onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
              className="w-full bg-white/20 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-orange-100 focus:ring-2 focus:ring-white text-white"
            />
            <textarea
              placeholder="O que está incluso nesta oferta?"
              value={novoProduto.desc}
              onChange={(e) => setNovoProduto({ ...novoProduto, desc: e.target.value })}
              className="w-full bg-white/20 border-none rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-orange-100 focus:ring-2 focus:ring-white text-white h-20 resize-none"
            />
            <div className="flex gap-3">
              <input
                placeholder="R$ 0,00"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                className="flex-1 bg-white border-none rounded-2xl px-5 py-4 text-sm font-black text-orange-600 focus:ring-2 focus:ring-white shadow-lg"
              />
              <button 
                onClick={addOrUpdateProduto}
                className="px-8 bg-yellow-400 text-orange-900 font-black rounded-2xl hover:bg-white transition-all shadow-lg flex items-center gap-2"
              >
                {editingIdx !== null ? <FiCheck /> : <FiPlus />}
                <span className="hidden md:inline">{editingIdx !== null ? "ATUALIZAR" : "LANÇAR"}</span>
              </button>
              {editingIdx !== null && (
                <button onClick={resetForm} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🛍️ LISTA DE PROMOÇÕES ATIVAS */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2 text-xl font-black text-slate-800 px-2 uppercase tracking-tighter italic">
          <FiShoppingBag className="text-orange-500" /> Promoções no Ar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docData.produtos.length > 0 ? (
            docData.produtos.map((p, idx) => (
              <div key={p.id} className={`group relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm transition-all hover:shadow-xl ${!p.available && 'opacity-60 grayscale'}`}>
                <div className="h-40 relative">
                  <img src={p.image || "https://via.placeholder.com/300"} alt={p.nome} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg italic">OFERTA</div>
                </div>
                
                <div className="p-6">
                  <h4 className="font-black text-slate-800 text-lg mb-1 leading-tight">{p.nome}</h4>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-2 h-8 mb-4">{p.desc}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-orange-600 tracking-tighter">
                      R$ {parsePreco(p.preco).toFixed(2).replace(".", ",")}
                    </span>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setNovoProduto({ ...p, preco: p.preco.toString() }); setEditingIdx(idx); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => { if(confirm("Remover oferta?")) saveDocData({ ...docData, produtos: docData.produtos.filter((_, i) => i !== idx) }); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <button 
                        onClick={() => { const next = {...docData}; next.produtos[idx].available = !p.available; saveDocData(next); }}
                        className={`p-2 rounded-xl transition-all ${p.available ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}
                      >
                        {p.available ? <FiCheck size={16} /> : <FiX size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
              <FiZap className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma promoção ativa no momento</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}