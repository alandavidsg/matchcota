'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { PawPrint, Lock, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';

export default function RecuperarPassword() {
  const router = useRouter();

  // El enlace del correo trae la sesión de recuperación en el hash de la URL y
  // supabase-js la canjea sola al cargar el módulo. Acá solo hay que preguntarle
  // si quedó una sesión viva: si no hay, el enlace venció o ya se usó.
  const [verificando, setVerificando] = useState(true);
  const [enlaceValido, setEnlaceValido] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setEnlaceValido(true);
        setVerificando(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setEnlaceValido(true);
      setVerificando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setListo(true);
    setTimeout(() => router.push('/refugios/panel'), 1800);
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <PawPrint size={28} className="text-orange-500" />
          </div>
        </div>

        {verificando ? (
          <p className="text-gray-400 text-sm text-center py-6">Verificando el enlace...</p>
        ) : !enlaceValido ? (
          <>
            <h1 className="text-xl font-bold text-[#1a1a2e] text-center mb-1">Enlace no válido</h1>
            <p className="text-gray-400 text-sm text-center mb-6">
              El enlace ya venció o se usó antes. Pide uno nuevo desde el login.
            </p>
            <a
              href="/refugios/login"
              className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition"
            >
              Volver al login
            </a>
          </>
        ) : listo ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4"><CheckCircle size={48} className="text-green-500" /></div>
            <h1 className="text-lg font-semibold text-[#1a1a2e] mb-1">Contraseña actualizada</h1>
            <p className="text-gray-400 text-sm">Entrando al panel...</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[#1a1a2e] text-center mb-1">Nueva contraseña</h1>
            <p className="text-gray-400 text-sm text-center mb-7">Elige una contraseña para tu refugio</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nueva contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Repítela</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <KeyRound size={16} />
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
