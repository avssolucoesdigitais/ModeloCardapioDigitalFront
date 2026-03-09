export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-100 mt-10">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Copyright Section */}
          <div className="text-gray-400 text-sm order-2 md:order-1">
            © {currentYear} • Todos os direitos reservados.
          </div>

          {/* Branding Section */}
          <div className="flex items-center gap-3 order-1 md:order-2 group cursor-pointer">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Desenvolvido por
              </span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                Avante Software
              </span>
              <span className="text-[10px] text-blue-500 font-semibold -mt-1">
                Soluções Digitais
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}