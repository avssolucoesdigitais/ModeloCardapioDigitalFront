import { useState, useEffect } from "react";
import logoLaCarta from "../assets/logo.icon.png";

// ─── Paleta Light ─────────────────────────────────────────────────────────────
const B   = "#2563eb";   // azul principal
const BH  = "#1d4ed8";   // azul hover
const BL  = "#dbeafe";   // azul clarinho (fundo suave)
const BS  = "#eff6ff";   // azul bem suave
const BD  = "#bfdbfe";   // azul borda
const BT  = "#1e40af";   // azul texto escuro
const BG  = "#ffffff";   // fundo branco puro
const BG2 = "#f8faff";   // fundo levemente azulado
const BG3 = "#f1f5f9";   // fundo cinza muito suave
const BR  = "#e2e8f0";   // borda cinza
const TX  = "#0f172a";   // texto principal quase preto
const TM  = "#475569";   // texto médio
const TD  = "#94a3b8";   // texto dimmed
const WH  = "#ffffff";

// ─── Dados ────────────────────────────────────────────────────────────────────

const etapas = [
  { num: "01", icon: "🏪", titulo: "A Avante cria sua loja",     desc: "Nossa equipe configura tudo: identidade visual, categorias e acesso ao painel. Você não precisa entender nada de tecnologia." },
  { num: "02", icon: "🍕", titulo: "Você cadastra seu cardápio", desc: "Adicione produtos, fotos, preços e categorias pelo painel admin de forma simples e visual — como preencher um formulário." },
  { num: "03", icon: "🔗", titulo: "Compartilhe o link",         desc: "Seu cardápio ganha um link único. Cole no WhatsApp, Instagram, bio, mesa ou onde quiser — sem app para baixar." },
  { num: "04", icon: "📲", titulo: "Receba pedidos ao vivo",     desc: "Clientes fazem o pedido no celular. Você acompanha tudo em tempo real no painel, com notificações sonoras." },
];

const clienteVantagens = [
  { icon: "📱", titulo: "Zero instalação",              desc: "O cliente abre o link no navegador do celular e o cardápio já está lá — sem app, sem cadastro obrigatório." },
  { icon: "🖼️", titulo: "Produtos com foto e detalhe", desc: "Cada item com imagem, nome, descrição, variações de tamanho e preço exibidos de forma clara e apetitosa." },
  { icon: "🗂️", titulo: "Categorias organizadas",      desc: "Pizza, hambúrguer, bebidas, sobremesas… tudo separado para o cliente achar o que quer em segundos." },
  { icon: "🛒", titulo: "Carrinho intuitivo",           desc: "Adicionar, remover e ajustar quantidades em um toque. Resumo com subtotal e botão de finalizar bem visível." },
  { icon: "⚡", titulo: "Rápido e responsivo",          desc: "Interface leve que carrega rápido mesmo em 4G simples — pensada para o dia a dia real do seu cliente." },
];

const adminVantagens = [
  { icon: "🛎️", titulo: "Pedidos em tempo real",    desc: "Acompanhe cada pedido ao vivo com status, itens, valor e hora — em um painel limpo e sem confusão." },
  { icon: "🍔", titulo: "Gestão de produtos",       desc: "Cadastre itens com foto, tamanhos, adicionais e bordas. Edite preços ou oculte produtos em segundos." },
  { icon: "🎛️", titulo: "Painéis do cardápio",      desc: "Configure como cada categoria aparece no cardápio digital, com adicionais e complementos personalizados." },
  { icon: "📊", titulo: "CRM — Análise de vendas",  desc: "Faturamento por dia, ticket médio, formas de pagamento e histórico. Exporte relatórios em PDF com um clique." },
  { icon: "🎨", titulo: "Configurações da loja",    desc: "Logo, banner, cores da marca, horários e logística de entrega — tudo personalizável pelo painel." },
  { icon: "🔔", titulo: "Notificações sonoras",     desc: "Ative alertas para nunca perder um pedido novo, mesmo com outras abas abertas." },
];

// ─── Mockup de celular (SVG light) ────────────────────────────────────────────

function PhoneMockup({ variant = "cardapio" }) {
  return (
    <svg viewBox="0 0 280 560" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%", height:"100%", display:"block" }}>
      {/* corpo */}
      <rect x="4" y="4" width="272" height="552" rx="38" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2"/>
      <rect x="10" y="10" width="260" height="540" rx="34" fill={WH}/>
      {/* notch */}
      <rect x="100" y="14" width="80" height="16" rx="8" fill="#e2e8f0"/>

      {variant === "home"     && <HomeScreen/>}
      {variant === "carrinho" && <CartScreen/>}
      {variant === "cardapio" && <CardapioScreen/>}

      {/* barra inferior */}
      <rect x="90" y="532" width="100" height="4" rx="2" fill="#e2e8f0"/>
    </svg>
  );
}

