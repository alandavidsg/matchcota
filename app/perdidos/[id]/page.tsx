'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, MapPin, Phone, Mail, Coins, Link2, Check, CheckCircle, PawPrint, ExternalLink, Calendar } from 'lucide-react';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.856L.057 23.571a.75.75 0 00.92.92l5.715-1.474A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.502-5.2-1.382l-.373-.215-3.865.997.997-3.865-.215-.373A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

type LostPet = {
  id: number;
  nombre: string;
  tipo: string;
  raza: string;
  color: string;
  descripcion: string;
  imagen: string;
  ultima_ubicacion: string;
  lat: number | null;
  lng: number | null;
  recompensa: number;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string | null;
  encontrada: boolean;
  created_at: string;
};

// Normaliza un teléfono chileno a formato internacional para wa.me
function waNumber(tel: string): string {
  const digits = tel.replace(/\D/g, '');
  if (digits.startsWith('56')) return digits;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  return digits;
}

export default function LostPetPage() {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<LostPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    supabase.from('mascotas_perdidas').select('*').eq('id', id).single()
      .then(({ data }) => { setPet(data ?? null); setLoading(false); });
  }, [id]);

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${pet?.nombre ?? 'Mascota'} perdida · Matchcota`, url }); } catch { /* usuario canceló */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* portapapeles no disponible */ }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PawPrint size={40} className="text-gray-300 animate-pulse" />
      </main>
    );
  }

  if (!pet) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <PawPrint size={48} className="text-gray-300" />
        <p className="text-gray-400">Esta publicación no existe o fue eliminada.</p>
        <a href="/perdidos" className="text-orange-500 font-medium text-sm hover:underline">Volver a mascotas perdidas</a>
      </main>
    );
  }

  const waText = encodeURIComponent(
    `Hola ${pet.contacto_nombre}! Vi tu publicación de ${pet.nombre || 'tu mascota'} perdida en Matchcota y quiero ayudar. 🐾`
  );
  const mapUrl = pet.lat != null && pet.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${pet.lat},${pet.lng}`
    : null;
  const fecha = new Date(pet.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <a href="/perdidos" className="text-gray-400 text-sm mb-6 flex items-center gap-1 hover:text-gray-600 transition">
          <ArrowLeft size={16} /> Volver a mascotas perdidas
        </a>

        {pet.encontrada && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-4 flex items-center gap-2 text-sm font-medium">
            <CheckCircle size={18} /> ¡Buenas noticias! Esta mascota ya fue encontrada.
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden md:flex">
          {/* Foto */}
          <div className="md:w-1/2 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pet.imagen} alt={pet.nombre || 'Mascota perdida'} className="w-full h-72 md:h-full object-cover" />
            {pet.recompensa > 0 && (
              <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                <Coins size={15} /> Recompensa ${pet.recompensa.toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="md:w-1/2 p-6 md:p-8">
            <h1 className="text-3xl font-bold text-[#1a1a2e]">{pet.nombre || 'Sin nombre'}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {[pet.tipo, pet.raza, pet.color].filter(Boolean).join(' · ')}
            </p>

            {pet.descripcion && (
              <p className="text-gray-600 text-sm leading-relaxed mt-4">{pet.descripcion}</p>
            )}

            <div className="mt-5 flex flex-col gap-2 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <MapPin size={15} className="text-orange-500 mt-0.5 shrink-0" />
                <span>Visto por última vez en <strong className="text-[#1a1a2e]">{pet.ultima_ubicacion}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={15} className="text-orange-500 shrink-0" />
                <span>Publicado el {fecha} por <strong className="text-[#1a1a2e]">{pet.contacto_nombre}</strong></span>
              </div>
            </div>

            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 text-sm font-medium transition">
                <ExternalLink size={14} /> Ver el punto exacto en Google Maps
              </a>
            )}

            {/* Contacto */}
            <div className="mt-6 flex flex-col gap-2.5">
              {pet.contacto_telefono && (
                <a href={`https://wa.me/${waNumber(pet.contacto_telefono)}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-2xl py-3.5 text-sm font-semibold transition touch-manipulation">
                  <WhatsAppIcon /> WhatsApp a {pet.contacto_nombre}
                </a>
              )}
              <div className="flex gap-2.5">
                {pet.contacto_telefono && (
                  <a href={`tel:${pet.contacto_telefono.replace(/\s/g, '')}`}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-orange-400 text-[#1a1a2e] rounded-2xl py-3 text-sm font-semibold transition touch-manipulation">
                    <Phone size={15} /> Llamar
                  </a>
                )}
                {pet.contacto_email && (
                  <a href={`mailto:${pet.contacto_email}?subject=${encodeURIComponent(`Sobre ${pet.nombre || 'tu mascota'} perdida — Matchcota`)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-orange-400 text-[#1a1a2e] rounded-2xl py-3 text-sm font-semibold transition touch-manipulation">
                    <Mail size={15} /> Correo
                  </a>
                )}
              </div>
              <button type="button" onClick={shareLink}
                className="self-center flex items-center gap-1.5 text-gray-400 hover:text-orange-500 text-xs font-medium transition py-1 touch-manipulation">
                {linkCopied ? <><Check size={13} className="text-green-500" /> Enlace copiado</> : <><Link2 size={13} /> Compartir enlace</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
