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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat y lng requeridos' }, { status: 400 });
  }

  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return NextResponse.json({ lugares: [] });

  try {
    // 11134 = Veterinarian, 11135 = Animal Shelter
    const params = new URLSearchParams({
      ll: `${lat},${lng}`,
      categories: '11134,11135',
      radius: '15000',
      limit: '10',
      fields: 'fsq_id,name,geocodes,categories,location,tel,distance',
    });

    const res = await fetch(`https://api.foursquare.com/v3/places/nearby?${params}`, {
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
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

    const lugares: Lugar[] = (data.results ?? [])
      .map((place: Record<string, unknown>) => {
        const geocodes = place.geocodes as { main?: { latitude: number; longitude: number } } | undefined;
        const loc = geocodes?.main;
        if (!loc) return null;

        const distancia = haversine(lat, lng, loc.latitude, loc.longitude);
        const categories = (place.categories as { id: number; name: string }[]) ?? [];
        const isVet = categories.some((c) => c.id === 11134);
        const tipo: 'veterinaria' | 'refugio' = isVet ? 'veterinaria' : 'refugio';

        const location = place.location as { address?: string; locality?: string } | undefined;
        const direccion = [location?.address, location?.locality].filter(Boolean).join(', ') || null;

        return {
          id: place.fsq_id as string,
          nombre: place.name as string,
          tipo,
          distancia: Math.round(distancia * 10) / 10,
          lat: loc.latitude,
          lng: loc.longitude,
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
