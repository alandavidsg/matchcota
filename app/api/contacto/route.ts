import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit } from '../../../lib/rateLimit';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'alansaldias@gmail.com';

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed } = rateLimit(ip, 5); // 5 mensajes por minuto por IP
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados envíos. Espera un momento.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : '';

    if (!nombre) return NextResponse.json({ error: 'Falta tu nombre.' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Revisa tu email.' }, { status: 400 });
    }
    if (mensaje.length < 5) return NextResponse.json({ error: 'Cuéntanos un poco más.' }, { status: 400 });
    if (mensaje.length > 2000) return NextResponse.json({ error: 'Mensaje demasiado largo.' }, { status: 400 });
    if (nombre.length > 120) return NextResponse.json({ error: 'Nombre demasiado largo.' }, { status: 400 });

    // Se guarda y se manda por correo, y basta con que UNA de las dos funcione
    // para dar el mensaje por recibido. Confirmarle "enviado" a alguien cuyo
    // mensaje se perdió es justamente lo que hacía esta página antes.
    const { error: insertError } = await supabaseAdmin
      .from('contacto')
      .insert({ nombre, email, mensaje });

    if (insertError) console.error('contacto insert error:', insertError);

    let emailEnviado = false;
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Matchcota <notificaciones@matchcota.cl>',
          to: ALERT_EMAIL,
          replyTo: email, // responder el correo le contesta directo a la persona
          subject: `✉️ ${nombre} escribió desde el formulario de contacto`,
          html: `
            ${insertError ? '<p style="color:#b45309"><b>Ojo:</b> no se pudo guardar en la base de datos. Este correo es la única copia.</p>' : ''}
            <p><b>De:</b> ${escapar(nombre)} &lt;${escapar(email)}&gt;</p>
            <p><b>Mensaje:</b></p>
            <p>${escapar(mensaje).replace(/\n/g, '<br>')}</p>
          `,
        });
        emailEnviado = true;
      } catch (emailErr) {
        console.error('contacto email error:', emailErr);
      }
    }

    if (insertError && !emailEnviado) {
      return NextResponse.json({ error: 'No pudimos enviar tu mensaje. Intenta de nuevo.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contacto error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
