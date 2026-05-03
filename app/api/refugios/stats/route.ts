import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest, supabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET(req: NextRequest) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [mascotas, solicitudes] = await Promise.all([
    supabaseAdmin.from('mascotas').select('id, available').eq('refugio_id', refugio.id),
    supabaseAdmin.from('solicitudes').select('id, estado').eq('refugio_id', refugio.id),
  ]);

  const total = mascotas.data?.length ?? 0;
  const disponibles = mascotas.data?.filter((m) => m.available).length ?? 0;
  const adoptadas = total - disponibles;
  const pendientes = solicitudes.data?.filter((s) => s.estado === 'pendiente').length ?? 0;

  return NextResponse.json({ total, disponibles, adoptadas, pendientes });
}