function HomeScreen() {
  return (
    <>
      {/* banner */}
      <rect x="14" y="36" width="252" height="88" rx="12" fill={B}/>
      <circle cx="60" cy="80" r="22" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <text x="60" y="87" textAnchor="middle" fontSize="20" fill={WH}>🍕</text>
      <text x="100" y="70" fontSize="13" fontWeight="700" fill={WH}>Day Pizza</text>
      <text x="100" y="86" fontSize="9" fill="rgba(255,255,255,0.7)">lacarta-seven.vercel.app</text>

      {/* aberto agora */}
      <rect x="14" y="132" width="252" height="34" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1"/>
      <circle cx="30" cy="149" r="5" fill="#22c55e"/>
      <text x="42" y="154" fontSize="11" fontWeight="700" fill="#16a34a">Aberto agora</text>
      <text x="162" y="154" fontSize="10" fill={TM}>07:05 – 21:10</text>

      {/* categorias */}
      <text x="14" y="192" fontSize="12" fontWeight="700" fill={TX}>Categorias</text>
      {[["🍕","Pizza","14"],["🥙","Calzone","76"],["🍔","Hambúrguer","138"],["🥐","Salgados","200"]].map(([ic,lb,x]) => (
        <g key={lb}>
          <rect x={parseInt(x)} y="200" width="52" height="52" rx="10" fill={BS} stroke={BD} strokeWidth="1"/>
          <text x={parseInt(x)+26} y="224" textAnchor="middle" fontSize="18">{ic}</text>
          <text x={parseInt(x)+26} y="241" textAnchor="middle" fontSize="8" fill={TM}>{lb}</text>
        </g>
      ))}

      {/* promoção */}
      <text x="14" y="278" fontSize="12" fontWeight="700" fill={TX}>Promoção</text>
      <rect x="14" y="286" width="252" height="72" rx="10" fill={BG2} stroke={BR} strokeWidth="1"/>
      <rect x="14" y="286" width="88" height="72" rx="10" fill={BL}/>
      <text x="58" y="330" textAnchor="middle" fontSize="26">🍕</text>
      <rect x="14" y="286" width="52" height="17" rx="6" fill="#ef4444"/>
      <text x="40" y="299" textAnchor="middle" fontSize="8" fontWeight="700" fill={WH}>PROMOÇÃO</text>
      <text x="115" y="308" fontSize="11" fontWeight="700" fill={TX}>Pizza Especial</text>
      <text x="115" y="322" fontSize="9" fill={TM}>Molho, mussarela,</text>
      <text x="115" y="334" fontSize="9" fill={TM}>ingredientes selecionados</text>
      <text x="115" y="349" fontSize="10" fontWeight="700" fill={B}>R$ 34,90</text>
      <rect x="238" y="338" width="24" height="24" rx="7" fill={B}/>
      <text x="250" y="355" textAnchor="middle" fontSize="16" fontWeight="700" fill={WH}>+</text>

      {/* pizza section */}
      <text x="14" y="388" fontSize="12" fontWeight="700" fill={TX}>Pizza</text>
      <rect x="14" y="396" width="116" height="118" rx="10" fill={WH} stroke={BR} strokeWidth="1"/>
      <text x="72" y="440" textAnchor="middle" fontSize="32">🍕</text>
      <text x="72" y="458" textAnchor="middle" fontSize="10" fontWeight="700" fill={TX}>Margherita</text>
      <text x="72" y="471" textAnchor="middle" fontSize="8" fill={TM}>Tomate e manjericão</text>
      <text x="72" y="485" textAnchor="middle" fontSize="9" fontWeight="700" fill={B}>R$ 29,90</text>
      <rect x="108" y="492" width="18" height="18" rx="5" fill={B}/>
      <text x="117" y="505" textAnchor="middle" fontSize="13" fill={WH}>+</text>

      <rect x="150" y="396" width="116" height="118" rx="10" fill={WH} stroke={BR} strokeWidth="1"/>
      <text x="208" y="440" textAnchor="middle" fontSize="32">🍕</text>
      <text x="208" y="458" textAnchor="middle" fontSize="10" fontWeight="700" fill={TX}>Calabresa</text>
      <text x="208" y="471" textAnchor="middle" fontSize="8" fill={TM}>Calabresa e cebola</text>
      <text x="208" y="485" textAnchor="middle" fontSize="9" fontWeight="700" fill={B}>R$ 29,90</text>
      <rect x="244" y="492" width="18" height="18" rx="5" fill={B}/>
      <text x="253" y="505" textAnchor="middle" fontSize="13" fill={WH}>+</text>
    </>
  );
}

function CardapioScreen() {
  return (
    <>
      {/* header */}
      <rect x="10" y="10" width="260" height="50" rx="0" fill={WH}/>
      <rect x="10" y="58" width="260" height="1" fill={BR}/>
      <circle cx="34" cy="35" r="14" fill={BS} stroke={BD} strokeWidth="1"/>
      <text x="34" y="41" textAnchor="middle" fontSize="14">🍕</text>
      <text x="58" y="31" fontSize="11" fontWeight="700" fill={TX}>Day Pizza</text>
      <text x="58" y="44" fontSize="8" fill={TM}>lacarta-seven.vercel.app</text>
      <rect x="212" y="22" width="28" height="26" rx="8" fill="#ef4444"/>
      <text x="226" y="40" textAnchor="middle" fontSize="15">🛒</text>
      <rect x="244" y="22" width="24" height="26" rx="8" fill={BG3}/>
      <text x="256" y="40" textAnchor="middle" fontSize="14">☰</text>

      {/* categoria label */}
      <rect x="14" y="72" width="4" height="20" rx="2" fill={B}/>
      <text x="26" y="87" fontSize="13" fontWeight="800" fill={TX}>Pizza</text>

      {[
        { y:100, nome:"Margherita",         desc1:"Molho de tomate, mussarela,", desc2:"tomate fresco e manjericão.", preco:"R$ 29,90" },
        { y:222, nome:"Calabresa",          desc1:"Molho de tomate, mussarela,", desc2:"calabresa fatiada e cebola.", preco:"R$ 29,90" },
        { y:344, nome:"Frango c/ Catupiry", desc1:"Molho de tomate, mussarela,", desc2:"frango desfiado e catupiry.", preco:"R$ 34,90" },
      ].map(item => (
        <g key={item.nome}>
          <rect x="14" y={item.y} width="252" height="112" rx="12" fill={WH} stroke={BR} strokeWidth="1"/>
          <rect x="16" y={item.y+2} width="96" height="108" rx="10" fill={BS}/>
          <text x="64" y={item.y+60} textAnchor="middle" fontSize="36">🍕</text>
          <rect x="14" y={item.y} width="40" height="17" rx="6" fill={BG3} stroke={BR} strokeWidth="1"/>
          <text x="34" y={item.y+12} textAnchor="middle" fontSize="8" fill={TM}>PIZZA</text>
          <text x="124" y={item.y+26} fontSize="11" fontWeight="700" fill={TX}>{item.nome}</text>
          <text x="124" y={item.y+40} fontSize="8" fill={TM}>{item.desc1}</text>
          <text x="124" y={item.y+52} fontSize="8" fill={TM}>{item.desc2}</text>
          <text x="124" y={item.y+70} fontSize="8" fill={TM}>A PARTIR DE</text>
          <text x="124" y={item.y+84} fontSize="12" fontWeight="800" fill={TX}>{item.preco}</text>
          <rect x="234" y={item.y+82} width="26" height="26" rx="8" fill={B}/>
          <text x="247" y={item.y+100} textAnchor="middle" fontSize="16" fontWeight="700" fill={WH}>+</text>
        </g>
      ))}
    </>
  );
}

