import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const SUPER_ADMIN_UID = import.meta.env.VITE_SUPER_ADMIN_UID;

// Tempo máximo de sessão: 8 horas (em milissegundos)
// Ajuste conforme necessário:
//   4h  → 4 * 60 * 60 * 1000
//   24h → 24 * 60 * 60 * 1000
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const SESSION_KEY = "admin_session_start";

function registrarSessao() {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
}

function sessaoExpirada() {
  const inicio = localStorage.getItem(SESSION_KEY);
  if (!inicio) return true; // sem registro → considera expirada
  return Date.now() - parseInt(inicio, 10) > SESSION_DURATION_MS;
}

function limparSessao() {
  localStorage.removeItem(SESSION_KEY);
}

export default function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verifica se a sessão expirou antes de qualquer outra coisa
        if (sessaoExpirada()) {
          limparSessao();
          await signOut(auth); // desloga no Firebase
          setUser(null);
          setLoading(false);
          return;
        }

        // Superadmin tem acesso a qualquer painel
        if (u.uid === SUPER_ADMIN_UID) {
          setUser(u);
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "admin", u.uid));
        if (snap.exists() && snap.data().role === "admin") {
          setUser(u);
        } else {
          limparSessao();
          setUser(null);
        }
      } else {
        // Usuário deslogado — garante que o timestamp é removido
        limparSessao();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, loading };
}

// Exporta para ser chamado na página de Login logo após o signInWithEmailAndPassword
export { registrarSessao };