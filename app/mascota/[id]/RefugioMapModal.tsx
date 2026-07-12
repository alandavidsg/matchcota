'use client';

import { X, MapPin, ExternalLink } from 'lucide-react';

type Props = {
  petName: string;
  petLocation?: string | null;
  lat: number;
  lng: number;
  onClose: () => void;
};

export default function RefugioMapModal({ petName, petLocation, lat, lng, onClose }: Props) {
  // Modo direcciones del embed gratuito de Google: pin A anclado donde se vio al
  // animal, pin B en el refugio más cercano, con la ruta. El destino necesita
  // contexto de lugar para que Google lo resuelva (sin él muestra el mapamundi).
  const destino = petLocation
    ? `refugio de animales cerca de ${petLocation}`
    : `refugio de animales cerca de ${lat},${lng}`;
  const embedUrl = `https://maps.google.com/maps?saddr=${lat},${lng}&daddr=${encodeURIComponent(destino)}&hl=es&output=embed`;
  // Misma ruta pero en la app/web de Google Maps completa: ahí Google permite
  // ver y elegir entre los demás refugios que calzan con la búsqueda.
  const openMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destino)}`;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#1a1a2e]">
            <MapPin size={18} className="text-orange-500" />
            <span className="font-semibold text-sm">Refugio más cercano</span>
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
          title={`Ruta desde donde se vio a ${petName} hasta el refugio más cercano`}
          className="w-full h-96 border-0 block"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        <div className="p-5">
          <p className="text-xs text-gray-400 mb-3">
            El punto A marca dónde se vio a {petName} por última vez y el punto B el refugio más
            cercano, con la ruta entre ambos.
          </p>
          <a
            href={openMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold transition"
          >
            <ExternalLink size={15} /> Abrir ruta y más refugios en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
