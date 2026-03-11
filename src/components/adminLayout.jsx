import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiBox, FiClock, FiSettings, FiLogOut } from "react-icons/fi";
import { FaPizzaSlice, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import logo from "../assets/logo.icon.png";

export default function AdminLayout() {
  const location = useLocation();
  const { lojaSlug } = useParams(); // ✅ pega o slug da URL
  const auth = getAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: `/${lojaSlug}/admin/pedidos`,   label: "Pedidos",       icon: <FiBox size={20} /> },
    { path: `/${lojaSlug}/admin/produtos`,  label: "Produtos",      icon: <FaPizzaSlice size={18} /> },
    { path: `/${lojaSlug}/admin/historico`, label: "Histórico",     icon: <FiClock size={20} /> },
    { path: `/${lojaSlug}/admin/config`,    label: "Configuração",  icon: <FiSettings size={20} /> },
  ];

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      try {
        await signOut(auth);
        window.location.href = `/${lojaSlug}/login`; // ✅ redireciona para login da loja
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <button
        className="md:hidden fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-2xl active:scale-90 transition-transform"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-[#0F172A] text-slate-300 flex flex-col transition-all duration-300 z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-8 flex flex-col items-center border-b border-slate-800">
          <img src={logo} alt="logo" className="h-16 w-16 brightness-0 invert opacity-90 mb-3" />
          <h2 className="text-white font-black tracking-tighter text-xl">LA-CARTA</h2>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative group flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all
                  ${isActive ? "text-white" : "hover:text-white hover:bg-slate-800/50"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-lg shadow-blue-900/20"
                  />
                )}
                <span className={`${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-4 mb-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="flex flex-col items-center mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Desenvolvido por
            </span>
            <span className="text-xs font-bold text-slate-200">
              Avante Software
            </span>
            <div className="h-0.5 w-8 bg-blue-600 rounded-full mt-1"></div>
          </div>

          <div className="flex justify-around mb-4">
            <a href="https://wa.me/5588981356668" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-lg hover:text-green-400 transition-colors">
              <FaWhatsapp size={16}/>
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-pink-400 transition-colors">
              <FaInstagram size={16}/>
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-blue-400 transition-colors">
              <FaLinkedin size={16}/>
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 font-bold text-[10px] transition-all uppercase tracking-wider border border-slate-700/50"
          >
            <FiLogOut size={12} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 items-center justify-between hidden md:flex">
          <span className="text-slate-400 font-medium">
            Painel Administrativo &gt; <span className="text-slate-900 font-bold capitalize">{location.pathname.split('/').pop()}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600">Sistema Online</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}