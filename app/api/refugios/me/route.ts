import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromToken } from '../../../../lib/supabase-admin';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserFromToken(token);

  // Sesión inválida o vencida: hay que volver a entrar.
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: refugio } = await supabaseAdmin
    .from('refugios')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // La cuenta existe y la contraseña es correcta, pero no tiene refugio asociado
  // (se borró la fila, o el registro falló a medias). Se separa del 401 a
  // propósito: el panel trataba los dos casos igual y devolvía al login sin decir
  // nada, así que parecía que la contraseña estaba mala.
  if (!refugio) {
    return NextResponse.json({ error: 'sin_refugio', email: user.email }, { status: 404 });
  }

  return NextResponse.json(refugio);
}
