import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

// Geocodifica una región de Chile a coordenadas aproximadas (centro de la región)
async function geocodeRegion(region: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${region}, Chile`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'Matchcota/1.0' },
    });
    const data = await res.json();
    if (data?.[0]?.lat && data?.[0]?.lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch { /* sin geocodificación */ }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, region, descripcion, lat, lng } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
    }

    // Coordenadas: GPS del navegador si lo compartió, si no el centro de la región
    let coords: { lat: number; lng: number } | null =
      typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null;
    if (!coords && region) {
      coords = await geocodeRegion(region);
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
      }
      return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 400 });
    }

    // 2. Crear fila en tabla refugios
    const { error: refugioError } = await supabaseAdmin.from('refugios').insert({
      user_id: authData.user.id,
      nombre,
      email,
      telefono: telefono || null,
      region: region || null,
      descripcion: descripcion || null,
      aprobado: true,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    if (refugioError) {
      // Revertir: eliminar el usuario creado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Error al crear perfil del refugio' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('registro refugio error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
