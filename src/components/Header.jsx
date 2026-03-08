import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useState, useEffect } from "react";
import ContaPanel from "./ContaPanel";

export default function Header({ onCartClick, cartCount = 0, onSearchChange, config }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contaOpen, setContaOpen] = useState(false);
  const [user, setUser] = useState(null);

  const primary = config?.primaryColor || "#000000";
  const secondary = config?.secondaryColor || "#ffffff";
  const nomeLoja = config?.nomeLoja || "Minha Loja";
  const logoUrl = config?.logoUrl || "/default-logo.png";
  const whatsapp = config?.whatsapp || "558999999999";

  useEffect(() => {
    const savedUser = localStorage.getItem("userPhone");
    if (savedUser) {
      setUser({ telefone: savedUser });
    }
  }, []);

  return (
    <header style={{ backgroundColor: primary }} className="text-white shadow relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-6">
        {/* Logo + Nome */}
        <div className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-12 w-auto object-contain rounded-md shadow"
          />
          <span className="text-2xl font-bold">{nomeLoja}</span>
        </div>

        {/* Busca Desktop */}
        <div className="flex flex-1 max-w-md relative mx-6 hidden md:flex">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white" />
          <input
            type="text"
            placeholder="Buscar produto..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border text-white focus:outline-none focus:ring-2 bg-transparent placeholder-white"
          />
        </div>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* Botão Cadastro/Login */}
          <button
            style={{ backgroundColor: secondary, color: primary }}
            className="px-4 py-2 rounded-xl shadow hover:opacity-90"
            onClick={() => setContaOpen(true)}
          >
            {user?.nome ? `Olá, ${user.nome}` : "Faça seu cadastro"}
          </button>

          {/* Botão Carrinho */}
          <button
            style={{ backgroundColor: secondary, color: primary }}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl shadow hover:opacity-90"
            onClick={onCartClick}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <span>Carrinho</span>
          </button>

          {/* Botão WhatsApp */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 shadow"
          >
            <FaWhatsapp className="w-5 h-5" /> Contato
          </a>
        </div>

        {/* Menu Mobile */}
        <div className="md:hidden flex items-center gap-3 relative">
          {/* 🔴 Pontinho no topo (ao lado do menu mobile) */}
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-opacity-80"
            style={{ backgroundColor: secondary, color: primary }}
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            )}
          </button>

          <button
            className="p-2 rounded-lg hover:bg-opacity-80"
            style={{ backgroundColor: secondary, color: primary }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div
          className="md:hidden px-4 py-3 space-y-3"
          style={{ backgroundColor: secondary }}
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar produto..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-black"
            />
          </div>

          {/* Carrinho Mobile */}
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl shadow hover:opacity-90 relative"
            style={{ backgroundColor: primary, color: secondary }}
            onClick={onCartClick}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <span>Carrinho ({cartCount})</span>
          </button>

          {/* WhatsApp Mobile */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
          >
            <FaWhatsapp className="w-5 h-5" /> Contato
          </a>

          {/* Cadastro/Login Mobile */}
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl shadow"
            style={{ backgroundColor: primary, color: secondary }}
            onClick={() => setContaOpen(true)}
          >
            {user?.nome ? `Olá, ${user.nome}` : "Faça seu cadastro"}
          </button>
        </div>
      )}

      {/* Painel de cadastro */}
      <ContaPanel
        open={contaOpen}
        onClose={() => setContaOpen(false)}
        onLogin={setUser}
      />
    </header>
  );
}
