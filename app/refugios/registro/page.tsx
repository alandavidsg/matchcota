'use client';

import { useState } from 'react';
import { PawPrint, Building2, Mail, Lock, Phone, MapPin, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

export default function RefugioRegistro() {
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmar: '',
    telefono: '', region: '', descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/refugios/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        region: form.region,
        descripcion: form.descripcion,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Error al registrar');
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">¡Refugio registrado!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Tu cuenta ha sido creada correctamente. Ya puedes ingresar al panel.
          </p>
          <a
            href="/refugios/login"
            className="block bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition text-center"
          >
            Ir al login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
            <PawPrint size={28} className="text-orange-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#1a1a2e] text-center mb-1">Registrar Refugio</h1>
        <p className="text-gray-400 text-sm text-center mb-7">Crea tu cuenta para gestionar mascotas en adopción</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nombre del refugio *</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="Refugio Patitas Felices"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email *</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="contacto@refugio.cl"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Teléfono + Región */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Teléfono</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => set('telefono', e.target.value)}
                  placeholder="+56 9..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Región</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.region}
                  onChange={(e) => set('region', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 bg-white"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Seleccionar</option>
                  {REGIONES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Descripción</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={form.descripcion}
                onChange={(e) => set('descripcion', e.target.value)}
                rows={3}
                placeholder="Cuéntanos sobre tu refugio..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 resize-none"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Contraseña *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Confirmar *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={form.confirmar}
                  onChange={(e) => set('confirmar', e.target.value)}
                  placeholder="Repetir contraseña"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  style={{ fontSize: '16px' }}
                />
              </div>
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
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          ¿Ya tienes cuenta?{' '}
          <a href="/refugios/login" className="text-orange-500 font-medium hover:underline">
            Ingresar
          </a>
        </p>
      </div>
    </main>
  );
}
