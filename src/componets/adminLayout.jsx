import { Link, Outlet, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function AdminLayout() {
  const location = useLocation();
  const auth = getAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/admin/pedidos", label: "📦 Pedidos" },
    { path: "/admin/produtos", label: "🍕 Produtos" },
    { path: "/admin/historico", label: "📜 Histórico" },
    { path: "/admin/config", label: "⚙️ Configuração" },
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
    <div className="min-h-screen flex bg-[#F5F6FA]">
      {/* Botão menu mobile */}
      <button
        className="md:hidden fixed top-4 left- z-50 p-2 bg-[#0C2340] text-white rounded-lg shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#0C2340] text-white flex flex-col transform transition-transform duration-300 z-40
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo / Título */}
        <div className="px-6 py-4 font-bold text-xl border-b border-[#1A2E50]">
          SASP Admin
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)} // Fecha menu no mobile
              className={`block px-4 py-2 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white font-semibold shadow-md"
                  : "hover:bg-[#1A2E50]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Botão de sair */}
        <div className="px-4 py-4 border-t border-[#1A2E50]">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-[#E63946] hover:bg-red-700 text-white font-semibold shadow-md"
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
