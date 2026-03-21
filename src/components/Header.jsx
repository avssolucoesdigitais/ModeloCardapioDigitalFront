import { ShoppingCart, Search, Menu, X, User } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    if (savedUser) setUser({ telefone: savedUser });
  }, []);

  return (
    <header
      style={{ backgroundColor: primary }}
      className="sticky top-0 z-50 shadow-md text-white"
    >
      {/* Safe area para notch/status bar */}
      <div style={{ height: "env(safe-area-inset-top)", backgroundColor: primary }} />

      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4">

        {/* Logo + Nome */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain transition-transform group-hover:scale-110" />
          <span className="text-sm sm:text-xl font-black tracking-tight">
            {nomeLoja}
          </span>
        </div>

        {/* Busca — Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="O que você busca hoje?"
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-sm focus:bg-white focus:text-black transition-all outline-none placeholder:text-white/50"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* WhatsApp — apenas desktop */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md"
          >
            <FaWhatsapp size={18} />
            Suporte
          </a>

          {/* Conta */}
          <button
            onClick={() => setContaOpen(true)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            <User size={20} />
          </button>

          {/* Carrinho */}
          <button
            onClick={onCartClick}
            style={{ backgroundColor: secondary, color: primary }}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all font-bold text-sm"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">Carrinho</span>

            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartCount}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg font-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {/* Menu mobile */}
          <button
            className="md:hidden p-2.5 rounded-2xl bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white overflow-hidden shadow-2xl border-t border-gray-100"
          >
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no cardápio..."
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none text-black focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setContaOpen(true); setMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-100 text-gray-800 font-bold text-sm"
                >
                  <User size={18} /> Conta
                </button>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-green-50 text-green-600 font-bold text-sm"
                >
                  <FaWhatsapp size={18} /> WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContaPanel open={contaOpen} onClose={() => setContaOpen(false)} onLogin={setUser} />
    </header>
  );
}