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

// Modais
import PizzaBuilderModal from "../components/BuiderModal/PizzaBuilderModal";
import HamburguerBuilderModal from "../components/BuiderModal/BurgerBuilderModal";
import PastelBuilderModal from "../components/BuiderModal/PastelBuilderModal.jsx";

/* ====== CONSTANTES / HELPERS FORA DO COMPONENTE ====== */
const DIA_KEYS = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

const ALL_CATEGORIES = [
  { name: "Promocao", icon: <MdLocalOffer /> },
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

// mesma altura sempre, mesmo sem banner -> evita CLS
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
  const diaSemana = DIA_KEYS[agora.getDay()]; // 0 = domingo ... 6 = sábado
  const infoDia = config.horarios[diaSemana];

  if (!infoDia || !infoDia.abre || !infoDia.fecha) return false;

  const [abreH, abreM] = infoDia.abre.split(":").map(Number);
  const [fechaH, fechaM] = infoDia.fecha.split(":").map(Number);

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const minutosAbre = abreH * 60 + abreM;
  const minutosFecha = fechaH * 60 + fechaM;

  // Ex.: 18:00 às 23:00 (mesmo dia)
  if (minutosAbre <= minutosFecha) {
    return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
  }

  // Ex.: 18:00 às 02:00 (vira pra madrugada)
  return minutosAgora >= minutosAbre || minutosAgora <= minutosFecha;
}

