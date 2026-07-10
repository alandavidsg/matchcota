'use client';

import { useState } from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';

type Props = {
  petName: string;
  lat: number;
  lng: number;
  onClose: () => void;
};

export default function RefugioMapModal({ petName, lat, lng, onClose }: Props) {
  const [view, setView] = useState<'refugios' | 'ubicacion'>('refugios');

  // Vista refugios: búsqueda de refugios reales cerca de la última ubicación del animal.
  // Vista ubicación: pin de Google anclado en el punto exacto donde se vio al animal.
  const refugiosUrl = `https://maps.google.com/maps?q=refugio%20de%20animales&sll=${lat},${lng}&ll=${lat},${lng}&z=13&hl=es&output=embed`;
  const ubicacionUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=es&output=embed`;
  const openMapsUrl = `https://www.google.com/maps/search/refugio+de+animales/@${lat},${lng},13z`;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#1a1a2e]">
            <MapPin size={18} className="text-orange-500" />
            <span className="font-semibold text-sm">Refugios cercanos</span>
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

        {/* Toggle de vistas */}
        <div className="flex gap-1.5 px-5 pt-3 pb-2.5">
          <button
            type="button"
            onClick={() => setView('refugios')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              view === 'refugios' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            🏠 Refugios cercanos
          </button>
          <button
            type="button"
            onClick={() => setView('ubicacion')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              view === 'ubicacion' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            🐾 Dónde se vio a {petName}
          </button>
        </div>

        <iframe
          key={view}
          src={view === 'refugios' ? refugiosUrl : ubicacionUrl}
          title={view === 'refugios' ? `Refugios cercanos a ${petName}` : `Última ubicación de ${petName}`}
          className="w-full h-96 border-0 block"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">
            {view === 'refugios'
              ? `Refugios de animales cerca de donde se vio a ${petName} por última vez.`
              : `El pin marca el punto exacto donde se vio a ${petName} por última vez.`}
          </p>
          <a
            href={openMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold transition"
          >
            <ExternalLink size={15} /> Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
