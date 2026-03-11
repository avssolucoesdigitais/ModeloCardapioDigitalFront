import { useState } from "react";
import { useParams } from "react-router-dom";
import { CATEGORIES } from "../utils/categoriasConfig";

import PainelPizza from "../components/paineis/PainelPizza";
import PainelHamburguer from "../components/paineis/painelHamburgue";
import PainelPastel from "../components/paineis/painelPastel";
import PainelBatata from "../components/paineis/painelBatataFrita";
import PainelBebida from "../components/paineis/PainelBebidas";
import PainelPromocao from "../components/paineis/painelPromocao";
import PainelCalzone from "../components/paineis/painelCalzone";
import PainelEsfiha from "../components/paineis/painelEsfiha";
import PainelSalgadinhos from "../components/paineis/PainelSalgadinhos";
import PainelSalgados from "../components/paineis/painelSalgados";

const PAINEL_MAP = {
  Pizza: PainelPizza,
  Hamburguer: PainelHamburguer,
  Pastel: PainelPastel,
  Batata: PainelBatata,
  Bebida: PainelBebida,
  Promocao: PainelPromocao,
  Calzone: PainelCalzone,
  Esfiha: PainelEsfiha,
  Salgadinhos: PainelSalgadinhos,
  Salgados: PainelSalgados,
};

function OpcoesCategoriaAdmin() {
  const { lojaSlug } = useParams(); // ✅ pega o slug da URL
  const [activeCat, setActiveCat] = useState("Pizza");

  const ActivePanel = PAINEL_MAP[activeCat];

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
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const isActive = activeCat === cat.id;
            const categoryColor = cat.color || "bg-blue-500";
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`
                  relative group flex flex-col items-center justify-center 
                  p-5 rounded-[2rem] transition-all duration-300
                  ${isActive
                    ? `${categoryColor} text-white shadow-2xl shadow-current opacity-100 ring-4 ring-white`
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100"
                  }
                `}
              >
                <span className={`text-3xl mb-2 transition-transform duration-500 ${isActive ? "scale-125 rotate-12" : "group-hover:scale-110"}`}>
                  {cat.icon()}
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-center">
                  {cat.nome}
                </span>
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-white text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-current">
                    <span className="text-[10px]">⭐</span>
                  </div>
                )}
              </button>
            );
          })}
        </section>

        <div className="flex items-center gap-4 my-12">
          <div className="h-[2px] flex-1 bg-gray-200 rounded-full"></div>
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">
            Editando {activeCat}
          </span>
          <div className="h-[2px] flex-1 bg-gray-200 rounded-full"></div>
        </div>

        <div className="transition-all duration-500">
          {/* ✅ passa lojaId para todos os painéis */}
          {ActivePanel && <ActivePanel lojaId={lojaSlug} />}
        </div>
      </div>
    </div>
  );
}

export default OpcoesCategoriaAdmin;