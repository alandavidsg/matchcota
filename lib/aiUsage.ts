import { Resend } from 'resend';
import { supabaseAdmin } from './supabase-admin';

type AiService = 'groq_search' | 'groq_analyze';

// Umbral diario a partir del cual se avisa por email (no bloquea nada).
// Elegidos para avisar bastante antes de que el gasto diario se vuelva
// significativo, dado el costo por llamada de cada servicio.
const ALERT_THRESHOLDS: Record<AiService, number> = {
  groq_search: 80,
  groq_analyze: 300,
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'alansaldias@gmail.com';

/** Registra una llamada a un servicio de IA y avisa por email si se cruza el umbral diario. No bloquea el flujo si falla. */
export async function trackAiUsage(service: AiService) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('increment_ai_usage', { p_service: service, p_threshold: ALERT_THRESHOLDS[service] })
      .single();

    if (error) {
      console.error('trackAiUsage rpc error:', error);
      return;
    }

    const { new_count, just_crossed } = data as { new_count: number; just_crossed: boolean };
    if (just_crossed) await sendUsageAlert(service, new_count);
  } catch (err) {
    console.error('trackAiUsage failed:', err);
  }
}

async function sendUsageAlert(service: AiService, count: number) {
  console.warn(`[ai-usage] ${service} alcanzó ${count} llamadas hoy (${new Date().toLocaleDateString('es-CL')})`);
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'Matchcota <notificaciones@matchcota.cl>',
      to: ALERT_EMAIL,
      subject: `⚠️ Uso alto de IA en Matchcota: ${service}`,
      html: `<p>El servicio <b>${service}</b> lleva <b>${count}</b> llamadas hoy. Revisa el consumo en la consola de Gemini/Groq si no lo esperabas — este aviso no bloquea la función, solo informa.</p>`,
    });
  } catch (err) {
    console.error('sendUsageAlert error:', err);
  }
}