function CartScreen() {
  return (
    <>
      {/* header */}
      <rect x="10" y="10" width="260" height="1" fill="transparent"/>
      <text x="38" y="54" fontSize="20">🛍️</text>
      <text x="66" y="50" fontSize="13" fontWeight="800" fill={TX}>Meu Carrinho</text>
      <text x="66" y="64" fontSize="9" fill={TM} letterSpacing="1">1 ITEM SELECIONADO</text>
      <rect x="238" y="36" width="28" height="28" rx="10" fill={BG3} stroke={BR} strokeWidth="1"/>
      <text x="252" y="55" textAnchor="middle" fontSize="14" fill={TM}>✕</text>
      <rect x="14" y="82" width="252" height="1" fill={BR}/>

      {/* item */}
      <rect x="14" y="94" width="252" height="112" rx="14" fill={WH} stroke={BR} strokeWidth="1"/>
      <rect x="24" y="104" width="76" height="76" rx="10" fill={BS}/>
      <text x="62" y="150" textAnchor="middle" fontSize="34">🍕</text>
      <text x="114" y="122" fontSize="12" fontWeight="700" fill={TX}>Margherita</text>
      <rect x="114" y="129" width="44" height="15" rx="5" fill={BL} stroke={BD} strokeWidth="1"/>
      <text x="136" y="141" textAnchor="middle" fontSize="8" fontWeight="700" fill={BT}>PEQUENA</text>
      <text x="114" y="160" fontSize="9" fill={TM}>Margherita</text>
      <rect x="114" y="168" width="76" height="26" rx="8" fill={BG3} stroke={BR} strokeWidth="1"/>
      <text x="126" y="186" textAnchor="middle" fontSize="14" fill={TM}>−</text>
      <text x="152" y="186" textAnchor="middle" fontSize="12" fontWeight="700" fill={TX}>1</text>
      <text x="178" y="186" textAnchor="middle" fontSize="14" fill={TM}>+</text>
      <text x="224" y="184" fontSize="12" fontWeight="700" fill={TX}>R$ 29,90</text>
      <text x="248" y="112" fontSize="14" fill={TD}>🗑</text>

      {/* totais */}
      <rect x="14" y="472" width="252" height="1" fill={BR}/>
      <text x="14" y="496" fontSize="11" fill={TM}>Subtotal</text>
      <text x="252" y="496" textAnchor="end" fontSize="11" fill={TM}>R$ 29,90</text>
      <text x="14" y="516" fontSize="13" fontWeight="800" fill={TX}>Total</text>
      <text x="252" y="516" textAnchor="end" fontSize="14" fontWeight="800" fill="#16a34a">R$ 29,90</text>

      {/* botão finalizar */}
      <rect x="14" y="524" width="252" height="40" rx="18" fill={TX}/>
      <text x="108" y="549" fontSize="12" fontWeight="700" fill={WH}>Finalizar Pedido</text>
      <rect x="192" y="524" width="1" height="40" fill="rgba(255,255,255,0.2)"/>
      <text x="228" y="549" fontSize="11" fontWeight="600" fill="rgba(255,255,255,0.7)">R$ 29,90</text>
    </>
  );
}

// ─── Mockup admin (light) ─────────────────────────────────────────────────────

function AdminMockup({ tab }) {
  return (
    <div style={adm.wrap}>
      {/* sidebar */}
      <div style={adm.sidebar}>
        <div style={adm.sidebarLogo}>
          <span style={{ fontSize:18 }}>🗒️</span>
          <span style={adm.sidebarName}>LA-CARTA</span>
        </div>
        {[
          ["🛎️","Pedidos",  tab==="pedidos"],
          ["🍕","Produtos", tab==="produtos"],
          ["🎛️","Painéis",  tab==="paineis"],
          ["📊","CRM",      tab==="crm"],
          ["⚙️","Config.",  tab==="config"],
        ].map(([ic,lb,active]) => (
          <div key={lb} style={{ ...adm.sideItem, ...(active ? adm.sideActive : {}) }}>
            <span style={{ fontSize:14 }}>{ic}</span>
            <span style={{ ...adm.sideLabel, ...(active ? { color:WH } : {}) }}>{lb}</span>
          </div>
        ))}
        <div style={adm.sideFooter}>
          <div style={adm.sideFooterLabel}>DESENVOLVIDO POR</div>
          <div style={adm.sideFooterBrand}>Avante Software</div>
        </div>
      </div>
      {/* main */}
      <div style={adm.main}>
        <div style={adm.topbar}>
          <span style={adm.breadcrumb}>Painel Administrativo &rsaquo; <strong>{tab}</strong></span>
          <span style={adm.online}><span style={adm.onlineDot}/>Sistema Online</span>
        </div>
        {tab === "pedidos"  && <PedidosContent/>}
        {tab === "produtos" && <ProdutosContent/>}
        {tab === "paineis"  && <PaineisContent/>}
        {tab === "crm"      && <CrmContent/>}
        {tab === "config"   && <ConfigContent/>}
      </div>
    </div>
  );
}

