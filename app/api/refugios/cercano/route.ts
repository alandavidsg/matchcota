import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

// Distancia en km entre dos puntos (haversine)
function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Devuelve el refugio aprobado más cercano a las coordenadas dadas
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '');
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '');

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'lat y lng son requeridos' }, { status: 400 });
  }

  const { data: refugios, error } = await supabaseAdmin
    .from('refugios')
    .select('id, nombre, telefono, region, lat, lng')
    .eq('aprobado', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (error) {
    return NextResponse.json({ error: 'Error consultando refugios' }, { status: 500 });
  }
  if (!refugios || refugios.length === 0) {
    return NextResponse.json({ refugio: null });
  }

  let nearest = refugios[0];
  let minDist = distanciaKm(lat, lng, nearest.lat, nearest.lng);
  for (const r of refugios.slice(1)) {
    const d = distanciaKm(lat, lng, r.lat, r.lng);
    if (d < minDist) {
      minDist = d;
      nearest = r;
    }
  }

  return NextResponse.json({
    refugio: {
      nombre: nearest.nombre,
      telefono: nearest.telefono,
      region: nearest.region,
      lat: nearest.lat,
      lng: nearest.lng,
    },
    distancia_km: minDist,
  });
}
