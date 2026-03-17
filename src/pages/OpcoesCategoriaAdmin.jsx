import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import PainelGenerico from "../components/paineis/PainelGenerico";

function OpcoesCategoriaAdmin() {
  const { lojaSlug } = useParams();
  const [paineis, setPaineis]   = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [loading, setLoading]   = useState(true);

  // Carrega painéis ativos do Firestore
  useEffect(() => {
    if (!lojaSlug) return;
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "lojas", lojaSlug, "paineis"));
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.ativo !== false)
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

      setPaineis(lista);
      if (lista.length > 0) setActiveCat(lista[0].id);
      setLoading(false);
    })();
  }, [lojaSlug]);

  const painelAtivo = paineis.find((p) => p.id === activeCat);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm font-medium">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (paineis.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-4xl">🍽️</p>
          <h2 className="text-gray-700 font-bold">Nenhum painel configurado</h2>
          <p className="text-gray-400 text-sm">
            Acesse <strong>Painéis</strong> no menu lateral para criar e configurar os painéis do cardápio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <header className="bg-white px-6 py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Cardápio <span className="text-blue-600">Digital</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Selecione uma categoria para editar os produtos e preços.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8">

        {/* Grid de painéis — gerado dinamicamente */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {paineis.map((painel) => {
            const isActive = activeCat === painel.id;
            return (
              <button
                key={painel.id}
                onClick={() => setActiveCat(painel.id)}
                className={`
                  relative group flex flex-col items-center justify-center
                  p-5 rounded-[2rem] transition-all duration-300
                  ${isActive
                    ? "bg-blue-600 text-white shadow-2xl shadow-blue-200 ring-4 ring-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100"
                  }
                `}
              >
                <span className={`text-3xl mb-2 transition-transform duration-300 ${isActive ? "scale-125 rotate-12" : "group-hover:scale-110"}`}>
                  {painel.icone}
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-center leading-tight">
                  {painel.nome}
                </span>
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-white text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-blue-600">
                    <span className="text-[10px]">⭐</span>
                  </div>
                )}
              </button>
            );
          })}
        </section>

        {/* Divisor */}
        <div className="flex items-center gap-4 my-12">
          <div className="h-[2px] flex-1 bg-gray-200 rounded-full" />
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">
            Editando {painelAtivo?.nome ?? "..."}
          </span>
          <div className="h-[2px] flex-1 bg-gray-200 rounded-full" />
        </div>

        {/* Painel ativo — sempre PainelGenerico */}
        <div className="transition-all duration-300">
          {activeCat && (
            <PainelGenerico
              key={activeCat}
              lojaId={lojaSlug}
              painelId={activeCat}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default OpcoesCategoriaAdmin;