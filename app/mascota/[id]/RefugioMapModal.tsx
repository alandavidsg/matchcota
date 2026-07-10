'use client';

import { X, MapPin, ExternalLink } from 'lucide-react';

type Props = {
  petName: string;
  lat: number;
  lng: number;
  onClose: () => void;
};

export default function RefugioMapModal({ petName, lat, lng, onClose }: Props) {
  // Mapa de Google embebido con la búsqueda de refugios cerca de la última ubicación del animal
  const embedUrl = `https://maps.google.com/maps?q=refugio%20de%20animales&sll=${lat},${lng}&ll=${lat},${lng}&z=13&hl=es&output=embed`;
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

        <div className="relative">
          <iframe
            src={embedUrl}
            title={`Refugios cercanos a ${petName}`}
            className="w-full h-96 border-0 block"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          {/* Pin de la última ubicación del animal — el mapa está centrado en ese punto */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
            <div className="bg-[#1a1a2e] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1">
              🐾 {petName} — visto por última vez aquí
            </div>
            <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-[#1a1a2e]" />
            <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-md -mt-0.5" />
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">
            El pin marca dónde se vio a {petName} por última vez; los resultados del mapa son los refugios cercanos. Si mueves el mapa, el pin deja de coincidir — ciérralo y ábrelo para recentrar.
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
