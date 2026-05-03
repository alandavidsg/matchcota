'use client';

import { useEffect, useState } from 'react';
import { usePanelContext } from '../layout';
import { MessageSquare, Phone, Mail, CheckCircle, XCircle, Clock, PawPrint } from 'lucide-react';

type Solicitud = {
  id: string;
  nombre_adoptante: string;
  email_adoptante: string;
  telefono_adoptante: string;
  mensaje: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  mascotas: { name: string; image: string; type: string } | null;
};

const estadoConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
  aprobada:  { label: 'Aprobada',  color: 'bg-green-100 text-green-600',  icon: CheckCircle },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-500',     icon: XCircle },
};

export default function PanelSolicitudes() {
  const { token } = usePanelContext();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchSolicitudes() {
    const res = await fetch('/api/refugios/solicitudes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSolicitudes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (token) fetchSolicitudes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function updateEstado(id: string, estado: string) {
    setUpdating(id);
    await fetch(`/api/refugios/solicitudes/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    setSolicitudes((prev) =>
      prev.map((s) => s.id === id ? { ...s, estado: estado as Solicitud['estado'] } : s)
    );
    setUpdating(null);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Solicitudes de adopción</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {solicitudes.filter((s) => s.estado === 'pendiente').length} pendiente{solicitudes.filter((s) => s.estado === 'pendiente').length !== 1 ? 's' : ''} de {solicitudes.length} total
        </p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <MessageSquare size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Aún no tienes solicitudes de adopción</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {solicitudes.map((s) => {
            const cfg = estadoConfig[s.estado];
            const EstadoIcon = cfg.icon;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  {/* Mascota */}
                  {s.mascotas?.image && (
                    <img
                      src={s.mascotas.image}
                      alt={s.mascotas.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="font-semibold text-[#1a1a2e] text-sm">
                          {s.mascotas?.name ?? 'Mascota'}
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          {new Date(s.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <EstadoIcon size={11} /> {cfg.label}
                      </span>
                    </div>

                    {/* Adoptante */}
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-sm font-medium text-[#1a1a2e]">{s.nombre_adoptante}</p>
                      <div className="flex flex-wrap gap-3">
                        <a href={`mailto:${s.email_adoptante}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition">
                          <Mail size={12} /> {s.email_adoptante}
                        </a>
                        {s.telefono_adoptante && (
                          <a href={`tel:${s.telefono_adoptante}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition">
                            <Phone size={12} /> {s.telefono_adoptante}
                          </a>
                        )}
                      </div>
                      {s.mensaje && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{s.mensaje}"</p>
                      )}
                    </div>

                    {/* Actions */}
                    {s.estado === 'pendiente' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={updating === s.id}
                          onClick={() => updateEstado(s.id, 'aprobada')}
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          <CheckCircle size={12} /> Aprobar
                        </button>
                        <button
                          disabled={updating === s.id}
                          onClick={() => updateEstado(s.id, 'rechazada')}
                          className="flex items-center gap-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          <XCircle size={12} /> Rechazar
                        </button>
                      </div>
                    )}
                    {s.estado !== 'pendiente' && (
                      <button
                        onClick={() => updateEstado(s.id, 'pendiente')}
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        Volver a pendiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
