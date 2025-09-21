import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function useLojaConfig(lojaId = "daypizza") {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "lojas", lojaId, "config", "principal");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        setConfig(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [lojaId]);

  return { config, loading };
}
