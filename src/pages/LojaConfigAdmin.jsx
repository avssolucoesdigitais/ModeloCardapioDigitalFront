import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function LojaConfigAdmin({ lojaId = "daypizza" }) {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState("loja");

  // Config principal
  const [config, setConfig] = useState({
    nomeLoja: "",
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#009DFF",
    secondaryColor: "#0C2340",
    whatsapp: "",
  });
  const [saving, setSaving] = useState(false);

  // Bairros
  const [bairros, setBairros] = useState([]);
  const [bairroNome, setBairroNome] = useState("");
  const [bairroTaxa, setBairroTaxa] = useState("");

  // Horários
  const [horarios, setHorarios] = useState({
    domingo: { abre: "", fecha: "" },
    segunda: { abre: "", fecha: "" },
    terca: { abre: "", fecha: "" },
    quarta: { abre: "", fecha: "" },
    quinta: { abre: "", fecha: "" },
    sexta: { abre: "", fecha: "" },
    sabado: { abre: "", fecha: "" },
  });

  useEffect(() => {
    if (!user) return;

    const loadConfig = async () => {
      const ref = doc(db, "lojas", lojaId, "config", "principal");
      const snap = await getDoc(ref);
      if (snap.exists()) setConfig((prev) => ({ ...prev, ...snap.data() }));
    };

    const loadBairros = async () => {
      const snap = await getDocs(collection(db, "bairros"));
      setBairros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    const loadHorarios = async () => {
      const ref = doc(db, "config", "funcionamento");
      const snap = await getDoc(ref);
      if (snap.exists()) setHorarios(snap.data().horarios || horarios);
    };

    loadConfig();
    loadBairros();
    loadHorarios();
  }, [user, lojaId]);

  // 🔹 Salvar Config Loja
  const saveConfig = async () => {
    try {
      setSaving(true);
      const ref = doc(db, "lojas", lojaId, "config", "principal");
      await setDoc(ref, config, { merge: true });
      toast.success("✅ Configuração da loja salva!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Bairros
  const handleAddBairro = async () => {
    if (!bairroNome || !bairroTaxa) return toast.error("⚠️ Preencha todos os campos!");
    await addDoc(collection(db, "bairros"), {
      nome: bairroNome,
      taxa: Number(bairroTaxa),
    });
    setBairroNome("");
    setBairroTaxa("");
    toast.success("🚚 Bairro adicionado!");
    const snap = await getDocs(collection(db, "bairros"));
    setBairros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleDeleteBairro = async (id) => {
    if (confirm("Excluir bairro?")) {
      await deleteDoc(doc(db, "bairros", id));
      toast.success("🗑️ Bairro excluído!");
      const snap = await getDocs(collection(db, "bairros"));
      setBairros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  };

  // 🔹 Horários
  const handleSaveHorarios = async () => {
    await setDoc(doc(db, "config", "funcionamento"), { horarios });
    toast.success("⏰ Horários salvos!");
  };

  if (loading) return <p>Carregando...</p>;
  if (!user) return <p>❌ Acesso negado</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configuração da Loja</h1>

      {/* 🔹 Abas */}
      <div className="flex gap-4 border-b mb-6">
        {[
          { id: "loja", label: "🏪 Loja" },
          { id: "bairros", label: "🚚 Bairros" },
          { id: "horarios", label: "⏰ Horários" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === tab.id
                ? "border-[#009DFF] text-[#009DFF]"
                : "border-transparent text-gray-500 hover:text-[#009DFF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 🔹 Aba Loja */}
      {activeTab === "loja" && (
        <section className="bg-white rounded-xl shadow p-6 border space-y-4">
          <input
            type="text"
            placeholder="Nome da Loja"
            value={config.nomeLoja}
            onChange={(e) => setConfig({ ...config, nomeLoja: e.target.value })}
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="URL da Logo"
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="URL do Banner"
            value={config.bannerUrl}
            onChange={(e) => setConfig({ ...config, bannerUrl: e.target.value })}
            className="border p-2 rounded w-full"
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              Cor primária:
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
            </label>

            <label className="flex items-center gap-2">
              Cor secundária:
              <input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
              />
            </label>
          </div>

          <input
            type="text"
            placeholder="WhatsApp (ex: 5588981356668)"
            value={config.whatsapp}
            onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg hover:opacity-90"
          >
            {saving ? "Salvando..." : "Salvar Configuração"}
          </button>
        </section>
      )}

      {/* 🔹 Aba Bairros */}
      {activeTab === "bairros" && (
        <section className="bg-white rounded-xl shadow p-6 border">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Nome do bairro"
              value={bairroNome}
              onChange={(e) => setBairroNome(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <input
              type="number"
              placeholder="Taxa de entrega"
              value={bairroTaxa}
              onChange={(e) => setBairroTaxa(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleAddBairro}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Adicionar
            </button>
          </div>
          <ul className="divide-y">
            {bairros.map((b) => (
              <li key={b.id} className="flex justify-between items-center py-2">
                <span>
                  {b.nome} — R$ {b.taxa.toFixed(2)}
                </span>
                <button
                  onClick={() => handleDeleteBairro(b.id)}
                  className="text-red-500 hover:underline"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 🔹 Aba Horários */}
      {activeTab === "horarios" && (
        <section className="bg-white rounded-xl shadow p-6 border">
          <div className="grid gap-2">
            {Object.keys(horarios).map((dia) => (
              <div key={dia} className="flex items-center gap-2">
                <span className="capitalize w-24">{dia}:</span>
                <input
                  type="time"
                  value={horarios[dia]?.abre || ""}
                  onChange={(e) =>
                    setHorarios({
                      ...horarios,
                      [dia]: { ...horarios[dia], abre: e.target.value },
                    })
                  }
                  className="border p-2 rounded"
                />
                <span>às</span>
                <input
                  type="time"
                  value={horarios[dia]?.fecha || ""}
                  onChange={(e) =>
                    setHorarios({
                      ...horarios,
                      [dia]: { ...horarios[dia], fecha: e.target.value },
                    })
                  }
                  className="border p-2 rounded"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveHorarios}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg hover:opacity-90"
          >
            Salvar Horários
          </button>
        </section>
      )}
    </div>
  );
}
