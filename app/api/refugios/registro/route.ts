import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { SITE_URL } from '../../../../lib/siteUrl';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'alansaldias@gmail.com';

// El botón del aviso lleva directo a la tabla donde se aprueba.
const TABLA_REFUGIOS = 'https://supabase.com/dashboard/project/zwvrutncspbqlsapsknd/editor';

// El refugio escribe estos datos en un formulario público y terminan dentro de
// un correo que abrimos nosotros: si alguien pone etiquetas, se ven como texto.
const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
            <span style="font-size:28px;font-weight:bold;color:#e86c00;">Matchcota</span>
            <p style="color:#aaaaaa;font-size:13px;margin:6px 0 0;">Plataforma de adopción de mascotas</p>
          </td>
        </tr>

        <!-- Alerta -->
        <tr>
          <td style="background:#fff3e6;padding:16px 32px;border-bottom:1px solid #fde8c8;">
            <p style="margin:0;color:#e86c00;font-weight:bold;font-size:15px;">🏠 Un refugio nuevo está esperando tu aprobación</p>
          </td>
        </tr>

        <!-- Refugio -->
        <tr>
          <td style="padding:28px 32px 4px;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:bold;color:#1a1a2e;">${escapar(nombre)}</p>
            <p style="margin:0;font-size:13px;color:#aaa;">Se acaba de registrar y todavía no recibe nada.</p>
          </td>
        </tr>

        <!-- Datos -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:14px;font-weight:bold;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;">Datos del refugio</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eeeeee;">
                  <span style="font-size:12px;color:#999;">Email</span><br>
                  <a href="mailto:${escapar(email)}" style="font-size:15px;color:#e86c00;text-decoration:none;">${escapar(email)}</a>
                </td>
              </tr>
              ${telefono ? `<tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eeeeee;">
                  <span style="font-size:12px;color:#999;">Teléfono</span><br>
                  <a href="tel:${escapar(telefono)}" style="font-size:15px;color:#e86c00;text-decoration:none;">${escapar(telefono)}</a>
                </td>
              </tr>` : ''}
              ${region ? `<tr>
                <td style="padding:12px 16px;border-bottom:1px solid #eeeeee;">
                  <span style="font-size:12px;color:#999;">Región</span><br>
                  <span style="font-size:15px;color:#1a1a2e;font-weight:600;">${escapar(region)}</span>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:12px 16px;">
                  <span style="font-size:12px;color:#999;">Ubicación</span><br>
                  ${coords
                    ? `<a href="https://www.google.com/maps?q=${coords.lat},${coords.lng}" style="font-size:15px;color:#e86c00;text-decoration:none;">Ver en el mapa (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})</a>`
                    : `<span style="font-size:15px;color:#b45309;font-weight:600;">Sin coordenadas</span><br><span style="font-size:12px;color:#b45309;">Aunque lo apruebes no va a recibir nada: la cercanía se calcula con estas coordenadas. Conviene escribirle y pedirle que las capture.</span>`}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${descripcion ? `<!-- Descripción -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">Cómo se describen</p>
            <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${escapar(descripcion).replace(/\n/g, '<br>')}</p>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 20px;text-align:center;">
            <a href="${TABLA_REFUGIOS}" style="display:inline-block;background:#e86c00;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px;">
              Aprobar en Supabase
            </a>
          </td>
        </tr>

        <!-- Cómo se aprueba -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              En la tabla <b>refugios</b>, pon <b>aprobado</b> en <b>true</b>. Mientras tanto puede entrar al panel y cargar sus mascotas, pero no le llegan solicitudes de adopción ni avisos de mascotas cerca de él.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">
              Este email fue enviado automáticamente por Matchcota.<br>
              <a href="${SITE_URL}" style="color:#e86c00;text-decoration:none;">matchcota.cl</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch((err) => console.error('aviso de registro error:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('registro refugio error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
