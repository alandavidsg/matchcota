import { NextRequest, NextResponse } from 'next/server';
import { getRefugioFromRequest } from '../../../../lib/supabase-admin';

export async function GET(req: NextRequest) {
  const refugio = await getRefugioFromRequest(req);
  if (!refugio) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json(refugio);
}
