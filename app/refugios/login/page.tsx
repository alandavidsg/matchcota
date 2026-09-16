'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { PawPrint, Mail, Lock, LogIn, AlertCircle, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function RefugioLogin() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'recuperar'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  function cambiarModo(nuevo: 'login' | 'recuperar') {
    setModo(nuevo);
    setError('');
    setEnlaceEnviado(false);
  }

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

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // El origen sale de la URL en la que está el refugio, así no hay que acordarse
    // de cambiar nada el día que matchcota.cl salga del modo "Próximamente".
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/refugios/recuperar`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    // Se confirma igual exista o no la cuenta: responder "ese email no está
    // registrado" le permitiría a cualquiera averiguar qué refugios tienen cuenta.
    setEnlaceEnviado(true);
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <PawPrint size={28} className="text-orange-500" />
          </div>
        </div>

        {modo === 'login' ? (
          <>
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
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-xs text-gray-400">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => cambiarModo('recuperar')}
                    className="text-xs text-orange-500 font-medium hover:underline"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
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
          </>
        ) : enlaceEnviado ? (
          <div className="text-center">
            <div className="flex justify-center mb-4"><CheckCircle size={48} className="text-green-500" /></div>
            <h1 className="text-lg font-semibold text-[#1a1a2e] mb-2">Revisa tu correo</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Si <span className="text-[#1a1a2e] font-medium">{email}</span> tiene una cuenta de refugio,
              le acaba de llegar un enlace para elegir una contraseña nueva. Vence en una hora.
            </p>
            <button
              onClick={() => cambiarModo('login')}
              className="text-sm text-orange-500 font-medium hover:underline flex items-center gap-1 mx-auto"
            >
              <ArrowLeft size={14} /> Volver al login
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[#1a1a2e] text-center mb-1">Recuperar contraseña</h1>
            <p className="text-gray-400 text-sm text-center mb-7">
              Te mandamos un enlace al correo con el que registraste tu refugio
            </p>

            <form onSubmit={handleRecuperar} className="flex flex-col gap-4">
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
                <Send size={16} />
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <button
              onClick={() => cambiarModo('login')}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto mt-5"
            >
              <ArrowLeft size={14} /> Volver al login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