function PedidosContent() {
  return (
    <div style={adm.content}>
      <div style={adm.pageHeader}>
        <div>
          <h3 style={adm.pageTitle}>Painel de pedidos</h3>
          <p style={adm.pageSubtitle}>Gestão de pedidos em tempo real</p>
        </div>
        <div style={adm.notifBtn}>🔔 Notificações Ligadas</div>
      </div>
      <div style={adm.metricsRow}>
        {[
          ["TOTAL HOJE","0",B,"#eff6ff","#bfdbfe"],
          ["FINALIZADOS","0","#16a34a","#f0fdf4","#bbf7d0"],
          ["FATURAMENTO","R$ 0,00","#7c3aed","#faf5ff","#e9d5ff"],
          ["TICKET MÉDIO","R$ 0,00","#db2777","#fdf2f8","#fbcfe8"],
        ].map(([lb,val,cor,bg,bor]) => (
          <div key={lb} style={{...adm.metricCard, background:bg, borderColor:bor}}>
            <div style={{...adm.metricLabel, color:cor}}>{lb}</div>
            <div style={{...adm.metricVal, color:cor}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={adm.sectionLabel}>📌 Pedidos em Aberto <span style={adm.badge0}>0</span></div>
      <div style={adm.emptyState}>Nenhum pedido em aberto no momento.</div>
    </div>
  );
}

function ProdutosContent() {
  const cats = [
    ["🍕","PIZZA",true],["🥙","CALZONE",false],["🥗","ESFIHA",false],
    ["🍔","HAMBÚRGUER",false],["🥐","PASTEL",false],["🍟","BATATA FRITA",false],
    ["🥤","BEBIDAS",false],["🥨","SALGADOS",false],["🍰","BOLOS",false],
  ];
  return (
    <div style={adm.content}>
      <div style={adm.catsGrid}>
        {cats.map(([ic,lb,active]) => (
          <div key={lb} style={{...adm.catCard, ...(active ? adm.catActive : {})}}>
            <span style={{ fontSize:22 }}>{ic}</span>
            <span style={{...adm.catLabel, ...(active ? {color:WH} : {})}}>{lb}</span>
          </div>
        ))}
      </div>
      <div style={adm.divider}><span>EDITANDO PIZZA</span></div>
      <div style={adm.prodForm}>
        <div style={adm.prodFormTitle}>🍕 Novo Pizza</div>
        <div style={adm.formRow}>
          <div style={adm.formField}>
            <div style={adm.fieldLabel}>Nome</div>
            <div style={adm.fieldInput}></div>
          </div>
          <div style={adm.formField}>
            <div style={adm.fieldLabel}>Tamanhos e Preços</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {["P","M","G","GG","Único","Portinho","Família"].map(s => (
                <div key={s} style={adm.sizeChip}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaineisContent() {
  const paineis = [
    {ic:"🍕",nome:"Pizza",     tags:["tradicional","especial","doce","Tamanhos","Bordas Recheadas","Adicionais Extras"]},
    {ic:"🥙",nome:"Calzone",   tags:["calzone","Tamanhos","Bases","Bordas","Adicionais"]},
    {ic:"🥗",nome:"Esfiha",    tags:["tradicional","especial","doce","Tamanhos","Complementos de Esfiha"]},
    {ic:"🍔",nome:"Hambúrguer",tags:["tradicional","especial","combo","Tamanhos","Extras & Toppings"]},
  ];
  return (
    <div style={adm.content}>
      <div style={adm.pageHeader}>
        <div>
          <h3 style={adm.pageTitle}>Painéis do Cardápio</h3>
          <p style={adm.pageSubtitle}>Arraste para reordenar · 11 painel(is) configurado(s)</p>
        </div>
        <div style={{...adm.notifBtn, background:"#fff7ed", borderColor:"#fed7aa", color:"#ea580c"}}>+ Novo Painel</div>
      </div>
      {paineis.map(p => (
        <div key={p.nome} style={adm.painelRow}>
          <span style={{ fontSize:16, marginRight:10 }}>{p.ic}</span>
          <span style={adm.painelNome}>{p.nome}</span>
          <div style={adm.painelTags}>
            {p.tags.map(t => (
              <span key={t} style={{...adm.tagChip, ...(t==="Tamanhos" ? adm.tagBlue : {})}}>{t}</span>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            {["✓","✏","✕"].map(ic => <span key={ic} style={adm.iconBtn}>{ic}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CrmContent() {
  return (
    <div style={adm.content}>
      <div style={adm.pageHeader}>
        <div>
          <h3 style={adm.pageTitle}>CRM — Análise de Vendas</h3>
          <p style={adm.pageSubtitle}>Visão estratégica do desempenho do negócio</p>
        </div>
        <div style={{...adm.notifBtn, background:TX, borderColor:TX, color:WH}}>⬇ EXPORTAR PDF</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {["7 DIAS","30 DIAS","90 DIAS","PERSONALIZADO"].map((lb,i) => (
          <div key={lb} style={{...adm.periodBtn, ...(i===1 ? adm.periodActive : {})}}>{lb}</div>
        ))}
      </div>
      <div style={adm.metricsRow}>
        {[
          ["FATURAMENTO","R$ 1.341,80","#16a34a","#f0fdf4","#bbf7d0"],
          ["PEDIDOS","33",B,"#eff6ff","#bfdbfe"],
          ["TICKET MÉDIO","R$ 40,66","#7c3aed","#faf5ff","#e9d5ff"],
          ["ITENS/PEDIDO","1.5","#d97706","#fffbeb","#fde68a"],
        ].map(([lb,val,cor,bg,bor]) => (
          <div key={lb} style={{...adm.metricCard, background:bg, borderColor:bor}}>
            <div style={{...adm.metricLabel, color:cor}}>{lb}</div>
            <div style={{...adm.metricVal, color:cor}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={adm.chartWrap}>
        <div style={adm.chartTitle}>📈 Faturamento por dia</div>
        <svg viewBox="0 0 400 80" style={{ width:"100%", height:80 }}>
          <defs>
            <linearGradient id="crmGradL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={B} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={B} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polyline points="0,70 40,65 80,50 120,45 160,22 200,6 240,32 280,55 320,60 360,58 400,62"
            fill="none" stroke={B} strokeWidth="2.5" strokeLinejoin="round"/>
          <polyline points="0,70 40,65 80,50 120,45 160,22 200,6 240,32 280,55 320,60 360,58 400,62 400,80 0,80"
            fill="url(#crmGradL)"/>
        </svg>
      </div>
    </div>
  );
}

function ConfigContent() {
  return (
    <div style={adm.content}>
      <h3 style={adm.pageTitle}>Configurações</h3>
      <p style={{...adm.pageSubtitle, marginBottom:14}}>Personalize a identidade e logística da sua loja.</p>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {["🏷️ Identidade","🚚 Logística","🕐 Funcionamento"].map((lb,i) => (
          <div key={lb} style={{...adm.periodBtn, ...(i===0 ? adm.periodActive : {})}}>{lb}</div>
        ))}
      </div>
      <div style={adm.configCard}>
        <div style={adm.configTitle}>✨ Visual da Marca</div>
        <div style={adm.formRow}>
          <div style={{ flex:1 }}>
            <div style={adm.fieldLabel}>NOME DA LOJA</div>
            <div style={adm.fieldInput2}>Day Pizza</div>
            <div style={{...adm.fieldLabel, marginTop:10}}>INSTAGRAM</div>
            <div style={adm.fieldInput2}>https://www.instagram.com/sasp_dev/</div>
            <div style={{ display:"flex", gap:14, marginTop:10 }}>
              <div>
                <div style={adm.fieldLabel}>PRIMÁRIA</div>
                <div style={{ width:30, height:30, background:"#111", borderRadius:6, border:"1px solid #e2e8f0" }}/>
              </div>
              <div>
                <div style={adm.fieldLabel}>SECUNDÁRIA</div>
                <div style={{ width:30, height:30, background:"#ef4444", borderRadius:6 }}/>
              </div>
            </div>
          </div>
          <div style={adm.configPreview}>
            <div style={adm.previewLabel}>PREVIEW DA MARCA</div>
            <div style={adm.previewBox}>
              <span style={{ fontSize:28 }}>🍕</span>
              <span style={{ fontSize:12, fontWeight:700, color:WH, textAlign:"center" }}>Day Pizza Express</span>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <div style={adm.mudarBtn}>MUDAR LOGO</div>
              <div style={adm.mudarBtn}>MUDAR BANNER</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos Admin (light) ────────────────────────────────────────────────────
const adm = {
  wrap:         { display:"flex", height:"100%", minHeight:390, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12 },
  sidebar:      { width:175, background:TX, borderRight:"none", display:"flex", flexDirection:"column", padding:"16px 0", flexShrink:0 },
  sidebarLogo:  { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"0 12px 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", marginBottom:8 },
  sidebarName:  { fontSize:10, fontWeight:900, letterSpacing:"2px", color:WH },
  sideItem:     { display:"flex", alignItems:"center", gap:8, padding:"8px 16px", cursor:"pointer", margin:"2px 8px", borderRadius:8, transition:"background .2s" },
  sideActive:   { background:B },
  sideLabel:    { fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.55)" },
  sideFooter:   { marginTop:"auto", padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,0.1)" },
  sideFooterLabel: { fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:2 },
  sideFooterBrand: { fontSize:11, fontWeight:700, color:BL },
  main:         { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:BG },
  topbar:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 16px", borderBottom:`1px solid ${BR}`, background:BG2 },
  breadcrumb:   { fontSize:11, color:TM },
  online:       { display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#16a34a" },
  onlineDot:    { width:6, height:6, borderRadius:"50%", background:"#22c55e" },
  content:      { padding:"14px 16px", flex:1, overflowY:"auto", background:BG },
  pageHeader:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 },
  pageTitle:    { fontSize:15, fontWeight:800, color:TX, marginBottom:2 },
  pageSubtitle: { fontSize:10, color:TM },
  notifBtn:     { fontSize:10, fontWeight:700, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", padding:"6px 10px", borderRadius:8, whiteSpace:"nowrap" },
  metricsRow:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 },
  metricCard:   { borderRadius:10, padding:"10px 12px", border:"1px solid" },
  metricLabel:  { fontSize:8, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:4 },
  metricVal:    { fontSize:18, fontWeight:900 },
  sectionLabel: { fontSize:11, fontWeight:700, color:TX, marginBottom:8, display:"flex", alignItems:"center", gap:6 },
  badge0:       { background:"#f97316", color:WH, borderRadius:100, padding:"1px 6px", fontSize:9, fontWeight:700 },
  emptyState:   { fontSize:11, color:TD, textAlign:"center", padding:"20px 0" },
  catsGrid:     { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:14 },
  catCard:      { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 6px", background:BG2, border:`1px solid ${BR}`, borderRadius:10, cursor:"pointer" },
  catActive:    { background:B, borderColor:B },
  catLabel:     { fontSize:8, fontWeight:700, color:TM, letterSpacing:"0.5px" },
  divider:      { textAlign:"center", fontSize:9, color:TD, letterSpacing:"1px", borderTop:`1px solid ${BR}`, paddingTop:8, marginBottom:10 },
  prodForm:     { background:BG2, border:`1px solid ${BR}`, borderRadius:10, padding:"12px" },
  prodFormTitle:{ fontSize:12, fontWeight:700, color:TX, marginBottom:10 },
  formRow:      { display:"flex", gap:16, flexWrap:"wrap" },
  formField:    { flex:1, minWidth:120 },
  fieldLabel:   { fontSize:9, color:TD, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:4 },
  fieldInput:   { height:24, background:WH, border:`1px solid ${BR}`, borderRadius:6 },
  fieldInput2:  { fontSize:11, color:TX, background:WH, border:`1px solid ${BR}`, borderRadius:6, padding:"5px 8px" },
  sizeChip:     { fontSize:9, padding:"3px 7px", background:WH, border:`1px solid ${BR}`, borderRadius:4, color:TM },
  painelRow:    { display:"flex", alignItems:"center", background:BG2, border:`1px solid ${BR}`, borderRadius:10, padding:"10px 12px", marginBottom:6 },
  painelNome:   { fontSize:12, fontWeight:700, color:TX, marginRight:10, minWidth:80 },
  painelTags:   { display:"flex", gap:4, flexWrap:"wrap", flex:1 },
  tagChip:      { fontSize:8, padding:"2px 6px", background:WH, border:`1px solid ${BR}`, borderRadius:4, color:TM },
  tagBlue:      { background:BL, borderColor:BD, color:BT },
  iconBtn:      { fontSize:12, color:TD, cursor:"pointer" },
  chartWrap:    { background:BG2, border:`1px solid ${BR}`, borderRadius:10, padding:"12px" },
  chartTitle:   { fontSize:11, fontWeight:700, color:TX, marginBottom:8 },
  periodBtn:    { fontSize:9, padding:"4px 8px", background:BG2, border:`1px solid ${BR}`, borderRadius:6, color:TM, cursor:"pointer", fontWeight:500 },
  periodActive: { background:TX, border:`1px solid ${TX}`, color:WH, fontWeight:700 },
  configCard:   { background:BG2, border:`1px solid ${BR}`, borderRadius:10, padding:"14px" },
  configTitle:  { fontSize:12, fontWeight:700, color:TX, marginBottom:12 },
  configPreview:{ minWidth:160 },
  previewLabel: { fontSize:8, color:TD, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:6 },
  previewBox:   { background:TX, borderRadius:8, padding:"14px 16px", display:"flex", flexDirection:"column", gap:6, alignItems:"center" },
  mudarBtn:     { fontSize:9, padding:"5px 8px", background:WH, border:`1px solid ${BR}`, borderRadius:6, color:TX, cursor:"pointer" },
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [tabAdmin,   setTabAdmin]    = useState("pedidos");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const ir = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAberto(false);
  };

  const tabs = [
    { key:"pedidos",  label:"Pedidos"  },
    { key:"produtos", label:"Produtos" },
    { key:"paineis",  label:"Painéis"  },
    { key:"crm",      label:"CRM"      },
    { key:"config",   label:"Config."  },
  ];

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navSolid : {}) }}>
        <div style={s.navWrap}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:"auto" }}>
            <img src={logoLaCarta} alt="LaCarta" style={{ height: 36, display: "block" }} />
            <span style={s.logo} >La<span style={s.acc}>Carta</span></span>
          </div>
          <div className="nl" style={s.navLinks}>
            {[["funciona","Como funciona"],["cliente","Para clientes"],["admin","Para donos"],["contato","Contato"]].map(([id,lb]) => (
              <button key={id} onClick={() => ir(id)} style={s.navBtn} className="navbtn">{lb}</button>
            ))}
          </div>
          <a href="https://wa.me/5585921926083" target="_blank" rel="noreferrer" style={s.navCta} className="navcta">
            Quero meu cardápio
          </a>
          <button onClick={() => setMenuAberto(!menuAberto)} style={s.burger} className="brg">
            {menuAberto ? "✕" : "☰"}
          </button>
        </div>
        {menuAberto && (
          <div style={s.mobileMenu}>
            {[["funciona","Como funciona"],["cliente","Para clientes"],["admin","Para donos"],["contato","Contato"]].map(([id,lb]) => (
              <button key={id} onClick={() => ir(id)} style={s.mobileBtn}>{lb}</button>
            ))}
            <a href="https://wa.me/5585921926083" target="_blank" rel="noreferrer" style={s.mobileCta}>
              💬 Falar com a Avante
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroBlob1}/><div style={s.heroBlob2}/>
        <div style={s.heroGrid}>
          <div style={s.heroText}>
            <div style={s.badge}><span style={s.badgeDot}/> Desenvolvido pela Avante Software</div>
            <h1 style={s.h1}>
              O cardápio digital<br/>
              <span style={s.h1acc}>que vende por você</span>
            </h1>
            <p style={s.heroP}>
              Seu restaurante com um cardápio moderno no celular do cliente,
              pedidos organizados no painel e dados para crescer —
              tudo configurado pela Avante, tudo no seu link.
            </p>
            <div style={s.heroActions}>
              <a href="https://wa.me/5585921926083" target="_blank" rel="noreferrer" style={s.btnPrimary}>
                💬 Falar com a Avante
              </a>
              <button onClick={() => ir("funciona")} style={s.btnGhost}>Ver como funciona ↓</button>
            </div>
            <div style={s.heroStats}>
              {[["100%","Web, sem app"],["Ao vivo","Pedidos em tempo real"],["∞","Atualizações"]].map(([v,l]) => (
                <div key={l} style={s.hstat}>
                  <strong style={s.hstatV}>{v}</strong>
                  <span style={s.hstatL}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 phones */}
          <div style={s.heroPhones}>
            <div style={{ ...s.phoneShell, ...s.phoneBk }} className="fl-slow">
              <PhoneMockup variant="cardapio"/>
            </div>
            <div style={{ ...s.phoneShell, ...s.phoneFt }} className="fl-fast">
              <PhoneMockup variant="home"/>
            </div>
            <div style={{ ...s.phoneShell, ...s.phoneTc }} className="fl-med">
              <PhoneMockup variant="carrinho"/>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────── */}
      <section id="funciona" style={s.sec}>
        <div style={s.cnt}>
          <span style={s.tag}>Processo</span>
          <h2 style={s.h2}>Como o LaCarta funciona</h2>
          <p style={s.secP}>A Avante Software cuida de toda a parte técnica. Você só precisa abrir o painel e começar a vender.</p>
          <div style={s.stepsGrid}>
            {etapas.map((e,i) => (
              <div key={i} style={s.stepCard} className="ch">
                <div style={s.stepN}>{e.num}</div>
                <div style={s.stepIcon}>{e.icon}</div>
                <h3 style={s.stepT}>{e.titulo}</h3>
                <p style={s.stepD}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA O CLIENTE ───────────────────────────────────────────────── */}
      <section id="cliente" style={{ ...s.sec, background: BG2 }}>
        <div style={s.cnt}>
          <span style={s.tag}>Para quem faz o pedido</span>
          <h2 style={s.h2}>Experiência que encanta<br/>o seu cliente</h2>
          <p style={s.secP}>Do primeiro acesso ao pedido finalizado — tudo fluido, rápido e sem complicação.</p>
          <div style={s.cliLayout}>
            <div style={s.cliPhones}>
              <div style={{ ...s.cliPh, marginRight:-16, zIndex:1, marginTop:40 }} className="fl-slow">
                <PhoneMockup variant="home"/>
              </div>
              <div style={{ ...s.cliPh, zIndex:3 }} className="fl-fast">
                <PhoneMockup variant="cardapio"/>
              </div>
              <div style={{ ...s.cliPh, marginLeft:-16, zIndex:1, marginTop:24 }} className="fl-med">
                <PhoneMockup variant="carrinho"/>
              </div>
            </div>
            <div style={s.cliBullets}>
              {clienteVantagens.map((v,i) => (
                <div key={i} style={s.bullet} className="ch">
                  <div style={s.bulletIc}>{v.icon}</div>
                  <div>
                    <div style={s.bulletT}>{v.titulo}</div>
                    <div style={s.bulletD}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA O DONO ──────────────────────────────────────────────────── */}
      <section id="admin" style={s.sec}>
        <div style={s.cnt}>
          <span style={s.tag}>Para o dono do negócio</span>
          <h2 style={s.h2}>Painel completo para<br/>gerir sua loja</h2>
          <p style={s.secP}>Um painel administrativo poderoso com tudo que você precisa para operar, analisar e crescer.</p>

          <div style={s.tabs}>
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTabAdmin(tb.key)}
                style={{ ...s.tabBtn, ...(tabAdmin===tb.key ? s.tabActive : {}) }}>
                {tb.label}
              </button>
            ))}
          </div>

          <div style={s.deskWrap} className="ch">
            <div style={s.deskBar}>
              <span style={{ ...s.dot, background:"#ef4444" }}/>
              <span style={{ ...s.dot, background:"#f59e0b" }}/>
              <span style={{ ...s.dot, background:"#22c55e" }}/>
              <span style={s.deskUrl}>lacarta-seven.vercel.app / {tabAdmin}</span>
            </div>
            <div key={tabAdmin} className="fade-in" style={s.deskContent}>
              <AdminMockup tab={tabAdmin}/>
            </div>
          </div>

          <div style={s.admCards}>
            {adminVantagens.map((v,i) => (
              <div key={i} style={s.admCard} className="ch">
                <div style={s.admIc}>{v.icon}</div>
                <div style={s.admT}>{v.titulo}</div>
                <div style={s.admD}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTE ───────────────────────────────────────────────────────── */}
      <section style={{ ...s.sec, background: BG2 }}>
        <div style={s.cnt}>
          <div style={s.avanteWrap}>
            <div style={s.avanteText}>
              <span style={s.tag}>Quem está por trás</span>
              <h2 style={s.h2}>Avante Software</h2>
              <p style={{ ...s.secP, marginBottom:16 }}>
                Somos uma startup focada na{" "}
                <strong style={{ color:TX }}>digitalização de pequenas e médias empresas</strong>.
                Desenvolvemos o LaCarta para que restaurantes, bares e lanchonetes tenham
                acesso a tecnologia de verdade — sem precisar de equipe de TI.
              </p>
              <p style={{ ...s.secP, marginBottom:36 }}>
                Nossa equipe configura sua loja do zero, deixa tudo pronto e oferece suporte
                para que você foque no que importa: o seu negócio.
              </p>
              <a href="https://wa.me/5585921926083" target="_blank" rel="noreferrer" style={s.btnPrimary}>
                💬 Falar com a Avante
              </a>
            </div>
            <div style={s.avanteCards}>
              {[
                ["🚀","Criamos sua loja","Configuramos tudo do zero para você — da logo ao primeiro pedido."],
                ["🔧","Suporte contínuo","Nossa equipe está sempre disponível para ajudar no que precisar."],
                ["📈","Foco em PMEs","Tecnologia acessível para quem mais precisa crescer."],
              ].map(([ic,t,d],i) => (
                <div key={i} style={s.avCard} className="ch">
                  <div style={s.avIc}>{ic}</div>
                  <div style={s.avT}>{t}</div>
                  <div style={s.avD}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section id="contato" style={s.ctaSec}>
        <div style={s.ctaInner}>
          <div style={s.ctaBlob1}/><div style={s.ctaBlob2}/>
          <div style={s.ctaBox}>
            <div style={s.ctaIc}>🚀</div>
            <h2 style={s.ctaH2}>Pronto para digitalizar<br/>seu estabelecimento?</h2>
            <p style={s.ctaP}>
              Fale agora com a Avante Software e receba seu cardápio digital LaCarta
              configurado e pronto para uso.
            </p>
            <a href="https://wa.me/5585921926083?text=Oi!%20Quero%20criar%20meu%20cardápio%20digital%20no%20LaCarta"
              target="_blank" rel="noreferrer" style={s.ctaBtn}>
              💬 Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.cnt}>
          <div style={s.footerRow}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: 8 }}>
                <img src={logoLaCarta} alt="LaCarta" style={{ height: 32, display: "block" }} />
                <span style={s.logo} >La<span style={s.acc}>Carta</span></span>
              </div>
              <div style={s.ftSub}>Cardápio digital</div>
              <div style={s.ftBy}>Desenvolvido por <span style={s.ftAv}>Avante Software </span>
              </div>
            </div>
            <div style={s.ftLinks}>
              {[["funciona","Como funciona"],["cliente","Para clientes"],["admin","Para donos"],["contato","Contato"]].map(([id,lb]) => (
                <button key={id} onClick={() => ir(id)} style={s.ftLink}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={s.ftLine}/>
          <p style={s.ftCopy}>© {new Date().getFullYear()} Avante Software. <br />Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Estilos principais (light) ───────────────────────────────────────────────
const s = {
  root:    { fontFamily:"'Plus Jakarta Sans',sans-serif", background:BG, color:TX, minHeight:"100vh", overflowX:"hidden" },

  nav:     { position:"fixed", top:0, left:0, right:0, zIndex:100, transition:"all .3s" },
  navSolid:{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${BR}`, boxShadow:"0 1px 20px rgba(0,0,0,0.06)" },
  navWrap: { maxWidth:1160, margin:"0 auto", padding:"18px 24px", display:"flex", alignItems:"center", gap:8 },
  logo:    { fontSize:22, fontWeight:900, letterSpacing:"-0.5px", color:TX },
  acc:     { color:B },
  navLinks:{ display:"flex", gap:2 },
  navBtn:  { background:"none", border:"none", color:TM, fontSize:14, fontWeight:500, padding:"8px 14px", cursor:"pointer", borderRadius:8, transition:"color .2s" },
  navCta:  { background:B, color:WH, fontSize:13, fontWeight:700, padding:"9px 20px", borderRadius:8, textDecoration:"none", marginLeft:8, whiteSpace:"nowrap", boxShadow:"0 2px 12px rgba(37,99,235,.3)" },
  burger:  { display:"none", background:"none", border:"none", color:TX, fontSize:20, cursor:"pointer" },
  mobileMenu: { display:"flex", flexDirection:"column", background:WH, borderTop:`1px solid ${BR}`, padding:"16px 24px 24px", gap:4, boxShadow:"0 8px 24px rgba(0,0,0,0.08)" },
  mobileBtn:  { background:"none", border:"none", color:TM, fontSize:15, fontWeight:500, padding:"12px 0", cursor:"pointer", textAlign:"left", borderBottom:`1px solid ${BR}` },
  mobileCta:  { display:"block", background:B, color:WH, textAlign:"center", padding:"14px", borderRadius:10, textDecoration:"none", fontWeight:700, marginTop:12 },

  hero:      { minHeight:"100vh", display:"flex", alignItems:"center", position:"relative", padding:"120px 24px 80px", overflow:"hidden", background:`linear-gradient(160deg, ${BS} 0%, ${WH} 60%)` },
  heroBlob1: { position:"absolute", top:"0%", right:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 65%)", pointerEvents:"none" },
  heroBlob2: { position:"absolute", bottom:"-15%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.05) 0%,transparent 65%)", pointerEvents:"none" },
  heroGrid:  { maxWidth:1160, margin:"0 auto", width:"100%", display:"flex", alignItems:"center", gap:48, flexWrap:"wrap", position:"relative", zIndex:1 },
  heroText:  { flex:"1 1 420px" },
  badge:     { display:"inline-flex", alignItems:"center", gap:8, background:BL, border:`1px solid ${BD}`, borderRadius:100, padding:"6px 16px", fontSize:12, fontWeight:700, color:BT, letterSpacing:"0.3px", marginBottom:28, textTransform:"uppercase" },
  badgeDot:  { width:6, height:6, borderRadius:"50%", background:B, animation:"pulse 2s infinite" },
  h1:        { fontSize:"clamp(36px,5vw,60px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-2px", color:TX, marginBottom:22 },
  h1acc:     { color:B, display:"block" },
  heroP:     { fontSize:17, lineHeight:1.75, color:TM, maxWidth:480, marginBottom:36 },
  heroActions:{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:40 },
  btnPrimary: { background:B, color:WH, fontSize:15, fontWeight:700, padding:"13px 28px", borderRadius:10, textDecoration:"none", display:"inline-block", boxShadow:"0 4px 16px rgba(37,99,235,.35)", transition:"background .2s, transform .15s" },
  btnGhost:   { background:WH, color:TM, fontSize:15, fontWeight:500, padding:"13px 24px", borderRadius:10, border:`1px solid ${BR}`, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,.06)" },
  heroStats:  { display:"flex", gap:32, flexWrap:"wrap" },
  hstat:     { display:"flex", flexDirection:"column", gap:2 },
  hstatV:    { fontSize:22, fontWeight:900, color:TX, letterSpacing:"-0.5px" },
  hstatL:    { fontSize:12, color:TM, fontWeight:500 },

  heroPhones: { flex:"0 0 auto", display:"flex", alignItems:"flex-end", position:"relative" },
  phoneShell: { flexShrink:0 },
  phoneBk:    { width:155, height:318, transform:"rotate(-7deg) translateX(28px)", zIndex:1, opacity:.65 },
  phoneFt:    { width:185, height:380, transform:"rotate(2deg)", zIndex:3 },
  phoneTc:    { width:145, height:298, transform:"rotate(7deg) translateX(-24px)", zIndex:1, opacity:.65, marginTop:40 },

  sec:     { padding:"96px 24px", background:BG },
  cnt:     { maxWidth:1160, margin:"0 auto" },
  tag:     { display:"inline-block", fontSize:11, fontWeight:800, letterSpacing:"2px", textTransform:"uppercase", color:B, background:BL, border:`1px solid ${BD}`, borderRadius:100, padding:"4px 14px", marginBottom:18 },
  h2:      { fontSize:"clamp(28px,4vw,44px)", fontWeight:900, letterSpacing:"-1.5px", lineHeight:1.15, color:TX, marginBottom:14 },
  secP:    { fontSize:16, color:TM, lineHeight:1.75, maxWidth:560, marginBottom:52 },

  stepsGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 },
  stepCard: { background:WH, border:`1px solid ${BR}`, borderRadius:16, padding:"28px 24px", transition:"border-color .2s,transform .2s,box-shadow .2s", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  stepN:    { fontSize:42, fontWeight:900, lineHeight:1, marginBottom:8, background:`linear-gradient(135deg,${B},#60a5fa)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  stepIcon: { fontSize:28, marginBottom:10 },
  stepT:    { fontSize:16, fontWeight:700, color:TX, marginBottom:8 },
  stepD:    { fontSize:14, color:TM, lineHeight:1.6 },

  cliLayout:  { display:"flex", gap:56, alignItems:"center", flexWrap:"wrap" },
  cliPhones:  { display:"flex", alignItems:"flex-start", flexShrink:0 },
  cliPh:      { width:150, height:308, borderRadius:22, border:`2px solid ${BR}`, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,.1)", flexShrink:0 },
  cliBullets: { flex:"1 1 340px", display:"flex", flexDirection:"column", gap:12 },
  bullet:     { display:"flex", gap:14, alignItems:"flex-start", background:WH, border:`1px solid ${BR}`, borderRadius:12, padding:"14px 18px", transition:"border-color .2s,transform .2s,box-shadow .2s", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  bulletIc:   { fontSize:20, flexShrink:0, marginTop:2 },
  bulletT:    { fontSize:14, fontWeight:700, color:TX, marginBottom:3 },
  bulletD:    { fontSize:13, color:TM, lineHeight:1.55 },

  tabs:       { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
  tabBtn:     { background:WH, border:`1px solid ${BR}`, color:TM, fontSize:13, fontWeight:600, padding:"8px 18px", borderRadius:8, cursor:"pointer", transition:"all .2s", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  tabActive:  { background:B, border:`1px solid ${B}`, color:WH, boxShadow:"0 2px 12px rgba(37,99,235,.3)" },
  deskWrap:   { background:WH, border:`1px solid ${BR}`, borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.1)", marginBottom:44, transition:"transform .2s,box-shadow .2s" },
  deskBar:    { background:BG3, padding:"10px 16px", display:"flex", alignItems:"center", gap:6, borderBottom:`1px solid ${BR}` },
  dot:        { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  deskUrl:    { marginLeft:10, fontSize:11, color:TD, background:WH, padding:"3px 12px", borderRadius:20, border:`1px solid ${BR}` },
  deskContent:{ minHeight:390 },

  admCards:   { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 },
  admCard:    { background:WH, border:`1px solid ${BR}`, borderRadius:14, padding:"20px 18px", transition:"border-color .2s,transform .2s,box-shadow .2s", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  admIc:      { fontSize:24, marginBottom:10 },
  admT:       { fontSize:14, fontWeight:700, color:TX, marginBottom:5 },
  admD:       { fontSize:13, color:TM, lineHeight:1.55 },

  avanteWrap: { display:"flex", gap:56, flexWrap:"wrap", alignItems:"flex-start" },
  avanteText: { flex:"1 1 400px" },
  avanteCards:{ flex:"0 0 auto", display:"flex", flexDirection:"column", gap:14, minWidth:260 },
  avCard:     { background:WH, border:`1px solid ${BR}`, borderRadius:14, padding:"20px", transition:"border-color .2s,transform .2s,box-shadow .2s", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  avIc:       { fontSize:24, marginBottom:10 },
  avT:        { fontSize:14, fontWeight:700, color:TX, marginBottom:4 },
  avD:        { fontSize:13, color:TM },

  ctaSec:  { padding:"96px 24px" },
  ctaInner:{ background:TX, borderRadius:24, maxWidth:1160, margin:"0 auto", padding:"80px 40px", position:"relative", overflow:"hidden" },
  ctaBlob1:{ position:"absolute", top:"-30%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.25) 0%,transparent 65%)", pointerEvents:"none" },
  ctaBlob2:{ position:"absolute", bottom:"-40%", left:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,.15) 0%,transparent 65%)", pointerEvents:"none" },
  ctaBox:  { textAlign:"center", position:"relative", zIndex:1, maxWidth:560, margin:"0 auto" },
  ctaIc:   { fontSize:48, marginBottom:20 },
  ctaH2:   { fontSize:"clamp(26px,4vw,44px)", fontWeight:900, letterSpacing:"-1.5px", color:WH, lineHeight:1.15, marginBottom:16 },
  ctaP:    { fontSize:16, color:"rgba(255,255,255,0.65)", lineHeight:1.75, marginBottom:32 },
  ctaBtn:  { display:"inline-block", background:WH, color:TX, fontSize:15, fontWeight:800, padding:"15px 36px", borderRadius:12, textDecoration:"none", boxShadow:"0 4px 20px rgba(0,0,0,.2)", transition:"transform .15s" },

  footer:    { background:BG3, borderTop:`1px solid ${BR}`, padding:"48px 24px 32px" },
  footerRow: { display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:24, marginBottom:28 },
  ftSub:     { fontSize:13, color:TD, marginTop:6, marginBottom:6 },
  ftBy:      { fontSize:13, color:TD },
  ftAv:      { color:B, fontWeight:700 },
  ftLinks:   { display:"flex", flexDirection:"column", gap:8 },
  ftLink:    { background:"none", border:"none", color:TM, fontSize:13, cursor:"pointer", textAlign:"left", transition:"color .2s" },
  ftLine:    { height:1, background:BR, marginBottom:20 },
  ftCopy:    { fontSize:12, color:TD, textAlign:"center" },
};

// ─── CSS Global ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  body{background:#ffffff;-webkit-font-smoothing:antialiased}

  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes floatA{0%,100%{transform:rotate(-7deg) translateX(28px) translateY(0)}50%{transform:rotate(-7deg) translateX(28px) translateY(-14px)}}
  @keyframes floatB{0%,100%{transform:rotate(2deg) translateY(0)}50%{transform:rotate(2deg) translateY(-10px)}}
  @keyframes floatC{0%,100%{transform:rotate(7deg) translateX(-24px) translateY(0)}50%{transform:rotate(7deg) translateX(-24px) translateY(-8px)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

  .fl-slow{animation:floatA 5.5s ease-in-out infinite}
  .fl-fast{animation:floatB 4s ease-in-out infinite}
  .fl-med {animation:floatC 5s ease-in-out infinite}
  .fade-in{animation:fadeIn .3s ease both}

  .ch:hover{border-color:#93c5fd!important;transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(37,99,235,.12)!important}
  .navbtn:hover{color:#0f172a!important;background:#f1f5f9!important}

  @media(max-width:768px){
    .nl{display:none!important}
    .navcta{display:none!important}
    .brg{display:block!important}
  }
`;