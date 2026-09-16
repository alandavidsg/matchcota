import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'alansaldias@gmail.com';

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
      // Nace en revisión: un refugio aprobado recibe las solicitudes de adopción
      // de su zona, con el nombre, el correo y el teléfono de quien quiere
      // adoptar. Eso no puede quedar abierto a cualquiera que llene el
      // formulario, y menos con el email sin verificar.
      aprobado: false,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    if (refugioError) {
      // Revertir: eliminar el usuario creado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Error al crear perfil del refugio' }, { status: 500 });
    }

    // Aviso para poder aprobarlo: sin esto el refugio queda esperando en
    // silencio y nadie se entera de que hay algo que revisar.
    if (resend) {
      resend.emails.send({
        from: 'Matchcota <notificaciones@matchcota.cl>',
        to: ALERT_EMAIL,
        subject: `🏠 Nuevo refugio por aprobar: ${nombre}`,
        html: `
          <p><b>${nombre}</b> se registró y está esperando aprobación.</p>
          <p><b>Email:</b> ${email}<br>
          ${telefono ? `<b>Teléfono:</b> ${telefono}<br>` : ''}
          ${region ? `<b>Región:</b> ${region}<br>` : ''}
          ${coords ? `<b>Ubicación:</b> ${coords.lat}, ${coords.lng}` : '<b>Ubicación:</b> sin coordenadas'}</p>
          ${descripcion ? `<p><b>Descripción:</b> ${descripcion}</p>` : ''}
          <p style="color:#888;font-size:13px;">Para aprobarlo: Supabase → Table Editor → refugios → poner <code>aprobado</code> en true. Hasta entonces no recibe solicitudes ni aparece como refugio cercano.</p>
        `,
      }).catch((err) => console.error('aviso de registro error:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('registro refugio error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
