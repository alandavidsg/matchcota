'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Phone, Navigation, MapPin } from 'lucide-react';

type Refugio = {
  nombre: string;
  telefono: string | null;
  region: string | null;
  lat: number;
  lng: number;
};

type Props = {
  petName: string;
  lat: number;
  lng: number;
  onClose: () => void;
};

export default function RefugioMapModal({ petName, lat, lng, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [refugio, setRefugio] = useState<Refugio | null>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/refugios/cercano?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((d) => {
        setRefugio(d.refugio ?? null);
        setDistancia(d.distancia_km ?? null);
      })
      .catch(() => setRefugio(null))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  useEffect(() => {
    if (!refugio || !mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: true });
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const petIcon = L.divIcon({
      html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🐾</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const refugioIcon = L.divIcon({
      html: '<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🏠</div>',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    L.marker([lat, lng], { icon: petIcon }).addTo(map).bindPopup(`Última ubicación de ${petName}`);
    L.marker([refugio.lat, refugio.lng], { icon: refugioIcon }).addTo(map).bindPopup(refugio.nombre);

    L.polyline(
      [
        [lat, lng],
        [refugio.lat, refugio.lng],
      ],
      { color: '#e86c00', weight: 3, dashArray: '8 8', opacity: 0.8 }
    ).addTo(map);

    map.fitBounds(
      [
        [lat, lng],
        [refugio.lat, refugio.lng],
      ],
      { padding: [50, 50] }
    );

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [refugio, lat, lng, petName]);

  const distanciaTxt =
    distancia == null ? '' : distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`;

  const directionsUrl = refugio
    ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${refugio.lat},${refugio.lng}`
    : '';

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4">
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

        {loading ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Buscando refugio cercano...</div>
        ) : !refugio ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400 text-sm gap-2 px-8 text-center">
            <span className="text-3xl">🏠</span>
            Aún no hay refugios con ubicación registrada cerca.
          </div>
        ) : (
          <>
            <div ref={mapRef} className="h-72 w-full" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-[#1a1a2e]">{refugio.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {refugio.region ? `${refugio.region} · ` : ''}a {distanciaTxt} de donde se vio a {petName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold transition"
                >
                  <Navigation size={15} /> Cómo llegar
                </a>
                {refugio.telefono && (
                  <a
                    href={`tel:${refugio.telefono.replace(/\s/g, '')}`}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-orange-400 text-[#1a1a2e] rounded-xl py-3 text-sm font-semibold transition"
                  >
                    <Phone size={15} /> Llamar
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
