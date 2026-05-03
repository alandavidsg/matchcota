import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest, supabaseAdmin } from '../../../../../lib/supabase-admin';

async function getMascotaIfOwned(id: string, refugioId: string) {
  const { data } = await supabaseAdmin
    .from('mascotas')
    .select('id')
    .eq('id', id)
    .eq('refugio_id', refugioId)
    .single();
  return data;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const owned = await getMascotaIfOwned(id, refugio.id);
  if (!owned) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const body = await req.json();
  const { name, type, breed, age, location, description, image, urgente, available } = body;

  const { data, error } = await supabaseAdmin
    .from('mascotas')
    .update({ name, type, breed, age, location, description, image, urgente, available })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const owned = await getMascotaIfOwned(id, refugio.id);
  if (!owned) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const { error } = await supabaseAdmin.from('mascotas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
