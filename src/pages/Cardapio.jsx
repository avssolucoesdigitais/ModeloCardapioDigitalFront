import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import useCart from "../hooks/useCart";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import CartPanel from "../components/CartPanel";
import CheckoutModal from "./CheckoutModal";
import HorarioFuncionamento from "../components/HorarioFuncionamento";
import useLojaConfig from "../hooks/useLojaConfig";
import { GiFullPizza } from "react-icons/gi";
import { MdLocalOffer } from "react-icons/md";
import { FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";

import PizzaBuilderModal from "../components/BuiderModal/PizzaBuilderModal";
import PastelBuilderModal from "../components/BuiderModal/PastelBuilderModal.jsx";

const DIA_KEYS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const BANNER_HEIGHT_CLASSES = "h-40 sm:h-56 md:h-72 lg:h-80";

function normalizeCategory(cat) {
  return (cat || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isLojaAberta(config) {
  if (!config?.horarios) return false;
  const agora = new Date();
  const diaSemana = DIA_KEYS[agora.getDay()];
  const infoDia = config.horarios[diaSemana];
  if (!infoDia || !infoDia.abre || !infoDia.fecha) return false;
  const [abreH, abreM] = infoDia.abre.split(":").map(Number);
  const [fechaH, fechaM] = infoDia.fecha.split(":").map(Number);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const minutosAbre = abreH * 60 + abreM;
  const minutosFecha = fechaH * 60 + fechaM;
  if (minutosAbre <= minutosFecha) return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
  return minutosAgora >= minutosAbre || minutosAgora <= minutosFecha;
}

export default function Cardapio() {
  const { lojaSlug } = useParams();
  const LOJA_ID = lojaSlug;

  const cart = useCart();
  const { config } = useLojaConfig(LOJA_ID);

  const [products, setProducts]               = useState([]);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [paineis, setPaineis]                 = useState([]);  // ← novo
  const [search, setSearch]                   = useState("");
  const [open, setOpen]                       = useState(false);
  const [checkoutOpen, setCheckoutOpen]       = useState(false);
  const [activeCategory, setActiveCategory]   = useState("Todas");
  const [lojaAberta, setLojaAberta]           = useState(true);
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [pizzaOpen, setPizzaOpen]             = useState(false);
  const [basePizza, setBasePizza]             = useState(null);
  const [pizzaPreset, setPizzaPreset]         = useState(null);
  const [pastelOpen, setPastelOpen]           = useState(false);
  const [basePastel, setBasePastel]           = useState(null);
  const [pastelPreset, setPastelPreset]       = useState(null);

  const isLoadingProducts = !hasLoadedProducts;

  // ── Carrega painéis ativos para montar as categorias do filtro ──
  useEffect(() => {
    if (!LOJA_ID) return;
    getDocs(collection(db, "lojas", LOJA_ID, "paineis")).then((snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.ativo !== false)
        .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
      setPaineis(lista);
    });
  }, [LOJA_ID]);

  // ── Escuta produtos em tempo real de todas as opcoes/ ──
  useEffect(() => {
    const ref = collection(db, "lojas", LOJA_ID, "opcoes");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const categoria = docSnap.id;
        (data.produtos || []).forEach((p, idx) => {
          arr.push({
            id: p.id || `${docSnap.id}-${idx}`,
            ...p,
            name: p.nome || p.name,
            description: p.desc || p.description,
            category: categoria || "Outros",
            price: p.preco || p.price,
            prices: p.prices || { único: p.preco || 0 },
            available: p.available !== false,
            adicionais: data.adicionais || [],
            bordas: data.bordas || [],
            bases: data.bases || [],
          });
        });
      });
      setProducts(arr);
      setHasLoadedProducts(true);
    });
    return () => unsubscribe();
  }, [LOJA_ID]);

  // ── Atualiza status da loja a cada minuto ──
  useEffect(() => {
    if (!config || !config.horarios) { setLojaAberta(false); return; }
    function atualizarStatus() { setLojaAberta(isLojaAberta(config)); }
    atualizarStatus();
    const id = setInterval(atualizarStatus, 60 * 1000);
    return () => clearInterval(id);
  }, [config]);

  // ── Monta categorias do filtro a partir dos painéis do Firestore ──
  // Usa opcaoId do painel para bater com product.category (que vem do id do doc em opcoes/)
  const categories = useMemo(() => {
    if (!products.length || !paineis.length) return [];

    const categoriasTodas = { name: "Todas", icon: <GiFullPizza /> };

    const dinamicas = paineis
      .filter((painel) =>
        // só exibe no filtro se houver ao menos 1 produto disponível nessa categoria
        products.some(
          (p) => p.category === painel.opcaoId && p.available !== false
        )
      )
      .map((painel) => ({
        name: painel.opcaoId,   // bate com product.category
        label: painel.nome,     // nome legível exibido no botão
        icon: painel.icone,
      }));

    return [categoriasTodas, ...dinamicas];
  }, [products, paineis]);

  // ── Filtra e agrupa produtos ──
  const groupedProducts = useMemo(() => {
    if (!products.length) return {};
    return products
      .filter((p) =>
        p.available !== false &&
        (activeCategory === "Todas" || p.category === activeCategory) &&
        (() => {
          const q = search.toLowerCase();
          return (
            (p.name || "").toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q)
          );
        })()
      )
      .reduce((acc, p) => {
        const group = p.category || "Outros";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {});
  }, [products, activeCategory, search]);

  // ── Ordena grupos respeitando a ordem dos painéis ──
  const orderedGroups = useMemo(() => {
    const ordemPaineis = paineis.map((p) => p.opcaoId);
    return Object.entries(groupedProducts).sort(([a], [b]) => {
      // Promoção sempre primeiro
      const aNorm = normalizeCategory(a);
      const bNorm = normalizeCategory(b);
      if (aNorm === "promocao") return -1;
      if (bNorm === "promocao") return 1;
      // Demais seguem a ordem dos painéis
      const ia = ordemPaineis.indexOf(a);
      const ib = ordemPaineis.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [groupedProducts, paineis]);

  // ── Retorna label legível de uma categoria ──
  function getCategoryLabel(categoryId) {
    if (categoryId === "Promocao" || categoryId === "Promoção") return "Promoção";
    const painel = paineis.find((p) => p.opcaoId === categoryId);
    return painel?.nome ?? categoryId;
  }

  // ── Handlers de produto ──
  const makeOnAdd = useCallback((p) => (itemFromCard) => {
    if (!lojaAberta) { setHorarioModalOpen(true); return; }
    const catNorm = normalizeCategory(p.category);
    if (catNorm === "pizza") {
      setBasePizza(p);
      setPizzaPreset({ size: itemFromCard?.size || "", firstFlavorId: itemFromCard?.firstFlavorId || p.id });
      setPizzaOpen(true);
      return;
    }
    if (catNorm === "pastel") {
      const hasSizes  = p.prices && Object.keys(p.prices).length > 0;
      const hasAddons = p.adicionais && p.adicionais.length > 0;
      if (p.montar === true || hasSizes || hasAddons) {
        setBasePastel(p);
        setPastelPreset({ size: itemFromCard?.size || "", firstFlavorId: itemFromCard?.firstFlavorId || p.id });
        setPastelOpen(true);
        return;
      }
      cart.add({
        id: p.id, name: p.name, category: p.category, description: p.description,
        price: itemFromCard?.price ?? p.preco ?? p.price ?? (p.prices ? Object.values(p.prices)[0] : 0),
        size: itemFromCard?.size || "único", image: p.image, qty: itemFromCard?.qty ?? 1,
      });
      return;
    }
    cart.add({ ...itemFromCard, qty: itemFromCard?.qty ?? 1 });
  }, [lojaAberta, cart]);

  const handleCheckout = useCallback(() => {
    if (!lojaAberta) { setHorarioModalOpen(true); return; }
    setOpen(false);
    setTimeout(() => setCheckoutOpen(true), 300);
  }, [lojaAberta]);

  const cartCount = useMemo(() => cart.items.reduce((a, i) => a + i.qty, 0), [cart.items]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header config={config} onCartClick={() => setOpen(true)} cartCount={cartCount} onSearchChange={setSearch} />

      {/* Banner */}
      <div className={`w-full ${BANNER_HEIGHT_CLASSES} overflow-hidden bg-gray-200`}>
        {config?.bannerUrl && (
          <img src={config.bannerUrl} alt={config?.nomeLoja || "Banner"}
            className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
        )}
      </div>

      {/* Status + Horário */}
      <div className="w-full px-3 sm:px-6 pt-5 pb-3">
        <HorarioFuncionamento lojaId={LOJA_ID} />
        <p className={`mt-2 text-sm text-center font-semibold ${lojaAberta ? "text-green-600" : "text-red-500"}`}>
          {lojaAberta ? "Estamos aceitando pedidos agora ✅" : "No momento estamos fechados para pedidos ⛔"}
        </p>
      </div>

      {/* Barra de Categorias — sticky */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {isLoadingProducts
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-20 rounded-full bg-gray-100 animate-pulse shrink-0" />
                ))
              : categories.map((cat, idx) => {
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name || `cat-${idx}`}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide whitespace-nowrap shrink-0 transition-all duration-200 ${
                        isActive
                          ? "bg-gray-900 text-white shadow-md"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      {/* Usa label quando disponível (nome legível do painel) */}
                      <span>{cat.label ?? cat.name}</span>
                      {isActive && (
                        <motion.span
                          layoutId="categoryUnderline"
                          className="absolute inset-0 rounded-full ring-2 ring-gray-900 ring-offset-1"
                        />
                      )}
                    </button>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <main className="flex-1 w-full px-3 sm:px-6 py-8">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-7xl space-y-10">
            {isLoadingProducts ? (
              <div>
                <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-5" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : orderedGroups.length > 0 ? (
              orderedGroups.map(([group, items]) => (
                <div key={group}>
                  <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-extrabold text-gray-900 mb-5">
                    <span className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    <span>{getCategoryLabel(group)}</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {items.map((p, idx) => (
                      <ProductCard
                        key={p.id || `${p.name || "produto"}-${idx}`}
                        p={p} onAdd={makeOnAdd(p)} disabled={!lojaAberta}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center mt-8">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>
      </main>

      <CartPanel open={open} onClose={() => setOpen(false)} cart={cart} onCheckout={handleCheckout} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} whatsapp={config?.whatsapp} lojaId={LOJA_ID} />
      <PizzaBuilderModal open={pizzaOpen}
        onClose={() => { setPizzaOpen(false); setBasePizza(null); setPizzaPreset(null); }}
        products={products} baseProduct={basePizza} preset={pizzaPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })} />
      <PastelBuilderModal open={pastelOpen}
        onClose={() => { setPastelOpen(false); setBasePastel(null); setPastelPreset(null); }}
        baseProduct={basePastel} preset={pastelPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })} />

      {horarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Estamos fechados no momento</h2>
            <p className="text-gray-600 text-sm mb-4">
              Aceitamos pedidos apenas dentro do horário de funcionamento da loja.<br />
              Por favor, aguarde o próximo horário de atendimento. 😊
            </p>
            <button onClick={() => setHorarioModalOpen(false)}
              className="mt-2 px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition">
              Entendi
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-gray-400 text-xs mt-8 mb-4">Imagens meramente ilustrativas</p>

      {config?.instagram && (
        <div className="px-4 mb-8 max-w-2xl mx-auto w-full">
          <a href={config.instagram} target="_blank" rel="noopener noreferrer"
            className="group relative flex items-center gap-4 p-4 rounded-[2rem] bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg group-hover:scale-110 transition-transform shrink-0">
              <FaInstagram size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instagram</span>
              <span className="text-gray-800 font-black">@{config.nomeLoja?.replace(/\s+/g, "").toLowerCase() || "nossaloja"}</span>
            </div>
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}