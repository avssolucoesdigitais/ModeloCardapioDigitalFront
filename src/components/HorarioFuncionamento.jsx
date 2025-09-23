import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Dias com labels corretos
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
  const weekday = now.getDay(); // 0 = domingo
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

  /// === CASO HOJE NÃO TENHA HORÁRIO CONFIGURADO ===
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

  // === CASO HOJE TENHA HORÁRIO ===

  // 1. Aberto herdado da noite anterior
  if (pOpen != null && pClose != null && pClose <= pOpen) {
    if (minutes < pClose) {
      return { open: true, labelHoje: DIAS_LABEL[keyPrev], hojeAbre: prev.abre, hojeFecha: prev.fecha };
    }
  }

  // 2. Janela normal de hoje
  if (tClose > tOpen) {
    // Exemplo: 18:00 às 23:00
    if (minutes >= tOpen && minutes < tClose) {
      if (tClose - minutes <= 30) {
        extraMsg = "⚠️ Logo mais encerraremos nossas atividades.";
      }
      return { open: true, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    } else if (minutes < tOpen) {
      // Ainda vai abrir hoje
      if (tOpen - minutes <= 30) {
        extraMsg = "⏳ Logo mais iniciaremos nossas atividades.";
      }
      return { open: false, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    }
  } else {
    // Exemplo: 18:00 às 02:00 (vira a meia-noite)
    if (minutes >= tOpen || minutes < tClose) {
      if (
        (minutes >= tOpen && 1440 - minutes + tClose <= 30) ||
        (minutes < tClose && tClose - minutes <= 30)
      ) {
        extraMsg = "⚠️ Logo mais encerraremos nossas atividades.";
      }
      return { open: true, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    } else if (minutes < tOpen) {
      if (tOpen - minutes <= 30) {
        extraMsg = "⏳ Logo mais iniciaremos nossas atividades.";
      }
      return { open: false, labelHoje: DIAS_LABEL[keyToday], hojeAbre: today.abre, hojeFecha: today.fecha, extraMsg };
    }
  }

  // 3. Já passou o horário de hoje → próximo dia
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
    return <div className="p-3 bg-white/80 rounded">Carregando horários...</div>;
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
    <div className="p-4 rounded-xl border shadow bg-white/90 text-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${aberto ? "bg-green-500" : "bg-red-500"}`} />
        <strong>{aberto ? "Aberto agora" : "Fechado agora"}</strong>
      </div>
      <div>
        <div>
          <strong>Hoje ({status.labelHoje}):</strong> {hojeTexto}
        </div>
        {msgExtra && <div className="mt-1">{msgExtra}</div>}
      </div>
    </div>
  );
}
