import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, region, descripcion } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
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
