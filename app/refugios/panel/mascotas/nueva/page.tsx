'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePanelContext } from '../../layout';
import { ArrowLeft, Upload, PawPrint, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const TIPOS = ['Perro', 'Gato', 'Pájaro', 'Conejo', 'Otro'];
const EDADES = ['Cachorro', 'Joven', 'Adulto', 'Senior'];

export default function NuevaMascota() {
  const router = useRouter();
  const { token } = usePanelContext();

  const [form, setForm] = useState({
    tipo: '', raza: '', edad: '', location: '', description: '', urgente: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!imageFile) { setError('Debes subir una foto'); return; }
    if (!form.tipo) { setError('Selecciona el tipo de animal'); return; }

    setLoading(true);
    try {
      // 1. Subir imagen
      const fd = new FormData();
      fd.append('file', imageFile);
      const uploadRes = await fetch('/api/refugios/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!uploadRes.ok) throw new Error('Error al subir imagen');
      const { url: imageUrl } = await uploadRes.json();

      // 2. Crear mascota
      const name = `${form.tipo}${form.raza ? ` ${form.raza}` : ''}`;
      const res = await fetch('/api/refugios/mascotas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: form.tipo,
          breed: form.raza || null,
          age: form.edad || null,
          location: form.location || null,
          description: form.description || null,
          image: imageUrl,
          urgente: form.urgente,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Error al crear mascota');
      }

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">¡Mascota publicada!</h2>
        <p className="text-gray-400 text-sm mb-6">Ya aparece en el catálogo de adopción.</p>
        <div className="flex gap-3 justify-center">
          <a href="/refugios/panel/mascotas" className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition">
            Ver mis mascotas
          </a>
          <button onClick={() => { setDone(false); setForm({ tipo: '', raza: '', edad: '', location: '', description: '', urgente: false }); setImageFile(null); setImagePreview(''); }}
            className="bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 transition">
            Publicar otra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-300 transition">
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-[#1a1a2e]">Nueva mascota</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
        {/* Imagen */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Foto *</label>
          <label className="block cursor-pointer">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Cambiar foto</div>
              </div>
            ) : (
              <div className="h-40 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-orange-300 transition">
                <Upload size={24} className="text-gray-300" />
                <span className="text-sm text-gray-400">Subir foto</span>
                <span className="text-xs text-gray-300">JPG, PNG o WEBP</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        </div>

        {/* Tipo + Raza */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Tipo *</label>
            <select
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 bg-white"
              style={{ fontSize: '16px' }}
            >
              <option value="">Seleccionar</option>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Raza</label>
            <div className="relative">
              <PawPrint size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.raza}
                onChange={(e) => set('raza', e.target.value)}
                placeholder="Mestizo, Labrador..."
                className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Edad + Ubicación */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Edad</label>
            <select
              value={form.edad}
              onChange={(e) => set('edad', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 bg-white"
              style={{ fontSize: '16px' }}
            >
              <option value="">Seleccionar</option>
              {EDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Ubicación</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Santiago, RM"
                className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Cuéntanos sobre la mascota, su personalidad, necesidades especiales..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 resize-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Urgente */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.urgente}
            onChange={(e) => set('urgente', e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm text-gray-600">Marcar como adopción urgente</span>
        </label>

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
          {loading ? 'Publicando...' : 'Publicar mascota'}
        </button>
      </form>
    </div>
  );
}
