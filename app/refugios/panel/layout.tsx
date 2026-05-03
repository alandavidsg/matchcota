'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { PawPrint, LayoutDashboard, Heart, MessageSquare, LogOut, Menu, X } from 'lucide-react';

type Refugio = {
  id: string;
  nombre: string;
  email: string;
  region: string | null;
  aprobado: boolean;
};

type PanelContextType = {
  refugio: Refugio | null;
  token: string;
};

export const PanelContext = createContext<PanelContextType>({ refugio: null, token: '' });
export const usePanelContext = () => useContext(PanelContext);

const navLinks = [
  { href: '/refugios/panel', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/refugios/panel/mascotas', label: 'Mascotas', icon: Heart },
  { href: '/refugios/panel/solicitudes', label: 'Solicitudes', icon: MessageSquare },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [refugio, setRefugio] = useState<Refugio | null>(null);
  const [token, setToken] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/refugios/login');
        return;
      }

      const res = await fetch('/api/refugios/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        await supabase.auth.signOut();
        router.replace('/refugios/login');
        return;
      }

      const data = await res.json();
      setRefugio(data);
      setToken(session.access_token);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/refugios/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <PawPrint size={40} className="text-orange-400 animate-bounce mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <PanelContext.Provider value={{ refugio, token }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top bar */}
        <header className="bg-[#1a1a2e] text-white px-5 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <a href="/" className="flex items-center gap-2">
              <PawPrint size={20} className="text-orange-400" />
              <span className="font-semibold text-sm">PetMatch</span>
            </a>
            <span className="text-white/30 text-sm hidden md:block">/ Panel</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                  pathname === href
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={15} /> {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs hidden md:block">{refugio?.nombre}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition"
            >
              <LogOut size={15} />
              <span className="hidden md:block">Salir</span>
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-[#1a1a2e] pt-16">
            <nav className="flex flex-col p-5 gap-2">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition ${
                    pathname === href
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={18} /> {label}
                </a>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white text-base mt-4"
              >
                <LogOut size={18} /> Cerrar sesión
              </button>
            </nav>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8">
          {children}
        </main>
      </div>
    </PanelContext.Provider>
  );
}
