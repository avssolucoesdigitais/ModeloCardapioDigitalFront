import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import useAuth from "../hooks/useAuth";
import toast from "react-hot-toast";

const DIAS_ORDENADOS = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terça" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export default function LojaConfigAdmin({ lojaId = "daypizza" }) {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("loja");
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    nomeLoja: "", logoUrl: "", bannerUrl: "",
    primaryColor: "#009DFF", secondaryColor: "#0C2340",
    whatsapp: "", instagram: "", bairros: [], cupons: [],
    horarios: Object.fromEntries(DIAS_ORDENADOS.map(d => [d.key, { abre: "", fecha: "" }])),
  });

  const [bairro, setBairro] = useState({ nome: "", taxa: "" });
  const [cupom, setCupom] = useState({ codigo: "", valor: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "lojas", lojaId, "config", "principal"));
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
    })();
  }, [user, lojaId]);

  const updateFirestore = async (newData) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "lojas", lojaId, "config", "principal"), newData, { merge: true });
      setConfig(newData);
      toast.success("Alteração salva!");
    } catch (e) { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-center font-bold">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configurações</h1>
        <p className="text-slate-500 font-medium">Personalize a identidade e logística da sua loja.</p>
      </header>

      {/* Tabs Estilizadas */}
      <nav className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl mb-8 w-fit">
        {[
          { id: "loja", label: "🏪 Identidade", icon: "🎨" },
          { id: "bairros", label: "🚚 Logística", icon: "📍" },
          { id: "horarios", label: "⏰ Funcionamento", icon: "🕒" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Identidade da Loja */}
      {activeTab === "loja" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="bg-blue-100 p-2 rounded-xl text-sm">✨</span> Visual da Marca
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <CustomInput label="Nome da Loja" value={config.nomeLoja} onChange={v => setConfig({...config, nomeLoja: v})} />
                <CustomInput label="Instagram" placeholder="@sualoja" value={config.instagram} onChange={v => setConfig({...config, instagram: v})} />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <ColorPicker label="Primária" value={config.primaryColor} onChange={v => setConfig({...config, primaryColor: v})} />
                  <ColorPicker label="Secundária" value={config.secondaryColor} onChange={v => setConfig({...config, secondaryColor: v})} />
                </div>
              </div>

              {/* Preview da Logo/Banner */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preview da Marca</label>
                <div className="relative h-40 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 group">
                  {config.bannerUrl ? (
                    <img src={config.bannerUrl} className="w-full h-full object-cover" />
                  ) : <div className="flex items-center justify-center h-full text-slate-400 text-xs">Sem Banner</div>}
                  <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-2xl shadow-xl p-1 border border-white">
                    <img src={config.logoUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-2">
                    <UploadBtn label="Mudar Logo" onUpload={url => setConfig({...config, logoUrl: url})} />
                    <UploadBtn label="Mudar Banner" onUpload={url => setConfig({...config, bannerUrl: url})} />
                </div>
              </div>
            </div>
          </section>

          {/* Seção de Cupons */}
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
               <span className="bg-amber-100 p-2 rounded-xl text-sm">🎟️</span> Cupons de Desconto
             </h2>
             <div className="flex gap-2 mb-6">
               <input type="text" placeholder="CÓDIGO" className="bg-slate-50 border-none rounded-xl p-3 text-sm font-bold flex-1" value={cupom.codigo} onChange={e => setCupom({...cupom, codigo: e.target.value.toUpperCase()})} />
               <input type="number" placeholder="R$ 0,00" className="bg-slate-50 border-none rounded-xl p-3 text-sm font-bold w-32" value={cupom.valor} onChange={e => setCupom({...cupom, valor: e.target.value})} />
               <button onClick={() => {
                 const novos = [...config.cupons, { ...cupom, valor: Number(cupom.valor) }];
                 updateFirestore({...config, cupons: novos});
                 setCupom({codigo: "", valor: ""});
               }} className="bg-slate-900 text-white px-6 rounded-xl font-black text-sm">+</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {config.cupons?.map(c => (
                 <div key={c.codigo} className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl flex items-center gap-3">
                   <span className="text-xs font-black text-amber-700">{c.codigo} • R$ {c.valor}</span>
                   <button onClick={() => updateFirestore({...config, cupons: config.cupons.filter(x => x.codigo !== c.codigo)})} className="text-amber-300 hover:text-amber-600">✕</button>
                 </div>
               ))}
             </div>
          </section>
          
          <button onClick={() => updateFirestore(config)} disabled={saving} className="fixed bottom-6 right-6 md:relative md:bottom-0 md:right-0 w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      )}

      {/* Aba Logística */}
      {activeTab === "bairros" && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in">
          <h2 className="text-lg font-black text-slate-800 mb-6">Taxas por Bairro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input type="text" placeholder="Nome do Bairro" className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" value={bairro.nome} onChange={e => setBairro({...bairro, nome: e.target.value})} />
            <input type="number" placeholder="Taxa R$" className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" value={bairro.taxa} onChange={e => setBairro({...bairro, taxa: e.target.value})} />
            <button onClick={() => {
               const novos = [...config.bairros, { ...bairro, taxa: Number(bairro.taxa) }];
               updateFirestore({...config, bairros: novos});
               setBairro({nome: "", taxa: ""});
            }} className="bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-100">Adicionar</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.bairros?.map(b => (
              <div key={b.nome} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                <div>
                  <p className="text-sm font-black text-slate-700">{b.nome}</p>
                  <p className="text-xs font-bold text-emerald-600">Taxa: R$ {b.taxa.toFixed(2)}</p>
                </div>
                <button onClick={() => updateFirestore({...config, bairros: config.bairros.filter(x => x.nome !== b.nome)})} className="p-2 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 text-rose-500 transition-all">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba Horários */}
      {activeTab === "horarios" && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in">
          <div className="space-y-3">
            {DIAS_ORDENADOS.map(dia => {
              const isClosed = !config.horarios[dia.key]?.abre;
              return (
                <div key={dia.key} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-3xl transition-all ${isClosed ? 'bg-slate-50 opacity-60' : 'bg-white border border-slate-100 shadow-sm'}`}>
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tighter w-24">{dia.label}</span>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <input type="time" value={config.horarios[dia.key]?.abre} onChange={e => setConfig({...config, horarios: {...config.horarios, [dia.key]: {...config.horarios[dia.key], abre: e.target.value}}})} className="bg-slate-100 border-none rounded-xl p-2 text-xs font-bold" />
                    <span className="text-[10px] font-black text-slate-400">ATÉ</span>
                    <input type="time" value={config.horarios[dia.key]?.fecha} onChange={e => setConfig({...config, horarios: {...config.horarios, [dia.key]: {...config.horarios[dia.key], fecha: e.target.value}}})} className="bg-slate-100 border-none rounded-xl p-2 text-xs font-bold" />
                    <button onClick={() => setConfig({...config, horarios: {...config.horarios, [dia.key]: {abre: "", fecha: ""}}})} className="ml-2 text-[10px] font-black text-rose-500 uppercase">Fechar</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => updateFirestore(config)} className="mt-8 w-full bg-slate-900 text-white p-4 rounded-2xl font-black">Salvar Grade de Horários</button>
        </div>
      )}
    </div>
  );
}

// Helpers
const CustomInput = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all" />
  </div>
);

const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
    <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
    <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-none" />
  </div>
);

const UploadBtn = ({ label, onUpload }) => (
  <label className="flex-1 text-center bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-50 transition-all">
    {label}
    <input type="file" className="hidden" onChange={async e => {
       const file = e.target.files[0];
       if(file) {
          toast.loading("Enviando...");
          // Aqui chamaria sua função uploadToCloudinary
          toast.dismiss();
       }
    }} />
  </label>
);