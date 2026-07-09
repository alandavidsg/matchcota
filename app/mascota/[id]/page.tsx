import type { Metadata } from 'next';
import { headers } from 'next/headers';
import PetDetailClient from './PetDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// URL de pruebas mientras matchcota.cl está en modo "Próximamente"; al lanzar, cambiar a https://matchcota.cl
const SITE_URL = 'https://matchcotacl-alan-s-team.vercel.app';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    console.log('[generateMetadata] running for id:', id);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log('[generateMetadata] supabaseUrl exists:', !!supabaseUrl);
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('[generateMetadata] missing env vars');
      return { title: 'Matchcota fallback' };
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/mascotas?id=eq.${id}&select=name,type,breed,age,location,description,image&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'no-store',
      }
    );

    console.log('[generateMetadata] fetch status:', res.status);
    if (!res.ok) {
      return { title: 'Matchcota fallback' };
    }

    const rows: { name: string; type: string; breed: string; age: string; location: string; description: string; image: string }[] = await res.json();
    const pet = rows[0];

    console.log('[generateMetadata] rows count:', rows.length, 'pet:', pet?.name);
    if (!pet) {
      return { title: 'Matchcota fallback' };
    }

    const title = `${pet.name} · Adopción en Matchcota 🐾`;
    const breed = pet.breed ? `${pet.type} ${pet.breed}` : pet.type;
    const desc = `${breed}${pet.age ? `, ${pet.age}` : ''} · ${pet.location}. ${pet.description ? pet.description.slice(0, 100) : 'Ayúdame a encontrar un hogar lleno de amor.'}`;
    const url = `${SITE_URL}/mascota/${id}`;

    // Servir imagen via proxy propio (evita problema de tamaño con WhatsApp)
    const rawImage = pet.image || '';
    const image = rawImage
      ? `${SITE_URL}/api/og-image?url=${encodeURIComponent(rawImage)}`
      : `${SITE_URL}/og-default.png`;

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        url,
        siteName: 'Matchcota',
        locale: 'es_CL',
        type: 'website',
        images: [{ url: image, width: 1200, height: 630, alt: `${pet.name} en adopción` }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: desc,
        images: [image],
      },
    };
  } catch (err) {
    console.error('[generateMetadata] error:', err);
    return { title: 'Matchcota fallback' };
  }
}

export default async function PetPage({ params }: Props) {
  // Opt into dynamic rendering — prevents Vercel from pre-rendering this page
  headers();
  const { id } = await params;
  return <PetDetailClient id={id} />;
}
