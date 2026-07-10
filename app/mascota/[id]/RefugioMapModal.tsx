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

        <iframe
          src={embedUrl}
          title={`Refugios cercanos a ${petName}`}
          className="w-full h-96 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">
            Refugios de animales cerca de la última ubicación donde se vio a {petName}.
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
