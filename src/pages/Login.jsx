import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "/src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import logo from "../assets/logo.icon.png";
import { motion } from "framer-motion";

import { FaInstagram, FaLinkedin, FaWhatsapp, FaEnvelope, FaLock } from "react-icons/fa";
import { Loader2 } from "lucide-react";

const SUPER_ADMIN_UID = "RBVQr2GnvubTbUv7UWqjdQ0nUD43";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lojaSlug } = useParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 1. Verifica se é superadmin
      if (user.uid === SUPER_ADMIN_UID) {
        navigate("/superadmin");
        return;
      }

      // 2. Verifica se é admin de loja
      const snap = await getDoc(doc(db, "admin", user.uid));

      if (snap.exists() && snap.data().role === "admin") {
        const lojaId = snap.data().lojaId || lojaSlug;
        navigate(`/${lojaId}/admin/pedidos`);
      } else {
        alert("⚠️ Acesso negado: você não é administrador.");
      }
    } catch (err) {
      alert("Erro ao fazer login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 fixed w-full top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
          <h1 className="text-gray-900 text-lg font-black tracking-tight">La-Carta <span className="text-blue-600">Admin</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-gray-400">
            <a href="#" className="hover:text-pink-500 transition-colors"><FaInstagram size={20} /></a>
            <a href="#" className="hover:text-blue-600 transition-colors"><FaLinkedin size={20} /></a>
            <a href="#" className="hover:text-green-500 transition-colors"><FaWhatsapp size={20} /></a>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 pt-24 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-8 md:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Bem-vindo</h2>
              <p className="text-gray-400 text-sm">Acesse o painel de gerenciamento</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <FaEnvelope size={16} />
                </div>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 pl-11 pr-4 py-4 rounded-2xl outline-none transition-all text-gray-700 font-medium"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <FaLock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="Sua senha secreta"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600 pl-11 pr-4 py-4 rounded-2xl outline-none transition-all text-gray-700 font-medium"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Entrando...
                    </>
                  ) : (
                    "Acessar Painel"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Esqueceu a senha? Entre em contato com o <br />
                <span className="font-bold text-gray-600 cursor-pointer hover:underline">suporte técnico</span>
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}