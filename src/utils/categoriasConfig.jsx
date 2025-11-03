import { FaPizzaSlice } from "react-icons/fa";
import { GiSodaCan, GiFrenchFries} from "react-icons/gi";
import LunchDiningIcon from '@mui/icons-material/LunchDining'; 


export const CATEGORIES = [
  { id: "Pizza", nome: "Pizza", icon: () => <></>, color: "bg-red-500" },
  { id: "Hamburguer", nome: "Hambúrguer", icon: () => <></>, color: "bg-orange-500" },
  { id: "Pastel", nome: "Pastel", icon: () => <></>, color: "bg-yellow-500" },
  { id: "Batata", nome: "Batata Frita", icon: () => <></>, color: "bg-green-500" },
  { id: "Bebida", nome: "Bebidas", icon: () => <></>, color: "bg-blue-500" },
  { id: "Promocao", nome: "Promoção do Dia", icon: () => <></>, color: "bg-gray-700" },
  { id: "Esfiha", nome: "Esfiha", icon: () => <></>, color: "bg-purple-500" },
  { id: "Calzone", nome: "Calzone", icon: () => <></>, color: "bg-indigo-500" },
  { id: "Salgados", nome: "Salgados", icon: () => <></>, color: "bg-amber-600" },
  { id: "Salgadinhos", nome: "Mini Salgadinhos", icon: () => <></>, color: "bg-teal-500" },
 

];

export const CATEGORY_FIELDS = {
  Pizza: { produtos: true, adicionais: true, bordas: true },
  Hamburguer: { produtos: true, adicionais: true, combos: true },
  Pastel: { produtos: true, adicionais: true },
  Batata: { produtos: true, adicionais: true },
  Bebida: { produtos: true, adicionais: false },
  Promocao: { combos: true },
  Esfiha: { produtos: true, adicionais: true },
  Calzone: { produtos: true, adicionais: true },
  Salgados: { produtos: true, adicionais: true },
  Salgadinhos: { produtos: true, adicionais: true },

};

export function initialDocFor(categoryId) {
  const base = {
    categoria: categoryId,
    produtos: [],
    adicionais: [],
    bordas: [],
    bases: [],
    combos: [],
  };

  if (categoryId === "Promocao") {
    return { categoria: categoryId, combos: [] };
  }

  return base;
}
