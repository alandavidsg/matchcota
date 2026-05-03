import { createClient } from '@supabase/supabase-js';

// Cliente con service_role — solo usar en rutas de servidor (API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Extrae y valida el JWT del header Authorization, devuelve el user o null */
export async function getUserFromToken(token: string | null | undefined) {
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/** Obtiene el refugio asociado al token de la request */
export async function getRefugioFromRequest(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await getUserFromToken(token);
  if (!user) return null;

  const { data: refugio } = await supabaseAdmin
    .from('refugios')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return refugio ?? null;
}
