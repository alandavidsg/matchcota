'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePanelContext } from '../../../layout';
import { ArrowLeft, Upload, PawPrint, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const TIPOS = ['Perro', 'Gato', 'Pájaro', 'Conejo', 'Otro'];
const EDADES = ['Cachorro', 'Joven', 'Adulto', 'Senior'];

export default function EditarMascota() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { token } = usePanelContext();

  const [form, setForm] = useState({
    tipo: '', raza: '', edad: '', location: '', description: '', urgente: false, available: true,
  });
  const [currentImage, setCurrentImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!token || !id) return;
    fetch('/api/refugios/mascotas', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((mascotas: { id: number; type: string; breed: string; age: string; location: string; description: string; urgente: boolean; available: boolean; image: string }[]) => {
        const m = mascotas.find((x) => String(x.id) === String(id));
        if (!m) { router.replace('/refugios/panel/mascotas'); return; }
        setForm({
          tipo: m.type ?? '',
          raza: m.breed ?? '',
          edad: m.age ?? '',
          location: m.location ?? '',
          description: m.description ?? '',
          urgente: m.urgente ?? false,
          available: m.available ?? true,
        });
        setCurrentImage(m.image ?? '');
        setLoading(false);
      });
  }, [token, id, router]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let imageUrl = currentImage;

      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadRes = await fetch('/api/refugios/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!uploadRes.ok) throw new Error('Error al subir imagen');
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const name = `${form.tipo}${form.raza ? ` ${form.raza}` : ''}`;
      const res = await fetch(`/api/refugios/mascotas/${id}`, {
        method: 'PUT',
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
          available: form.available,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Error al guardar');
      }

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <PawPrint size={36} className="text-orange-300 animate-bounce" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">¡Cambios guardados!</h2>
        <a href="/refugios/panel/mascotas" className="inline-block mt-4 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition">
          Volver a mis mascotas
        </a>
      </div>
    );
  }

  const displayImage = imagePreview || currentImage;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-300 transition">
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-[#1a1a2e]">Editar mascota</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
        {/* Imagen */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Foto</label>
          <label className="block cursor-pointer">
            {displayImage ? (
              <div className="relative">
                <img src={displayImage} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Cambiar foto</div>
              </div>
            ) : (
              <div className="h-40 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-orange-300 transition">
                <Upload size={24} className="text-gray-300" />
                <span className="text-sm text-gray-400">Subir nueva foto</span>
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
            placeholder="Descripción de la mascota..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 resize-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Switches */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.urgente} onChange={(e) => set('urgente', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-600">Adopción urgente</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={(e) => set('available', e.target.checked)} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-600">Disponible para adopción</span>
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
