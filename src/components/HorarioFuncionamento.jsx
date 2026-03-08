import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiClock, FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";

/* ===================== Configuração ===================== */
const DIAS_KEYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const DIAS_LABEL = {
  domingo: "Domingo",
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
};

/* ===================== Utilitários ===================== */
function toMin(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function nowInFortaleza() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
}

function getStatus(horarios) {
  const now = nowInFortaleza();
  const weekday = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const keyToday = DIAS_KEYS[weekday];
  const keyPrev = DIAS_KEYS[(weekday + 6) % 7];
  const today = horarios?.[keyToday];
  const prev = horarios?.[keyPrev];

  const tOpen = today?.abre ? toMin(today.abre) : null;
  const tClose = today?.fecha ? toMin(today.fecha) : null;
  const pOpen = prev?.abre ? toMin(prev.abre) : null;
  const pClose = prev?.fecha ? toMin(prev.fecha) : null;

  let extraMsg = "";

  // Caso sem horário hoje
  if (tOpen == null || tClose == null) {
    for (let i = 1; i <= 7; i++) {
      const idx = (weekday + i) % 7;
      const k = DIAS_KEYS[idx];
      const h = horarios?.[k];
      if (h?.abre && h?.fecha) {
        extraMsg = `Hoje não teremos atividades. Retornaremos ${DIAS_LABEL[k]} às ${h.abre}.`;
        break;
      }
    }
    return { open: false, labelHoje: DIAS_LABEL[keyToday], hojeAbre: null, hojeFecha: null, extraMsg };
  }

  // Aberto herdado da noite anterior
  if (pOpen != null && pClose != null && pClose <= pOpen) {
    if (minutes < pClose) {
      return { open: true, labelHoje: DIAS_LABEL[keyPrev], hojeAbre: prev.abre, hojeFecha: prev.fecha };
    }
  }

  // Janela normal
  if (tClose > tOpen) {
    if (minutes >= tOpen && minutes < tClose) {
      if (tClose - minutes <= 30) extraMsg = "⚠️ Logo mais encerraremos nossas atividades.";
      return { open: true, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    } else if (minutes < tOpen) {
      if (tOpen - minutes <= 30) extraMsg = "⏳ Logo mais iniciaremos nossas atividades.";
      return { open: false, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    }
  } else {
    if (minutes >= tOpen || minutes < tClose) {
      if (
        (minutes >= tOpen && 1440 - minutes + tClose <= 30) ||
        (minutes < tClose && tClose - minutes <= 30)
      ) {
        extraMsg = "⚠️ Logo mais encerraremos nossas atividades.";
      }
      return { open: true, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    } else if (minutes < tOpen) {
      if (tOpen - minutes <= 30) extraMsg = "⏳ Logo mais iniciaremos nossas atividades.";
      return { open: false, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    }
  }

  // Próximo dia
  for (let i = 1; i <= 7; i++) {
    const idx = (weekday + i) % 7;
    const k = DIAS_KEYS[idx];
    const h = horarios?.[k];
    if (h?.abre && h?.fecha) {
      return {
        open: false,
        nextDayOffset: i,
        nextDayLabel: DIAS_LABEL[k],
        nextOpenTime: h.abre,
        labelHoje: DIAS_LABEL[keyToday],
        hojeAbre: today?.abre,
        hojeFecha: today?.fecha,
      };
    }
  }

  return { open: false, labelHoje: DIAS_LABEL[keyToday], extraMsg };
}

/* ===================== Componente ===================== */
export default function HorarioFuncionamento({ lojaId = "daypizza" }) {
  const [horarios, setHorarios] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "lojas", lojaId, "config", "principal"));
        if (snap.exists()) {
          const data = snap.data();
          setHorarios(data.horarios || {});
        }
      } catch (err) {
        console.error("Erro ao buscar horários:", err);
      }
    })();
  }, [lojaId]);

  useEffect(() => {
    if (!horarios) return;
    setStatus(getStatus(horarios));
    const id = setInterval(() => setStatus(getStatus(horarios)), 60_000);
    return () => clearInterval(id);
  }, [horarios]);

  if (!status) {
    return (
      <div className="p-4 rounded-xl border bg-white shadow-sm text-gray-600 animate-pulse">
        Carregando horários...
      </div>
    );
  }

  const aberto = status.open;
  const hojeTexto =
    status.hojeAbre && status.hojeFecha
      ? `${status.hojeAbre} às ${status.hojeFecha}`
      : "Fechado hoje";

  let msgExtra = status.extraMsg || "";
  if (!aberto && !msgExtra) {
    if (status.nextDayOffset === 1) {
      msgExtra = `Amanhã estaremos de volta às ${status.nextOpenTime}.`;
    } else if (status.nextDayOffset > 1) {
      msgExtra = `Voltamos ${status.nextDayLabel} às ${status.nextOpenTime}.`;
    }
  }

  return (
    <div className="w-full flex items-center justify-center my-6">
      <div
        className={`max-w-md w-full rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-lg border transition-all ${
          aberto ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
        aria-live="polite"
      >
      <div className="flex items-center gap-4">
        <span
          className={`w-4 h-4 rounded-full ${aberto ? "bg-blue-500" : "bg-red-500"} animate-pulse`}
          aria-hidden="true"
        />
        <h3 className={`text-xl sm:text-2xl font-extrabold flex items-center gap-2 ${aberto ? "text-blue-800" : "text-red-800"}`}>
          {aberto ? (
            <>
              <FiCheckCircle className="text-2xl text-blue-600" /> Aberto agora
            </>
          ) : (
            <>
              <FiXCircle className="text-2xl text-red-600" /> Fechado agora
            </>
          )}
        </h3>
      </div>

      <div className="text-gray-800">
        <p className="text-sm sm:text-base flex items-center gap-2">
          <FiClock className="text-gray-500" aria-hidden="true" />
          <strong className="text-gray-900">Hoje ({status.labelHoje}):</strong>
          <span className="ml-1 text-lg font-semibold text-gray-800">{hojeTexto}</span>
        </p>
        {msgExtra && (
          <p
            className={`mt-3 text-sm ${
              msgExtra.includes("⚠️") || msgExtra.includes("⏳")
                ? "text-amber-700 bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2"
                : "text-gray-700"
            }`}
          >
            {(msgExtra.includes("⚠️") || msgExtra.includes("⏳")) && (
              <FiAlertTriangle className="inline text-amber-600" aria-hidden="true" />
            )}
            {msgExtra.replace(/[⏳]/g, "")}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
