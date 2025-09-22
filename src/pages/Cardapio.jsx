import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import useCart from "../hooks/useCart";
import Header from "../componets/Header";
import Footer from "../componets/Footer";
import ProductCard from "../componets/ProductCard";
import CartPanel from "../componets/CartPanel";
import CheckoutModal from "./CheckoutModal";
import HorarioFuncionamento from "../componets/HorarioFuncionamento";
import useLojaConfig from "../hooks/useLojaConfig";
import { FaInstagram, FaPizzaSlice, FaHamburger, FaCocktail } from "react-icons/fa";
import { GiFullPizza, GiFrenchFries, GiHotDog, GiSodaCan } from "react-icons/gi";
import { MdLocalOffer } from "react-icons/md";

// 🔹 usa o novo wizard unificado
import PizzaBuilderModal from "../componets/PizzaBuilderModal";

export default function Cardapio() {
  const cart = useCart();
  const { config } = useLojaConfig("daypizza");

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");

  // modal de montar pizza
  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [basePizza, setBasePizza] = useState(null);
  const [pizzaPreset, setPizzaPreset] = useState(null); // 👈 preset (size + sabor)

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("ordem", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const allCategories = [
    { name: "Promocao", icon: <MdLocalOffer /> },
    { name: "Pizza", icon: <FaPizzaSlice /> },
    { name: "Sanduiche", icon: <FaHamburger /> },
    { name: "Pastel", icon: "🥟" },
    { name: "Batata", icon: <GiFrenchFries /> },
    { name: "HotDog", icon: <GiHotDog /> },
    { name: "Bebida", icon: <GiSodaCan /> },
    { name: "Suco", icon: <FaCocktail /> },
  ];

  const availableCategories = allCategories.filter((cat) =>
    products.some((p) => p.category === cat.name && p.available !== false)
  );

  const categories =
    products.length > 0
      ? [{ name: "Todas", icon: <GiFullPizza /> }, ...availableCategories]
      : [];

  // agrupar por subcategoria
  const groupedProducts = products
    .filter(
      (p) =>
        p.available !== false &&
        (activeCategory === "Todas" || p.category === activeCategory) &&
        p.name?.toLowerCase().includes(search.toLowerCase())
    )
    .reduce((acc, p) => {
      const sub = p.subCategory || "Outros";
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(p);
      return acc;
    }, {});

  // 👉 embrulha o onAdd do ProductCard:
  const makeOnAdd = (p) => (itemFromCard) => {
    const isPizza = p.category?.toLowerCase() === "pizza";
    if (isPizza) {
      setBasePizza(p);
      setPizzaPreset({
        size: itemFromCard?.size || "",    // se já veio tamanho
        firstFlavorId: p.id,              // sabor clicado
      });
      setPizzaOpen(true);
      return;
    }
    cart.add({
      ...itemFromCard,
      qty: itemFromCard?.qty ?? 1,
    });
  };

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
          className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-b-lg shadow"
        />
      )}

      <main className="flex-1 w-full px-4 py-6">
        <div className="mb-6">
          <HorarioFuncionamento />
        </div>

        {/* categorias */}
        <div className="sticky top-0 bg-gray-50 z-40 pb-3 mb-4 border-b">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg min-w-[90px] text-sm font-medium transition 
                  ${
                    activeCategory === cat.name
                      ? "bg-yellow-500 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="text-xl">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* produtos */}
        <div className="w-full max-w-6xl mx-auto space-y-10">
          {Object.keys(groupedProducts).length > 0 ? (
            Object.entries(groupedProducts).map(([sub, items]) => (
              <div key={sub}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-1">
                  {sub}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      onAdd={makeOnAdd(p)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center mt-6">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      </main>

      <CartPanel
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        onCheckout={() => setCheckoutOpen(true)}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        whatsapp={config?.whatsapp}
      />

      {/* 🔹 wizard unificado da pizza */}
      <PizzaBuilderModal
        open={pizzaOpen}
        onClose={() => {
          setPizzaOpen(false);
          setBasePizza(null);
          setPizzaPreset(null);
        }}
        products={products}
        baseProduct={basePizza}
        preset={pizzaPreset}  // 👈 agora leva o preset para o modal
        onAdd={(item) => cart.add({ ...item, qty: item.qty ?? 1 })}
      />

      <p className="text-center text-gray-500 mt-6">
        Imagens meramente ilustrativas
      </p>

      {config?.instagram && (
        <div
          className="flex justify-center mt-4 mb-6"
          style={{
            backgroundColor: config.primaryColor,
            color: config.secondaryColor,
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: config.secondaryColor }}
          >
            <FaInstagram size={28} />
            Siga a {config.nomeLoja || "nossa loja"} no Instagram
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
