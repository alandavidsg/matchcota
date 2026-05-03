'use client';

import { useEffect, useState } from 'react';
import { usePanelContext } from '../layout';
import { Plus, PawPrint, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type Mascota = {
  id: number;
  name: string;
  type: string;
  breed: string;
  age: string;
  location: string;
  image: string;
  available: boolean;
  urgente: boolean;
};

export default function PanelMascotas() {
  const { token } = usePanelContext();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchMascotas() {
    const res = await fetch('/api/refugios/mascotas', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMascotas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (token) fetchMascotas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function toggleAvailable(mascota: Mascota) {
    await fetch(`/api/refugios/mascotas/${mascota.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mascota, available: !mascota.available }),
    });
    fetchMascotas();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres eliminar esta mascota?')) return;
    setDeletingId(id);
    await fetch(`/api/refugios/mascotas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMascotas((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <PawPrint size={36} className="text-orange-300 animate-bounce" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Mis mascotas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{mascotas.length} publicada{mascotas.length !== 1 ? 's' : ''}</p>
        </div>
        <a
          href="/refugios/panel/mascotas/nueva"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} /> Nueva mascota
        </a>
      </div>

      {mascotas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <PawPrint size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Aún no has publicado mascotas</p>
          <a
            href="/refugios/panel/mascotas/nueva"
            className="inline-flex items-center gap-2 mt-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition"
          >
            <Plus size={14} /> Publicar primera mascota
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {mascotas.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
            >
              <img
                src={m.image}
                alt={m.name}
                className="w-16 h-16 object-cover rounded-xl shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1a1a2e] text-sm">{m.name}</span>
                  {m.urgente && (
                    <span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
                      <AlertTriangle size={10} /> Urgente
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    m.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {m.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{m.breed} · {m.age} · {m.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAvailable(m)}
                  title={m.available ? 'Marcar como adoptada' : 'Marcar como disponible'}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition"
                >
                  {m.available
                    ? <XCircle size={16} className="text-gray-400" />
                    : <CheckCircle size={16} className="text-green-500" />}
                </button>
                <a
                  href={`/refugios/panel/mascotas/${m.id}/editar`}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-orange-50 flex items-center justify-center transition"
                >
                  <Pencil size={15} className="text-gray-400 hover:text-orange-500" />
                </a>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center transition"
                >
                  <Trash2 size={15} className={deletingId === m.id ? 'text-gray-200' : 'text-gray-400 hover:text-red-500'} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
