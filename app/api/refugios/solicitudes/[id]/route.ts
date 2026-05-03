import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest, supabaseAdmin } from '../../../../../lib/supabase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const { estado } = await req.json();

  if (!['aprobada', 'rechazada', 'pendiente'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('solicitudes')
    .update({ estado })
    .eq('id', id)
    .eq('refugio_id', refugio.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
