'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { PawPrint, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function RefugioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    router.push('/refugios/panel');
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <PawPrint size={28} className="text-orange-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#1a1a2e] text-center mb-1">Panel de Refugios</h1>
        <p className="text-gray-400 text-sm text-center mb-7">Ingresa con tu cuenta de refugio</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="refugio@email.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <LogIn size={16} />
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          ¿No tienes cuenta?{' '}
          <a href="/refugios/registro" className="text-orange-500 font-medium hover:underline">
            Regístrala aquí
          </a>
        </p>
      </div>
    </main>
  );
}
