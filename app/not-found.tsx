import Link from 'next/link';
import { PawPrint, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">

        {/* Ícono animado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center">
              <PawPrint size={56} className="text-orange-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#1a1a2e] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">?</span>
            </div>
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-6xl font-bold text-[#1a1a2e] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">
          Esta página se escapó
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          La página que buscas no existe o fue movida. Pero no te preocupes, hay muchas mascotas esperándote.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition"
          >
            <Home size={16} />
            Ir al inicio
          </Link>
          <Link
            href="/catalogo"
            className="flex items-center justify-center gap-2 border border-gray-200 hover:border-orange-400 text-gray-600 hover:text-orange-500 font-medium py-3 px-6 rounded-xl transition"
          >
            <Search size={16} />
            Ver mascotas
          </Link>
        </div>

      </div>
    </main>
  );
}
