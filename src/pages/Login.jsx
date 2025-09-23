import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "/src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import logo from "../assets/logo.png";
import fundo from "../assets/fundo2l.png";

// 🔹 Ícones do React Icons (FontAwesome)
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      const ref = doc(db, "admin", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().role === "admin") {
        navigate("/admin/pedidos"); // ✅ direto pro painel admin
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
    <div
      className="min-h-screen flex flex-col justify-between bg-gray-100 bg-cover bg-center"
      style={{ backgroundImage: `url(${fundo})` }}
    >
      {/* 🔹 Header */}
      <header className="bg-black bg-opacity-80 text-white px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Logo + título */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="h-14 w-14 md:h-20 md:w-20 object-contain" />
          <h1 className="text-lg md:text-xl font-bold text-center md:text-left">Área Administrativa</h1>
        </div>

        {/* Redes sociais */}
        <div className="flex flex-col items-center md:items-end gap-2 text-lg md:text-xl">
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
          <p className="text-xs md:text-sm font-medium mt-1 text-center md:text-right">
            Entre em contato com a equipe de suporte
          </p>
        </div>
      </header>

      {/* 🔹 Conteúdo principal */}
      <main className="flex flex-col items-center justify-center flex-grow px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white p-6 md:p-8 rounded-xl shadow-md w-full max-w-sm relative z-10"
        >
          <h1 className="text-xl md:text-2xl font-bold mb-4 text-center">Login Admin</h1>

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 mb-3 rounded text-sm md:text-base"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border px-3 py-2 mb-3 rounded text-sm md:text-base"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* botão fora do form */}
        <button
          onClick={() => navigate("/carrinho")}
          className="mt-4 w-full max-w-sm bg-gray-200 text-black py-2 rounded hover:bg-gray-300 transition"
        >
          Voltar ao carrinho
        </button>
      </main>

      {/* 🔹 Footer fixo */}
      <Footer />
    </div>
  );
}
