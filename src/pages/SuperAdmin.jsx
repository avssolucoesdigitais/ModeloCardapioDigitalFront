import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import Footer from "../components/Footer";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import avsLogo from "../assets/AVS - Logotipo.png";

const SUPER_ADMIN_UID = import.meta.env.VITE_SUPER_ADMIN_UID;
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const horarioInicial = () =>
  Object.fromEntries(DIAS.map((d) => [d, { abre: "18:00", fecha: "23:00", aberto: true }]));

export default function SuperAdmin() {
  const [uid, setUid] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tab, setTab] = useState("lojas");
  const [form, setForm] = useState({
    nomeLoja: "",
    slug: "",
    adminUid: "",
    whatsapp: "",
    instagram: "",
    plano: "basic",
  });
  const [horarios, setHorarios] = useState(horarioInicial());
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (uid !== SUPER_ADMIN_UID) return;
    carregarLojas();
  }, [uid]);

  async function carregarLojas() {
    const snap = await getDocs(collection(db, "lojas"));
    const lista = await Promise.all(
      snap.docs.map(async (d) => {
        const lojaData = { id: d.id, ...d.data() };
        try {
          const configSnap = await getDoc(doc(db, "lojas", d.id, "config", "principal"));
          if (configSnap.exists()) {
            lojaData.logoUrl = configSnap.data().logoUrl || "";
          }
        } catch (_) {}
        return lojaData;
      })
    );
    setLojas(lista);
  }

  function setFeedbackMsg(msg, tipo = "ok") {
    setFeedback({ msg, tipo });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function criarLoja(e) {
    e.preventDefault();
    if (!form.nomeLoja || !form.adminUid) {
      return setFeedbackMsg("Nome da loja e UID do admin são obrigatórios.", "erro");
    }
    const slug = form.slug || slugify(form.nomeLoja);
    if (!slug) return setFeedbackMsg("Slug inválido.", "erro");

    setSalvando(true);
    try {
      await setDoc(doc(db, "lojas", slug), {
        nomeLoja: form.nomeLoja,
        slug,
        whatsapp: form.whatsapp || "",
        instagram: form.instagram || "",
        plano: form.plano,
        status: "ativo",
        criadoEm: serverTimestamp(),
      });

      await setDoc(doc(db, "lojas", slug, "config", "principal"), {
        nomeLoja: form.nomeLoja,
        whatsapp: form.whatsapp || "",
        instagram: form.instagram || "",
        logoUrl: "",
        bannerUrl: "",
        horarios,
        bairros: [],
        cupons: [],
      });

      await setDoc(doc(db, "admin", form.adminUid), {
        role: "admin",
        lojaId: slug,
        criadoEm: serverTimestamp(),
      });

      setFeedbackMsg(`Loja "${form.nomeLoja}" criada com sucesso! Acesse em /${slug}`);
      setForm({ nomeLoja: "", slug: "", adminUid: "", whatsapp: "", instagram: "", plano: "basic" });
      setHorarios(horarioInicial());
      carregarLojas();
      setTab("lojas");
    } catch (err) {
      console.error(err);
      setFeedbackMsg("Erro ao criar loja: " + err.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (uid !== SUPER_ADMIN_UID) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">🔒</div>
          <h1 className="text-gray-900 font-black text-2xl">Acesso Negado</h1>
          <p className="text-gray-400 text-sm">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  const lojasAtivas = lojas.filter(l => l.status !== "inativo").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={avsLogo} alt="AVS" className="h-8 object-contain" />
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="font-black text-gray-900 text-sm tracking-tight">
              LaCarta <span className="text-blue-600">SuperAdmin</span>
            </h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest">Painel de Gestão</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-700 text-xs font-black">{lojasAtivas} ativas</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest">total</span>
            <span className="text-white text-xs font-black">{lojas.length}</span>
          </div>
        </div>
      </header>

      {/* Feedback */}
      {feedback && (
        <div className={`mx-6 mt-4 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm ${
          feedback.tipo === "erro"
            ? "bg-red-50 text-red-600 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          <span>{feedback.tipo === "erro" ? "❌" : "✅"}</span>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-6 mt-6">
        {[
          { id: "lojas", label: "🏪 Lojas", count: lojas.length },
          { id: "nova", label: "➕ Nova Loja" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                tab === t.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 max-w-4xl mx-auto">

        {/* Lista de Lojas */}
        {tab === "lojas" && (
          <div className="space-y-3 mt-2">
            {lojas.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                <p className="text-4xl mb-3">🏪</p>
                <p className="font-bold text-gray-400 text-sm">Nenhuma loja cadastrada ainda.</p>
                <button
                  onClick={() => setTab("nova")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all"
                >
                  Criar primeira loja
                </button>
              </div>
            )}

            {lojas.map((loja, i) => (
              <div
                key={loja.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                  {loja.logoUrl
                    ? <img src={loja.logoUrl} alt={loja.nomeLoja} className="w-full h-full object-cover" />
                    : <span className="text-gray-400 text-xs font-black">{String(i + 1).padStart(2, "0")}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 text-sm truncate">{loja.nomeLoja || loja.id}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-400 text-xs font-mono">/{loja.id}</span>
                    {loja.plano && (
                      <span className="text-[10px] font-black bg-blue-50 text-blue-500 border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                        {loja.plano}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${
                    loja.status === "ativo"
                      ? "bg-green-50 text-green-600 border-green-200"
                      : "bg-red-50 text-red-500 border-red-200"
                  }`}>
                    {loja.status || "ativo"}
                  </span>

                  <a
                    href={`/${loja.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-green-600 hover:text-white rounded-xl text-sm transition-all"
                    title="Ver site da loja"
                  >
                    🌐
                  </a>

                  <a
                    href={`/${loja.id}/admin/pedidos`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-sm transition-all"
                    title="Abrir painel da loja"
                  >
                    🔗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulário Nova Loja */}
        {tab === "nova" && (
          <form onSubmit={criarLoja} className="mt-2 space-y-5">

            {/* Dados da Loja */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Dados da Loja</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Loja *</span>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Burguer do Beto"
                      value={form.nomeLoja}
                      onChange={(e) => {
                        const nome = e.target.value;
                        setForm({ ...form, nomeLoja: nome, slug: slugify(nome) });
                      }}
                      className="mt-1.5 w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Slug (URL) *</span>
                    <div className="mt-1.5 flex items-center h-11 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden">
                      <span className="pl-4 text-gray-400 text-sm font-mono">/</span>
                      <input
                        type="text"
                        required
                        placeholder="burguerdodobeto"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                        className="flex-1 h-full px-2 bg-transparent text-gray-900 text-sm outline-none font-mono"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</span>
                    <input
                      type="text"
                      placeholder="88999999999"
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      className="mt-1.5 w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instagram</span>
                    <input
                      type="text"
                      placeholder="https://instagram.com/..."
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      className="mt-1.5 w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plano</span>
                  <select
                    value={form.plano}
                    onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    className="mt-1.5 w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>
              </div>
            </section>

            {/* Admin da Loja */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Admin da Loja</h2>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-gray-500 text-xs bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl">
                  💡 Crie o usuário no <strong className="text-blue-600">Firebase Auth</strong> primeiro, depois cole o UID aqui.
                </p>
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">UID do Admin *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: abc123XYZ..."
                    value={form.adminUid}
                    onChange={(e) => setForm({ ...form, adminUid: e.target.value.trim() })}
                    className="mt-1.5 w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                </label>
              </div>
            </section>

            {/* Horários */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Horários de Funcionamento</h2>
              </div>
              <div className="p-5 space-y-2">
                {DIAS.map((dia) => (
                  <div
                    key={dia}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      horarios[dia]?.aberto !== false
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 w-32 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={horarios[dia]?.aberto !== false}
                        onChange={(e) =>
                          setHorarios({ ...horarios, [dia]: { ...horarios[dia], aberto: e.target.checked } })
                        }
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className={`text-xs font-bold capitalize ${
                        horarios[dia]?.aberto !== false ? "text-blue-700" : "text-gray-400"
                      }`}>
                        {dia}
                      </span>
                    </label>

                    {horarios[dia]?.aberto !== false ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={horarios[dia]?.abre || "18:00"}
                          onChange={(e) =>
                            setHorarios({ ...horarios, [dia]: { ...horarios[dia], abre: e.target.value } })
                          }
                          className="h-8 px-3 bg-white border border-blue-200 rounded-lg text-gray-800 text-xs outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400 text-xs font-bold">→</span>
                        <input
                          type="time"
                          value={horarios[dia]?.fecha || "23:00"}
                          onChange={(e) =>
                            setHorarios({ ...horarios, [dia]: { ...horarios[dia], fecha: e.target.value } })
                          }
                          className="h-8 px-3 bg-white border border-blue-200 rounded-lg text-gray-800 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Fechado este dia</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={salvando}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando loja...
                </>
              ) : (
                "✨ Criar Loja"
              )}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}