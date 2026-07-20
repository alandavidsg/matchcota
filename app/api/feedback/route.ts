import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit } from '../../../lib/rateLimit';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'alansaldias@gmail.com';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed } = rateLimit(ip, 5); // 5 sugerencias por minuto por IP
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados envíos. Espera un momento.' }, { status: 429 });
  }

  try {
    const { mensaje, email, pagina } = await req.json();
    const texto = typeof mensaje === 'string' ? mensaje.trim() : '';

    if (!texto || texto.length < 5) {
      return NextResponse.json({ error: 'Cuéntanos un poco más.' }, { status: 400 });
    }
    if (texto.length > 2000) {
      return NextResponse.json({ error: 'Mensaje demasiado largo.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('feedback').insert({
      mensaje: texto,
      email: typeof email === 'string' && email.trim() ? email.trim() : null,
      pagina: typeof pagina === 'string' ? pagina.slice(0, 200) : null,
    });

    if (error) {
      console.error('feedback insert error:', error);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // Aviso por email, no bloquea la respuesta si falla
    if (resend) {
      resend.emails.send({
        from: 'Matchcota <notificaciones@matchcota.cl>',
        to: ALERT_EMAIL,
        subject: '💡 Nueva sugerencia en Matchcota',
        html: `
          <p><b>Sugerencia:</b></p>
          <p>${texto.replace(/\n/g, '<br>')}</p>
          ${email ? `<p><b>Email de contacto:</b> ${email}</p>` : ''}
          ${pagina ? `<p><b>Página:</b> ${pagina}</p>` : ''}
        `,
      }).catch((err) => console.error('feedback email error:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('feedback error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
