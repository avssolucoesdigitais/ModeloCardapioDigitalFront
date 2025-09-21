import logo from "/src/assets/logo.png";

export default function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-gray-500 text-sm flex items-center justify-center">
      <span> © {new Date().getFullYear()} - Produzido por SASP.DEV </span>
      <img src={logo} alt="logo" className="h-10 w-10 object-contain ml-2" />
    </footer>
  );
}
