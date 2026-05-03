import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest, supabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET(req: NextRequest) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('mascotas')
    .select('*')
    .eq('refugio_id', refugio.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, type, breed, age, location, description, image, urgente } = body;

    if (!name || !type || !image) {
      return NextResponse.json({ error: 'Nombre, tipo e imagen son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('mascotas').insert({
      name,
      type,
      breed: breed || null,
      age: age || null,
      location: location || null,
      description: description || null,
      image,
      urgente: urgente ?? false,
      available: true,
      refugio_id: refugio.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('mascotas POST error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
