import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
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

// Modais
import PizzaBuilderModal from "../components/BuiderModal/PizzaBuilderModal";
import PastelBuilderModal from "../components/BuiderModal/PastelBuilderModal.jsx";

/* ====== CONSTANTES / HELPERS FORA DO COMPONENTE ====== */

const DIA_KEYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

const ALL_CATEGORIES = [
  { name: "Promoção", icon: <MdLocalOffer /> },
  { name: "Pizza", icon: "🍕" },
  { name: "Hamburguer", icon: "🍔" },
  { name: "Pastel", icon: "🥟" },
  { name: "HotDog", icon: "🌭" },
  { name: "Marmitas", icon: "🍱" },
  { name: "Bebida", icon: "🥤" },
  { name: "Batata", icon: "🍟" },
  { name: "Salgadinhos", icon: "🍢" },
  { name: "Esfiha", icon: "🫓" },
  { name: "Calzone", icon: "🌮" },
  { name: "Combos", icon: "🎁" },
];

const BANNER_HEIGHT_CLASSES = "h-40 sm:h-56 md:h-72 lg:h-80";

function normalizeCategory(cat) {
  return (cat || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

  if (minutosAbre <= minutosFecha) {
    return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
  }

  return minutosAgora >= minutosAbre || minutosAgora <= minutosFecha;
}

export default function Cardapio() {
  const { lojaSlug } = useParams();
  const LOJA_ID = lojaSlug;  

  const cart = useCart();
  const { config } = useLojaConfig(LOJA_ID);

  const [products, setProducts] = useState([]);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");

  const [lojaAberta, setLojaAberta] = useState(true);
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);

  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [basePizza, setBasePizza] = useState(null);
  const [pizzaPreset, setPizzaPreset] = useState(null);

  const [pastelOpen, setPastelOpen] = useState(false);
  const [basePastel, setBasePastel] = useState(null);
  const [pastelPreset, setPastelPreset] = useState(null);

  const isLoadingProducts = !hasLoadedProducts;

  // ✅ CORRIGIDO: opcoes agora dentro da loja
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
  }, []);

  useEffect(() => {
    if (!config || !config.horarios) {
      setLojaAberta(false);
      return;
    }

    function atualizarStatus() {
      setLojaAberta(isLojaAberta(config));
    }

    atualizarStatus();
    const id = setInterval(atualizarStatus, 60 * 1000);
    return () => clearInterval(id);
  }, [config]);

  const availableCategories = useMemo(() => {
    if (!products.length) return [];
    return ALL_CATEGORIES.filter((cat) =>
      products.some((p) => p.category === cat.name && p.available !== false)
    );
  }, [products]);

  const categories = useMemo(() => {
    if (!products.length) return [];
    return [{ name: "Todas", icon: <GiFullPizza /> }, ...availableCategories];
  }, [availableCategories, products.length]);

  const groupedProducts = useMemo(() => {
    if (!products.length) return {};

    return products
      .filter(
        (p) =>
          p.available !== false &&
          (activeCategory === "Todas" || p.category === activeCategory) &&
          (p.name || "").toLowerCase().includes(search.toLowerCase())
      )
      .reduce((acc, p) => {
        const group = p.category || "Outros";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {});
  }, [products, activeCategory, search]);

  const orderedGroups = useMemo(() => {
    return Object.entries(groupedProducts).sort(([a], [b]) => {
      if (a.toLowerCase() === "promoção") return -1;
      if (b.toLowerCase() === "promoção") return 1;
      return 0;
    });
  }, [groupedProducts]);

  const makeOnAdd = useCallback(
    (p) => (itemFromCard) => {
      if (!lojaAberta) {
        setHorarioModalOpen(true);
        return;
      }

      const catNorm = normalizeCategory(p.category);

      if (catNorm === "pizza") {
        setBasePizza(p);
        setPizzaPreset({
          size: itemFromCard?.size || "",
          firstFlavorId: itemFromCard?.firstFlavorId || p.id,
        });
        setPizzaOpen(true);
        return;
      }

      if (catNorm === "pastel") {
        const hasSizes = p.prices && Object.keys(p.prices).length > 0;
        const hasAddons = p.adicionais && p.adicionais.length > 0;
        const shouldUseModal = p.montar === true || hasSizes || hasAddons;

        if (shouldUseModal) {
          setBasePastel(p);
          setPastelPreset({
            size: itemFromCard?.size || "",
            firstFlavorId: itemFromCard?.firstFlavorId || p.id,
          });
          setPastelOpen(true);
          return;
        }

        cart.add({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price:
            itemFromCard?.price ??
            p.preco ??
            p.price ??
            (p.prices ? Object.values(p.prices)[0] : 0),
          size: itemFromCard?.size || "único",
          image: p.image,
          qty: itemFromCard?.qty ?? 1,
        });
        return;
      }

      cart.add({
        ...itemFromCard,
        qty: itemFromCard?.qty ?? 1,
      });
    },
    [lojaAberta, cart]
  );

  const handleCheckout = useCallback(() => {
    if (!lojaAberta) {
      setHorarioModalOpen(true);
      return;
    }
    setOpen(false);
    setTimeout(() => setCheckoutOpen(true), 300);
  }, [lojaAberta]);

  const cartCount = useMemo(
    () => cart.items.reduce((a, i) => a + i.qty, 0),
    [cart.items]
  );

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header
        config={config}
        onCartClick={() => setOpen(true)}
        cartCount={cartCount}
        onSearchChange={setSearch}
      />

      <div
        className={`w-full ${BANNER_HEIGHT_CLASSES} rounded-b-lg shadow overflow-hidden bg-gray-200`}
      >
        {config?.bannerUrl && (
          <img
            src={config.bannerUrl}
            alt={config?.nomeLoja || "Banner"}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        )}
      </div>

      <main className="flex-1 w-full px-3 sm:px-6 py-6">
        <div className="mb-6">
          <HorarioFuncionamento lojaId={LOJA_ID}/>
          <p
            className={`mt-2 text-sm text-center font-semibold ${
              lojaAberta ? "text-green-600" : "text-red-500"
            }`}
          >
            {lojaAberta
              ? "Estamos aceitando pedidos agora ✅"
              : "No momento estamos fechados para pedidos ⛔"}
          </p>
        </div>

        <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-40 pb-4 mb-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-4 px-4 sm:justify-center">
            {categories.length === 0 && isLoadingProducts ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[90px] h-[72px] rounded-[1.5rem] bg-gray-200 animate-pulse"
                  />
                ))}
              </>
            ) : (
              categories.map((cat, idx) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name || `categoria-${idx}`}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`
                      relative flex flex-col items-center justify-center 
                      min-w-[90px] p-3 rounded-[1.5rem] 
                      transition-all duration-300 ease-out
                      ${isActive
                        ? "bg-gray-900 text-white shadow-xl shadow-gray-200 -translate-y-1"
                        : "bg-white text-gray-500 hover:bg-gray-100 border border-transparent shadow-sm"
                      }
                    `}
                  >
                    <span className={`text-2xl mb-1 transition-transform ${isActive ? "scale-125" : "group-hover:scale-110"}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? "text-white" : "text-gray-500"}`}>
                      {cat.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-7xl space-y-10">
            {isLoadingProducts ? (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-300 mb-5 border-b pb-2">&nbsp;</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-40 sm:h-48 rounded-xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : orderedGroups.length > 0 ? (
              orderedGroups.map(([group, items]) => (
                <div key={group}>
                  <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-gray-900 mb-5">
                    <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    <span>{group}</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-center">
                    {items.map((p, idx) => (
                      <ProductCard
                        key={p.id || `${p.name || "produto"}-${idx}`}
                        p={p}
                        onAdd={makeOnAdd(p)}
                        disabled={!lojaAberta}
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

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        whatsapp={config?.whatsapp}
        lojaId={LOJA_ID}
      />

      <PizzaBuilderModal
        open={pizzaOpen}
        onClose={() => { setPizzaOpen(false); setBasePizza(null); setPizzaPreset(null); }}
        products={products}
        baseProduct={basePizza}
        preset={pizzaPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      <PastelBuilderModal
        open={pastelOpen}
        onClose={() => { setPastelOpen(false); setBasePastel(null); setPastelPreset(null); }}
        baseProduct={basePastel}
        preset={pastelPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      {horarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Estamos fechados no momento</h2>
            <p className="text-gray-600 text-sm mb-4">
              Aceitamos pedidos apenas dentro do horário de funcionamento da loja.
              <br />
              Por favor, aguarde o próximo horário de atendimento. 😊
            </p>
            <button
              onClick={() => setHorarioModalOpen(false)}
              className="mt-2 px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-gray-400 text-xs mt-8 mb-4">Imagens meramente ilustrativas</p>

      {config?.instagram && (
        <div className="px-4 mb-8 max-w-2xl mx-auto">
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-4 rounded-[2rem] bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg group-hover:scale-110 transition-transform">
                <FaInstagram size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instagram</span>
                <span className="text-gray-800 font-black">@{config.nomeLoja?.replace(/\s+/g, '').toLowerCase() || "nossaloja"}</span>
              </div>
            </div>
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
