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

// 🔹 Modal Meio a Meio
function MeioMeioModal({ open, onClose, products, onAdd }) {
  const [tamanho, setTamanho] = useState("media");
  const [sabor1, setSabor1] = useState(null);
  const [sabor2, setSabor2] = useState(null);

  if (!open) return null;

  const pizzas = products.filter(
    (p) => p.category?.toLowerCase() === "pizza" && p.available !== false
  );

  const handleConfirm = () => {
    if (!sabor1 || !sabor2) return alert("Escolha dois sabores!");

    const preco1 = Number(sabor1.prices?.[tamanho] || 0);
    const preco2 = Number(sabor2.prices?.[tamanho] || 0);

    if (!preco1 || !preco2) {
      return alert("Esse tamanho não está disponível para um dos sabores.");
    }

    const price = preco1 / 2 + preco2 / 2;

    onAdd({
      id: `meio-${tamanho}-${sabor1.id}-${sabor2.id}`,
      name: "Pizza Meio a Meio",
      flavors: [sabor1.name, sabor2.name],
      price,
      qty: 1,
      size: tamanho,
      image: sabor1.image || sabor2.image || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        <h2 className="text-lg font-bold mb-4">🍕 Escolha 2 Sabores</h2>
        {/* tamanho */}
        <select
          className="w-full border p-2 rounded mb-3"
          value={tamanho}
          onChange={(e) => {
            setTamanho(e.target.value);
            setSabor1(null);
            setSabor2(null);
          }}
        >
          <option value="pequena">Pequena</option>
          <option value="media">Média</option>
          <option value="grande">Grande</option>
        </select>
        {/* sabor 1 */}
        <select
          className="w-full border p-2 rounded mb-3"
          value={sabor1?.id || ""}
          onChange={(e) => setSabor1(pizzas.find((p) => p.id === e.target.value))}
        >
          <option value="">Sabor 1</option>
          {pizzas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} - R$ {Number(p.prices?.[tamanho]).toFixed(2)}
            </option>
          ))}
        </select>
        {/* sabor 2 */}
        <select
          className="w-full border p-2 rounded mb-3"
          value={sabor2?.id || ""}
          onChange={(e) => setSabor2(pizzas.find((p) => p.id === e.target.value))}
        >
          <option value="">Sabor 2</option>
          {pizzas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} - R$ {Number(p.prices?.[tamanho]).toFixed(2)}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 bg-yellow-500 text-white py-2 rounded-lg shadow hover:bg-yellow-600 transition"
          >
            Adicionar
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔹 Cardápio
export default function Cardapio() {
  const cart = useCart();
  const { config } = useLojaConfig("daypizza");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [meioMeioOpen, setMeioMeioOpen] = useState(false);

  // 🔹 Produtos em tempo real
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

  // 🔹 Agrupar por subcategoria
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        config={config}
        onCartClick={() => setOpen(true)}
        cartCount={cart.items.reduce((a, i) => a + i.qty, 0)}
        onSearchChange={setSearch}
      />

      {/* Banner */}
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

        {/* Categorias fixas */}
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

        {/* Meio a Meio */}
        {activeCategory === "Pizza" && (
          <div className="mt-2 mb-6 flex justify-center">
            <button
              onClick={() => setMeioMeioOpen(true)}
              className="px-5 py-2 bg-yellow-500 text-white rounded-xl shadow hover:bg-yellow-600"
            >
              🍕 Pedir Pizza Meio a Meio
            </button>
          </div>
        )}

        {/* Produtos agrupados */}
        <div className="w-full max-w-6xl mx-auto space-y-10">
          {Object.keys(groupedProducts).length > 0 ? (
            Object.entries(groupedProducts).map(([sub, items]) => (
              <div key={sub}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-1">
                  {sub}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {items.map((p) => (
                    <ProductCard key={p.id} p={p} onAdd={cart.add} />
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
        whatsapp={config?.whatsapp}   // ✅ agora usa o mesmo número configurado no admin
      />

      <MeioMeioModal
        open={meioMeioOpen}
        onClose={() => setMeioMeioOpen(false)}
        products={products}
        onAdd={cart.add}
      />

      {/* Rodapé */}
      <p className="text-center text-gray-500 mt-6">
        Imagens meramente ilustrativas
      </p>
      {config?.instagram && (
        <div className="flex justify-center mt-4 mb-6">
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-black hover:text-red-700 text-lg font-semibold"
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
