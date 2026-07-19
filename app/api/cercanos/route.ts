import { NextRequest, NextResponse } from 'next/server';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// IDs de categoría Foursquare (taxonomía nueva, strings hex; los enteros del v3
// legacy 11134/11135 ya no son válidos).
const CAT_VETERINARIA = '4d954af4a243a5684765b473';
const CAT_REFUGIO = '4e52d2d203646f7c19daa8ae';
const CATEGORIA = { veterinaria: CAT_VETERINARIA, refugio: CAT_REFUGIO } as const;

// API v3 legacy (api.foursquare.com) fue dada de baja; la nueva vive en
// places-api.foursquare.com, con Bearer token y header de versión obligatorio.
const FSQ_API_VERSION = '2025-06-17';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat y lng requeridos' }, { status: 400 });
  }

  // Radio configurable: /reportar usa el default (15km, lugares "aquí cerca");
  // la ficha de mascota pide un radio amplio para SIEMPRE mostrar el más cercano
  // real aunque quede en otra comuna. La API nueva topa el radio en 100km.
  const radiusParam = parseInt(searchParams.get('radius') ?? '', 10);
  const radius = Math.min(Math.max(isNaN(radiusParam) ? 15000 : radiusParam, 1000), 100000);

  // tipo opcional: filtra por una sola categoría. Sin tipo, busca ambas (default).
  const tipoParam = searchParams.get('tipo');
  const categories =
    tipoParam === 'refugio' || tipoParam === 'veterinaria'
      ? CATEGORIA[tipoParam]
      : `${CATEGORIA.veterinaria},${CATEGORIA.refugio}`;

  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return NextResponse.json({ lugares: [] });

  try {
    // Redondea a ~1.1km de grilla para que usuarios cercanos entre sí compartan
    // la misma URL de Foursquare y reusen el caché de Next.js (el free tier bajó
    // a 500 llamadas/mes). La distancia mostrada igual se calcula con lat/lng
    // exactos del usuario más abajo, no se pierde precisión ahí.
    const roundCoord = (n: number) => Math.round(n * 100) / 100;

    const params = new URLSearchParams({
      ll: `${roundCoord(lat)},${roundCoord(lng)}`,
      fsq_category_ids: categories,
      radius: String(radius),
      sort: 'DISTANCE',
      limit: '10',
    });

    const res = await fetch(`https://places-api.foursquare.com/places/search?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'X-Places-Api-Version': FSQ_API_VERSION,
      },
      next: { revalidate: 86400 }, // cache 24h por celda de grilla
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Foursquare error:', res.status, err);
      return NextResponse.json({ lugares: [] });
    }

    const data = await res.json();

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

    // Extrae lat/lng tolerando ambos formatos: nuevo (latitude/longitude al tope)
    // y legacy (geocodes.main.{latitude,longitude}).
    const extraerCoords = (place: Record<string, unknown>): { lat: number; lng: number } | null => {
      const geocodes = place.geocodes as { main?: { latitude: number; longitude: number } } | undefined;
      if (geocodes?.main) return { lat: geocodes.main.latitude, lng: geocodes.main.longitude };
      if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
        return { lat: place.latitude, lng: place.longitude };
      }
      return null;
    };

    const lugares: Lugar[] = (data.results ?? [])
      .map((place: Record<string, unknown>) => {
        const coords = extraerCoords(place);
        if (!coords) return null;

        const distancia = haversine(lat, lng, coords.lat, coords.lng);
        const cats = (place.categories as { fsq_category_id?: string; name?: string }[]) ?? [];
        const isVet = cats.some((c) => c.fsq_category_id === CAT_VETERINARIA);
        const tipo: 'veterinaria' | 'refugio' = isVet ? 'veterinaria' : 'refugio';

        const location = place.location as { address?: string; locality?: string } | undefined;
        const direccion = [location?.address, location?.locality].filter(Boolean).join(', ') || null;

        return {
          id: (place.fsq_place_id ?? place.fsq_id) as string,
          nombre: place.name as string,
          tipo,
          distancia: Math.round(distancia * 10) / 10,
          lat: coords.lat,
          lng: coords.lng,
          telefono: (place.tel as string) ?? null,
          direccion,
        };
      })
      .filter(Boolean)
      .sort((a: Lugar, b: Lugar) => a.distancia - b.distancia)
      .slice(0, 6);

    return NextResponse.json({ lugares });
  } catch (err) {
    console.error('cercanos error:', err);
    return NextResponse.json({ lugares: [] });
  }
}
