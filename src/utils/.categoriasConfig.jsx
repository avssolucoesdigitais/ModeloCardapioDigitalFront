import { FaPizzaSlice } from "react-icons/fa";
import { GiSodaCan, GiFrenchFries, GiHotDog } from "react-icons/gi";

export const CATEGORIES = [
  { id: "Pizza", nome: "Pizza", icon: () => <FaPizzaSlice />, color: "bg-red-500" },
  { id: "Acai", nome: "Açaí", icon: () => <>🍧</>, color: "bg-purple-500" },
  { id: "Hamburguer", nome: "Hambúrguer", icon: () => <>🍔</>, color: "bg-orange-500" },
  { id: "Pastel", nome: "Pastel", icon: () => <>🥟</>, color: "bg-yellow-500" },
  { id: "HotDog", nome: "Hot Dog", icon: () => <GiHotDog />, color: "bg-pink-500" },
  { id: "Batata", nome: "Batata Frita", icon: () => <GiFrenchFries />, color: "bg-green-500" },
  { id: "Bebida", nome: "Bebidas", icon: () => <GiSodaCan />, color: "bg-blue-500" },
  { id: "Promocao", nome: "Promoção do Dia", icon: () => <>🔥</>, color: "bg-gray-700" },
];

export const CATEGORY_FIELDS = {
  Pizza: { produtos: true, adicionais: true, bordas: true },
  Acai: { produtos: true, bases: true, adicionais: true, combos: true },
  Hamburguer: { produtos: true, adicionais: true, combos: true },
  Pastel: { produtos: true, adicionais: true },
  HotDog: { produtos: true, adicionais: true },
  Batata: { produtos: true, adicionais: true },
  Bebida: { produtos: true, adicionais: false },
  Promocao: { combos: true },
};

export function initialDocFor(categoryId) {
  const base = { categoria: categoryId, produtos: [], adicionais: [], bordas: [], bases: [], combos: [] };

  if (categoryId === "Promocao") {
    return { categoria: categoryId, combos: [] };
  }

  if (categoryId === "Acai") {
    return {
      categoria: "Acai",
      produtos: [],
      bases: [],
      adicionais: [],
      combos: [],
    };
  }

  return base;
}
