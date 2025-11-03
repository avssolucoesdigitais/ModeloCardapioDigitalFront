import { useState } from "react";
import { CATEGORIES } from "../utils/categoriasConfig";

// Importa os painéis
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


function OpcoesCategoriaAdmin() {
  const [activeCat, setActiveCat] = useState("Pizza");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Cabeçalho */}
      <header className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          ⚙️ Configurar Cardápio
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie produtos, adicionais e opções por categoria.
        </p>
      </header>

      {/* Seleção de categorias */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 ${
                activeCat === cat.id
                  ? cat.color + " text-white scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl sm:text-3xl">{cat.icon()}</span>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-center">
                {cat.nome}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Painel específico */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {activeCat === "Pizza" && <PainelPizza />}
        {activeCat === "Hamburguer" && <PainelHamburguer />}
        {activeCat === "Pastel" && <PainelPastel />}
        {activeCat === "Batata" && <PainelBatata />}
        {activeCat === "Bebida" && <PainelBebida />}
        {activeCat === "Promocao" && <PainelPromocao />}
        {activeCat === "Calzone" && <PainelCalzone />}
        {activeCat === "Esfiha" && <PainelEsfiha />}
        {activeCat === "Salgadinhos" && <PainelSalgadinhos />}
        {activeCat === "Salgados" && <PainelSalgados />}
       
      </div>
    </div>
  );
}

export default OpcoesCategoriaAdmin;