export default function Cardapio() {
  const cart = useCart();
  const { config } = useLojaConfig("daypizza");

  // ---------- ESTADOS ----------
  const [products, setProducts] = useState([]);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");

  // Controle de horário
  const [lojaAberta, setLojaAberta] = useState(true);
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);

  // Pizza
  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [basePizza, setBasePizza] = useState(null);
  const [pizzaPreset, setPizzaPreset] = useState(null);

  // Hamburguer
  const [hambOpen, setHambOpen] = useState(false);
  const [baseHamb, setBaseHamb] = useState(null);
  const [hambPreset, setHambPreset] = useState(null);

  // Pastel
  const [pastelOpen, setPastelOpen] = useState(false);
  const [basePastel, setBasePastel] = useState(null);
  const [pastelPreset, setPastelPreset] = useState(null);

  const isLoadingProducts = !hasLoadedProducts;

  // ---------- CARREGAR PRODUTOS (coleção "opcoes") ----------
  useEffect(() => {
    const ref = collection(db, "opcoes");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const arr = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const categoria = docSnap.id; // Pizza, Hamburguer, Pastel, etc.

        (data.produtos || []).forEach((p, idx) => {
          arr.push({
            id: p.id || `${docSnap.id}-${idx}`, // id estável (sem Date.now)
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

  // ---------- MONITORAR HORÁRIO DE FUNCIONAMENTO ----------
  useEffect(() => {
    if (!config || !config.horarios) {
      setLojaAberta(false);
      return;
    }

    function atualizarStatus() {
      setLojaAberta(isLojaAberta(config));
    }

    atualizarStatus(); // primeira vez

    const id = setInterval(atualizarStatus, 60 * 1000); // atualiza a cada 1 min
    return () => clearInterval(id);
  }, [config]);

  // ---------- CATEGORIAS (memoizadas) ----------
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

  // ---------- AGRUPAMENTO (memoizado) ----------
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
        const group =
          activeCategory === "Todas" ? p.category || "Outros" : p.subCategory || "Outros";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {});
  }, [products, activeCategory, search]);

  const orderedGroups = useMemo(() => {
    return Object.entries(groupedProducts).sort(([a], [b]) => {
      if (a.toLowerCase() === "promocao") return -1;
      if (b.toLowerCase() === "promocao") return 1;
      return 0;
    });
  }, [groupedProducts]);

  // ---------- ADICIONAR AO CARRINHO (useCallback) ----------
  const makeOnAdd = useCallback(
    (p) => (itemFromCard) => {
      // Bloqueia pedidos fora do horário e abre sub-tela
      if (!lojaAberta) {
        setHorarioModalOpen(true);
        return;
      }

      const catNorm = normalizeCategory(p.category);

      // PIZZA → abre modal
      if (catNorm === "pizza") {
        setBasePizza(p);
        setPizzaPreset({
          size: itemFromCard?.size || "",
          firstFlavorId: itemFromCard?.firstFlavorId || p.id,
        });
        setPizzaOpen(true);
        return;
      }

      // HAMBÚRGUER → montável ou simples
      if (catNorm === "hamburguer") {
        if (p.montar === true) {
          setBaseHamb(p);
          setHambPreset({
            size: itemFromCard?.size || "",
            firstFlavorId: itemFromCard?.firstFlavorId || p.id,
          });
          setHambOpen(true);
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

      // PASTEL → modal ou simples
      if (catNorm === "pastel") {
        if (p.montar === true) {
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

      // Demais categorias simples
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
    setCheckoutOpen(true);
  }, [lojaAberta]);

  const cartCount = useMemo(
    () => cart.items.reduce((a, i) => a + i.qty, 0),
    [cart.items]
  );

  // ---------- RENDER ----------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        config={config}
        onCartClick={() => setOpen(true)}
        cartCount={cartCount}
        onSearchChange={setSearch}
      />

      {/* Banner com espaço reservado SEMPRE -> menos CLS e LCP melhor */}
      <div
        className={`w-full ${BANNER_HEIGHT_CLASSES} rounded-b-lg shadow overflow-hidden bg-gray-200`}
      >
        {config?.bannerUrl && (
          <img
            src={config.bannerUrl}
            alt={config?.nomeLoja || "Banner"}
            className="w-full h-full object-cover"
            loading="eager"         // ajuda o LCP
            fetchPriority="high"    // Chrome prioriza este recurso
          />
        )}
      </div>

      <main className="flex-1 w-full px-3 sm:px-6 py-6">
        <div className="mb-6">
          <HorarioFuncionamento />

          {/* Status visual de aberto/fechado */}
          <p
            className={`mt-2 text-sm font-semibold ${
              lojaAberta ? "text-green-600" : "text-red-500"
            }`}
          >
            {lojaAberta
              ? "Estamos aceitando pedidos agora ✅"
              : "No momento estamos fechados para pedidos ⛔"}
          </p>
        </div>

        {/* Categorias */}
        <div className="sticky top-0 bg-gray-50 z-40 pb-3 mb-6 border-b">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-3 min-h-[80px]">
            {categories.length === 0 && isLoadingProducts ? (
              // Skeleton das categorias para evitar “pulo” quando chegarem
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[80px] h-14 rounded-lg bg-gray-200 animate-pulse"
                  />
                ))}
              </>
            ) : (
              categories.map((cat, idx) => (
                <button
                  key={cat.name || `categoria-${idx}`}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] text-xs sm:text-sm font-medium transition-all
                    ${
                      activeCategory === cat.name
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <span className="text-lg sm:text-xl mb-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Produtos */}
        <div className="w-full max-w-7xl mx-auto space-y-10">
          {isLoadingProducts ? (
            // Skeleton de produtos: evita CLS quando os itens reais aparecem
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-300 mb-5 border-b pb-2">
                &nbsp;
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 sm:h-48 rounded-xl bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : orderedGroups.length > 0 ? (
            orderedGroups.map(([group, items]) => (
              <div key={group}>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-5 border-b pb-2">
                  {group}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <p className="text-gray-500 text-center mt-8">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      </main>

      {/* Carrinho */}
      <CartPanel
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        onCheckout={handleCheckout}
      />

      {/* Checkout */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        whatsapp={config?.whatsapp}
      />

      {/* Modais de montagem */}
      <PizzaBuilderModal
        open={pizzaOpen}
        onClose={() => {
          setPizzaOpen(false);
          setBasePizza(null);
          setPizzaPreset(null);
        }}
        products={products}
        baseProduct={basePizza}
        preset={pizzaPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      <HamburguerBuilderModal
        open={hambOpen}
        onClose={() => {
          setHambOpen(false);
          setBaseHamb(null);
          setHambPreset(null);
        }}
        baseProduct={baseHamb}
        preset={hambPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      <PastelBuilderModal
        open={pastelOpen}
        onClose={() => {
          setPastelOpen(false);
          setBasePastel(null);
          setPastelPreset(null);
        }}
        baseProduct={basePastel}
        preset={pastelPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      {/* SUB TELA / MODAL DE HORÁRIO DE FUNCIONAMENTO */}
      {horarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">
              Estamos fechados no momento
            </h2>
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

      <p className="text-center text-gray-400 text-xs mt-8 mb-4">
        Imagens meramente ilustrativas
      </p>

      {config?.instagram && (
        <div className="flex justify-center px-4 mb-6">
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-semibold shadow-lg hover:opacity-90 transition"
          >
            <FaInstagram size={22} />
            Siga a {config.nomeLoja || "nossa loja"} no Instagram
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
