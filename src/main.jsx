import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

const lang = navigator.language || navigator.userLanguage;
document.documentElement.lang = lang.substring(0, 2);


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" reverseOrder={false} />
  </StrictMode>
);