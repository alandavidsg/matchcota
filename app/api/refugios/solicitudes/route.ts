import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest, supabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET(req: NextRequest) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('solicitudes')
    .select('*, mascotas(name, image, type)')
    .eq('refugio_id', refugio.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
