// Importa o que precisa
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxxFKIFkvinNvA4WljPMQX66wbZtz8H78",
  authDomain: "cardapio01-8afbd.firebaseapp.com",
  projectId: "cardapio01-8afbd",
  storageBucket: "cardapio01-8afbd.firebasestorage.app",
  messagingSenderId: "1053119908233",
  appId: "1:1053119908233:web:2bae1e88ca94190db83958"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
