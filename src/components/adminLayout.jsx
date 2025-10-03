import { Link, Outlet, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { FiMenu, FiX, FiBox, FiClock, FiSettings, FiLogOut } from "react-icons/fi";
import { FaPizzaSlice, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";

export default function AdminLayout() {
  const location = useLocation();
  const auth = getAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/admin/pedidos", label: "Pedidos", icon: <FiBox /> },
    { path: "/admin/produtos", label: "Produtos", icon: <FaPizzaSlice /> },
    { path: "/admin/historico", label: "Histórico", icon: <FiClock /> },
    { path: "/admin/config", label: "Configuração", icon: <FiSettings /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#F5F6FA] to-[#E9ECF5]">
      {/* Botão menu mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#0C2340] text-white rounded-full shadow-lg hover:scale-105 transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 min-h-screen w-64 bg-gradient-to-b from-[#0C2340] to-[#1B2C50] text-white flex flex-col transform transition-transform duration-300 z-40 shadow-xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo / Título */}
        <div className="px-6 py-6 font-bold text-2xl tracking-wide flex items-center justify-center border-b border-[#1A2E50]">
          <span className="bg-gradient-to-r from-[#009DFF] to-[#00E5FF] text-transparent bg-clip-text">
            SASP Admin
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)} // Fecha menu no mobile
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white shadow-md scale-[1.02] border-l-4 border-[#00E5FF]"
                    : "hover:bg-[#1A2E50] hover:scale-[1.02]"
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Contato com suporte */}
        <div className="px-4 py-4 border-t border-[#1A2E50] flex flex-col items-center gap-3 text-lg">
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/sasp_dev/?next=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.linkedin.com/in/sanderley-santos-681918211"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://wa.me/5588981356668"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition"
            >
              <FaWhatsapp />
            </a>
          </div>
          <p className="text-xs font-medium text-center">
            Entre em contato com a equipe de suporte
          </p>
        </div>

        {/* Botão de sair */}
        <div className="px-4 py-6 border-t border-[#1A2E50]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#E63946] to-[#FF4D6D] hover:opacity-90 text-white font-semibold shadow-lg transition"
          >
            <FiLogOut /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
