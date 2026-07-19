'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, ExternalLink, Loader2 } from 'lucide-react';

type Props = {
  petName: string;
  petLocation?: string | null;
  lat: number;
  lng: number;
  tipo?: 'refugio' | 'veterinaria';
  onClose: () => void;
};

type Lugar = {
  id: string;
  nombre: string;
  tipo: 'veterinaria' | 'refugio';
  distancia: number;
  lat: number;
  lng: number;
  telefono: string | null;
  direccion: string | null;
};

// Textos por tipo de lugar
const TIPOS = {
  refugio: {
    titulo: 'Refugio más cercano',
    query: 'refugio de animales',
    articulo: 'el refugio más cercano',
    verMas: 'Ver más refugios',
    vacio: 'refugios',
  },
  veterinaria: {
    titulo: 'Veterinaria más cercana',
    query: 'veterinaria',
    articulo: 'la veterinaria más cercana',
    verMas: 'Ver más veterinarias',
    vacio: 'veterinarias',
  },
} as const;

export default function RefugioMapModal({ petName, petLocation, lat, lng, tipo = 'refugio', onClose }: Props) {
  const t = TIPOS[tipo];
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca el lugar real más cercano por DISTANCIA (Foursquare vía /api/cercanos),
  // con radio amplio para que siempre aparezca el más próximo aunque esté en otra
  // comuna. Antes se usaba una búsqueda de texto en Google, que resolvía por
  // relevancia y devolvía lugares famosos a cientos de km.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(`/api/cercanos?lat=${lat}&lng=${lng}&tipo=${tipo}&radius=200000`);
        const data = await res.json();
        const masCercano: Lugar | undefined = (data.lugares ?? [])[0];
        if (!cancelado) setLugar(masCercano ?? null);
      } catch {
        if (!cancelado) setLugar(null);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [lat, lng, tipo]);

  // Destino exacto cuando tenemos el lugar (por coordenadas, no por texto).
  // Si no hay lugar, cae a la búsqueda de texto anterior como último recurso.
  const destinoTexto = petLocation
    ? `${t.query} cerca de ${petLocation}`
    : `${t.query} cerca de ${lat},${lng}`;
  const destino = lugar ? `${lugar.lat},${lugar.lng}` : encodeURIComponent(destinoTexto);
  const embedUrl = `https://maps.google.com/maps?saddr=${lat},${lng}&daddr=${destino}&hl=es&output=embed`;
  const rutaUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${destino}`;
  const todosUrl = `https://www.google.com/maps/search/${encodeURIComponent(t.query)}/@${lat},${lng},12z`;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#1a1a2e]">
            <MapPin size={18} className="text-orange-500" />
            <span className="font-semibold text-sm">{t.titulo}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50">
            <Loader2 size={28} className="animate-spin text-orange-400" />
            <p className="text-sm">Buscando {t.articulo}...</p>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={`Ruta desde donde se vio a ${petName} hasta ${t.articulo}`}
            className="w-full h-96 border-0 block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}

        <div className="p-5">
          {!loading && lugar ? (
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#1a1a2e]">{lugar.nombre}</p>
              <p className="text-xs text-gray-400">
                a {lugar.distancia} km
                {lugar.direccion ? ` · ${lugar.direccion}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">
              El punto A marca dónde se vio a {petName} por última vez y el punto B {t.articulo},
              con la ruta entre ambos.
            </p>
          )}
          <div className="flex gap-2">
            <a
              href={rutaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold transition"
            >
              <ExternalLink size={15} /> Cómo llegar
            </a>
            <a
              href={todosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-orange-400 text-[#1a1a2e] rounded-xl py-3 text-sm font-semibold transition"
            >
              <ExternalLink size={15} /> {t.verMas}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
