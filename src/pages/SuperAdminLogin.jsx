import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { registrarSessao } from "../hooks/useAuth";
import { ShieldCheck } from "lucide-react";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const destino = location.state?.from?.pathname || "/superadmin";

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      registrarSessao();
      navigate(destino, { replace: true });
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="text-orange-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Super Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Acesso restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">E-mail</span>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              placeholder="admin@email.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-600">Senha</span>
            <input
              type="password" required autoComplete="current-password"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              placeholder="••••••••"
            />
          </label>

          {erro && (
            <p className="text-sm text-red-500 font-medium text-center">{erro}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
