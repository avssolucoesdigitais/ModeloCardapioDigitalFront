import { Link, Outlet, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

export default function AdminLayout() {
  const location = useLocation();
  const auth = getAuth();

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
      {/* Sidebar */}
      <aside className="w-64 bg-[#0C2340] text-white flex flex-col">
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
