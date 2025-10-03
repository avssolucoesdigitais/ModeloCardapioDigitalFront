import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
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
import HotDogBuilderModal from "../components/BuiderModal/HotDogBuilderModal.jsx";

export default function Cardapio() {
  const cart = useCart();
  const { config } = useLojaConfig("daypizza");

  // ---------- ESTADOS ----------
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");

  // Estados Pizza
  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [basePizza, setBasePizza] = useState(null);
  const [pizzaPreset, setPizzaPreset] = useState(null);

  // Estados Hamburguer
  const [hambOpen, setHambOpen] = useState(false);
  const [baseHamb, setBaseHamb] = useState(null);
  const [hambPreset, setHambPreset] = useState(null);

  // Estados Pastel
  const [pastelOpen, setPastelOpen] = useState(false);
  const [basePastel, setBasePastel] = useState(null);
  const [pastelPreset, setPastelPreset] = useState(null);

  // Estados HotDog
  const [hotDogOpen, setHotDogOpen] = useState(false);
  const [baseHotDog, setBaseHotDog] = useState(null);
  const [hotDogPreset, setHotDogPreset] = useState(null);

  // ---------- CARREGAR PRODUTOS ----------
  useEffect(() => {
    const ref = collection(db, "opcoes");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const categoria = data.categoria || docSnap.id;

        (data.produtos || []).forEach((p, idx) => {
          arr.push({
            id: p.id || `${docSnap.id}-${idx}-${Date.now()}`,
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
    });
    return () => unsubscribe();
  }, []);

  // Carregar dados do Hamburguer
  useEffect(() => {
    (async () => {
      const ref = doc(db, "opcoes", "Hamburguer");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();

        setBaseHamb({
          paes: data.paes || [],
          carnes: data.carnes || [],
          queijos: data.queijos || [],
          molhos: data.molhos || [],
          complementos: data.complementos || [],
        });

        const hambs = (data.produtos || []).map((h, idx) => ({
          id: h.id || `hamb-${idx}-${Date.now()}`,
          ...h,
          name: h.nome || h.name,
          description: h.desc || h.description,
          category: "Hamburguer",
          price: h.preco || h.price,
          prices: h.prices || { único: h.preco || 0 },
          available: h.available !== false,
        }));

        setProducts((prev) => [...prev, ...hambs]);
      }
    })();
  }, []);

  // Carregar dados do Pastel
  useEffect(() => {
    const loadPastelData = async () => {
      try {
        const ref = doc(db, "opcoes", "Pastel");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setBasePastel({
            massas: data.massas || [],
            recheios: data.recheios || [],
            molhos: data.molhos || [],
            complementos: data.complementos || [],
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Pastel:", error);
      }
    };
    loadPastelData();
  }, []);

  // Carregar dados do HotDog
  useEffect(() => {
    const loadHotDogData = async () => {
      try {
        const ref = doc(db, "opcoes", "HotDog");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setBaseHotDog({
            pães: data.paes || [],
            carnes: data.carnes || [],
            molhos: data.molhos || [],
            complementos: data.complementos || [],
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do HotDog:", error);
      }
    };
    loadHotDogData();
  }, []);

  // ---------- CATEGORIAS ----------
  const allCategories = [
    { name: "Promocao", icon: <MdLocalOffer /> },
    { name: "Pizza", icon: "🍕" },
    { name: "Hamburguer", icon: "🍔" },
    { name: "Pastel", icon: "🥟" },
    { name: "HotDog", icon: "🌭" },
    { name: "Bebida", icon: "🥤" },
    { name: "Batata", icon: "🍟" },
    { name: "Salgadinhos", icon: "🍢" },
    { name: "Esfiha", icon: "🫓" },
    { name: "Calzone", icon: "🌮" },
    { name: "Combos", icon: "🎁" },
  ];

  const availableCategories = allCategories.filter((cat) =>
    products.some((p) => p.category === cat.name && p.available !== false)
  );

  const categories =
    products.length > 0
      ? [{ name: "Todas", icon: <GiFullPizza /> }, ...availableCategories]
      : [];

  // ---------- AGRUPAMENTO ----------
const groupedProducts = products
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

// Ordena os grupos → "Promocao" sempre primeiro
const orderedGroups = Object.entries(groupedProducts).sort(([a], [b]) => {
  if (a.toLowerCase() === "promocao") return -1;
  if (b.toLowerCase() === "promocao") return 1;
  return 0;
});


  // ---------- ADICIONAR AO CARRINHO ----------
  const makeOnAdd = (p) => (itemFromCard) => {
    const category = (p.category || "").toLowerCase();

    if (category === "pizza") {
      setBasePizza(p);
      setPizzaPreset({
        size: itemFromCard?.size || "",
        firstFlavorId: itemFromCard?.firstFlavorId || p.id,
      });
      setPizzaOpen(true);
      return;
    }

    if (category === "hamburguer") {
      if (p.montar === true) {
        setBaseHamb(baseHamb);
        setHambPreset({
          size: itemFromCard?.size || "",
          firstFlavorId: itemFromCard?.firstFlavorId || p.id,
        });
        setHambOpen(true);
        return;
      } else {
        cart.add({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.preco || p.price || p.prices?.único || 0,
          size: "único",
          image: p.image,
          qty: 1,
        });
        return;
      }
    }

    if (category === "pastel") {
      setBasePastel(p);
      setPastelPreset({
        size: itemFromCard?.size || "",
        firstFlavorId: itemFromCard?.firstFlavorId || p.id,
      });
      setPastelOpen(true);
      return;
    }

    if (category === "hotdog") {
      setBaseHotDog(p);
      setHotDogPreset({
        size: itemFromCard?.size || "",
        firstFlavorId: itemFromCard?.firstFlavorId || p.id,
      });
      setHotDogOpen(true);
      return;
    }

    cart.add({
      ...itemFromCard,
      qty: itemFromCard?.qty ?? 1,
    });
  };

  // ---------- RENDER ----------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        config={config}
        onCartClick={() => setOpen(true)}
        cartCount={cart.items.reduce((a, i) => a + i.qty, 0)}
        onSearchChange={setSearch}
      />

      {config?.bannerUrl && (
        <img
          src={config.bannerUrl}
          alt="Banner"
          className="w-full h-40 sm:h-56 md:h-72 lg:h-80 object-cover rounded-b-lg shadow"
        />
      )}

      <main className="flex-1 w-full px-3 sm:px-6 py-6">
        <div className="mb-6">
          <HorarioFuncionamento />
        </div>

        {/* Categorias */}
        <div className="sticky top-0 bg-gray-50 z-40 pb-3 mb-6 border-b">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-3">
            {categories.map((cat, idx) => (
              <button
                key={cat.name || `categoria-${idx}`}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] text-xs sm:text-sm font-medium transition-all
                  ${activeCategory === cat.name
                    ? "bg-yellow-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100"}`}
              >
                <span className="text-lg sm:text-xl mb-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Produtos */}
        <div className="w-full max-w-7xl mx-auto space-y-10">
          {Object.keys(groupedProducts).length > 0 ? (
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
        onCheckout={() => setCheckoutOpen(true)}
      />

      {/* Checkout */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        whatsapp={config?.whatsapp}
      />

      {/* Modais */}
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

      <HotDogBuilderModal
        open={hotDogOpen}
        onClose={() => {
          setHotDogOpen(false);
          setBaseHotDog(null);
          setHotDogPreset(null);
        }}
        baseProduct={baseHotDog}
        preset={hotDogPreset}
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

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
