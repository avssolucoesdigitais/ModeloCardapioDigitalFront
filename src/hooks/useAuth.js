import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const SUPER_ADMIN_UID = "RBVQr2GnvubTbUv7UWqjdQ0nUD43";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
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
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, loading };
}