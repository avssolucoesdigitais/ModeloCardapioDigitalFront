import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

// Ordem fixa com labels
const DIAS_ORDENADOS = [
  { key: "domingo", label: "Domingo" },
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
];

// Função para upload no Cloudinary
async function uploadToCloudinary(file) {
  const cloudName = "dze5gi1ft"; // 🔹 seu cloud_name
  const uploadPreset = "uhadthkk"; // 🔹 seu preset não-assinado

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Erro no upload");
  return data.secure_url;
}

export default function LojaConfigAdmin({ lojaId = "daypizza" }) {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState("loja");

  const [config, setConfig] = useState({
    nomeLoja: "",
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#009DFF",
    secondaryColor: "#0C2340",
    whatsapp: "",
    instagram: "",
    bairros: [],
    horarios: {
      domingo: { abre: "", fecha: "" },
      segunda: { abre: "", fecha: "" },
      terca: { abre: "", fecha: "" },
      quarta: { abre: "", fecha: "" },
      quinta: { abre: "", fecha: "" },
      sexta: { abre: "", fecha: "" },
      sabado: { abre: "", fecha: "" },
    },
  });

  const [saving, setSaving] = useState(false);
  const [bairroNome, setBairroNome] = useState("");
  const [bairroTaxa, setBairroTaxa] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadConfig = async () => {
      const ref = doc(db, "lojas", lojaId, "config", "principal");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setConfig((prev) => ({ ...prev, ...snap.data() }));
      }
    };
    loadConfig();
  }, [user, lojaId]);

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

  const handleAddBairro = async () => {
    if (!bairroNome || !bairroTaxa)
      return toast.error("⚠️ Preencha todos os campos!");
    const novos = [...config.bairros, { nome: bairroNome, taxa: Number(bairroTaxa) }];
    const ref = doc(db, "lojas", lojaId, "config", "principal");
    await setDoc(ref, { ...config, bairros: novos }, { merge: true });
    setConfig((prev) => ({ ...prev, bairros: novos }));
    setBairroNome("");
    setBairroTaxa("");
    toast.success("🚚 Bairro adicionado!");
  };

  const handleDeleteBairro = async (nome) => {
    if (confirm("Excluir bairro?")) {
      const novos = config.bairros.filter((b) => b.nome !== nome);
      const ref = doc(db, "lojas", lojaId, "config", "principal");
      await setDoc(ref, { ...config, bairros: novos }, { merge: true });
      setConfig((prev) => ({ ...prev, bairros: novos }));
      toast.success("🗑️ Bairro excluído!");
    }
  };

  const handleSaveHorarios = async () => {
    const ref = doc(db, "lojas", lojaId, "config", "principal");
    await setDoc(ref, { ...config }, { merge: true });
    toast.success("⏰ Horários salvos!");
  };

  if (loading) return <p>Carregando...</p>;
  if (!user) return <p>❌ Acesso negado</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Configuração da Loja</h1>

      {/* Abas */}
      <div className="flex flex-wrap gap-4 border-b mb-6">
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

      {/* Aba Loja */}
      {activeTab === "loja" && (
        <section className="bg-white rounded-xl shadow p-6 border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome da Loja"
              value={config.nomeLoja}
              onChange={(e) => setConfig({ ...config, nomeLoja: e.target.value })}
              className="border p-2 rounded w-full"
            />

            <input
              type="text"
              placeholder="Link do Instagram (ex: https://instagram.com/daypizza)"
              value={config.instagram}
              onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Uploads em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block font-semibold mb-1">Logo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const url = await uploadToCloudinary(file);
                  setConfig({ ...config, logoUrl: url });
                }}
              />
              {config.logoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={config.logoUrl} alt="Logo" className="h-16 rounded border" />
                  <button
                    onClick={() => setConfig({ ...config, logoUrl: "" })}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Banner */}
            <div>
              <label className="block font-semibold mb-1">Banner:</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const url = await uploadToCloudinary(file);
                  setConfig({ ...config, bannerUrl: url });
                }}
              />
              {config.bannerUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={config.bannerUrl} alt="Banner" className="h-24 rounded border" />
                  <button
                    onClick={() => setConfig({ ...config, bannerUrl: "" })}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cores */}
          <div className="flex flex-wrap gap-4">
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

          {/* WhatsApp */}
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
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg hover:opacity-90"
          >
            {saving ? "Salvando..." : "Salvar Configuração"}
          </button>
        </section>
      )}

      {/* Aba Bairros */}
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
            {config.bairros?.map((b, idx) => (
              <li key={idx} className="flex justify-between items-center py-2">
                <span>
                  {b.nome} — R$ {b.taxa.toFixed(2)}
                </span>
                <button
                  onClick={() => handleDeleteBairro(b.nome)}
                  className="text-red-500 hover:underline"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Aba Horários */}
      {activeTab === "horarios" && (
        <section className="bg-white rounded-xl shadow p-6 border">
          <div className="grid gap-4">
            {DIAS_ORDENADOS.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center sm:gap-3 border-b pb-3"
              >
                <span className="w-32 font-medium">{label}:</span>
                <div className="flex gap-2 mt-2 sm:mt-0 w-full">
                  <input
                    type="time"
                    value={config.horarios[key]?.abre || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        horarios: {
                          ...config.horarios,
                          [key]: { ...config.horarios[key], abre: e.target.value },
                        },
                      })
                    }
                    className="flex-1 border p-2 rounded"
                  />
                  <span className="flex items-center">às</span>
                  <input
                    type="time"
                    value={config.horarios[key]?.fecha || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        horarios: {
                          ...config.horarios,
                          [key]: { ...config.horarios[key], fecha: e.target.value },
                        },
                      })
                    }
                    className="flex-1 border p-2 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveHorarios}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg hover:opacity-90"
          >
            Salvar Horários
          </button>
        </section>
      )}
    </div>
  );
}
