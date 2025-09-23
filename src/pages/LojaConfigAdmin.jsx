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
            className={`px-4 py-2 font-medium border-b-2 transition ${
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
  <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
    {/* Nome + Instagram */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Nome da Loja"
        value={config.nomeLoja}
        onChange={(e) => setConfig({ ...config, nomeLoja: e.target.value })}
        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full"
      />

      <input
        type="text"
        placeholder="Instagram (ex: https://instagram.com/daypizza)"
        value={config.instagram}
        onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full"
      />
    </div>

    {/* Uploads */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Logo */}
      <div className="space-y-2">
        <label className="block font-semibold">Logo:</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = await uploadToCloudinary(file);
            setConfig({ ...config, logoUrl: url });
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {config.logoUrl && (
          <div className="mt-2 flex flex-col items-start gap-2">
            <img src={config.logoUrl} alt="Logo" className="h-16 rounded border" />
            <button
              onClick={() => setConfig({ ...config, logoUrl: "" })}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* Banner */}
      <div className="space-y-2">
        <label className="block font-semibold">Banner:</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = await uploadToCloudinary(file);
            setConfig({ ...config, bannerUrl: url });
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {config.bannerUrl && (
          <div className="mt-2 flex flex-col items-start gap-2">
            <img src={config.bannerUrl} alt="Banner" className="h-24 rounded border" />
            <button
              onClick={() => setConfig({ ...config, bannerUrl: "" })}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              Remover
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Cores */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="flex items-center justify-between border rounded-lg p-2">
        <span className="font-medium">Cor primária:</span>
        <input
          type="color"
          value={config.primaryColor}
          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
        />
      </label>
      <label className="flex items-center justify-between border rounded-lg p-2">
        <span className="font-medium">Cor secundária:</span>
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
      className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full"
    />

    <button
      onClick={saveConfig}
      disabled={saving}
      className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg font-semibold hover:opacity-90 transition"
    >
      {saving ? "Salvando..." : "Salvar Configuração"}
    </button>
  </section>
)}


      {/* Aba Bairros */}
      {activeTab === "bairros" && (
        <section className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome do bairro"
              value={bairroNome}
              onChange={(e) => setBairroNome(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Taxa de entrega"
              value={bairroTaxa}
              onChange={(e) => setBairroTaxa(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleAddBairro}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition w-full sm:w-auto"
            >
              ➕ Adicionar
            </button>
          </div>
          <ul className="divide-y">
            {config.bairros?.map((b, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center py-2 text-gray-700"
              >
                <span>
                  {b.nome} —{" "}
                  <span className="font-medium">
                    R$ {b.taxa.toFixed(2).replace(".", ",")}
                  </span>
                </span>
                <button
                  onClick={() => handleDeleteBairro(b.nome)}
                  className="text-red-600 font-semibold hover:text-red-800"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Aba Horários */}
      {activeTab === "horarios" && (
        <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="grid gap-4">
            {DIAS_ORDENADOS.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3"
              >
                <span className="w-full sm:w-32 font-medium">{label}:</span>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <div className="flex gap-2 flex-1">
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
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {(config.horarios[key]?.abre || config.horarios[key]?.fecha) && (
                    <button
                      onClick={() =>
                        setConfig({
                          ...config,
                          horarios: {
                            ...config.horarios,
                            [key]: { abre: "", fecha: "" },
                          },
                        })
                      }
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition w-full sm:w-auto"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveHorarios}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#009DFF] to-[#0066CC] text-white rounded-lg hover:opacity-90 transition"
          >
            Salvar Horários
          </button>
        </section>
      )}
    </div>
  );
}
