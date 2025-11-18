import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

  console.log("firebaseConfig:", firebaseConfig);
const firebaseConfig = {
  apiKey: "AIzaSyBpBVNv93rvcEe-brq-8F-sdczhZ5Agmtw",
  authDomain: "cardapio-c5695.firebaseapp.com",
  projectId: "cardapio-c5695",
  storageBucket: "cardapio-c5695.firebasestorage.app",
  messagingSenderId: "733934320699",
  appId: "1:733934320699:web:5b8eb2156145327e08701e"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
