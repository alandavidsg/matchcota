-- ============================================================
-- Control de gasto de IA (Gemini/Groq) — Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Contador global de llamadas a IA por día (compartido entre todas las
--    instancias serverless; el rate limit en memoria de lib/rateLimit.ts
--    es por-IP y por-instancia, esto es la vista global).
create table if not exists public.ai_usage (
  service  text not null,
  day      date not null default current_date,
  count    int  not null default 0,
  alerted  boolean not null default false,
  primary key (service, day)
);

-- 2. Incrementa el contador de forma atómica y avisa (una sola vez por día)
--    cuando se cruza el umbral. No bloquea nada, solo informa.
create or replace function public.increment_ai_usage(p_service text, p_threshold int)
returns table(new_count int, just_crossed boolean)
language plpgsql
security definer
as $$
declare
  v_count int;
  v_alerted boolean;
  v_just_crossed boolean := false;
begin
  insert into public.ai_usage (service, day, count)
  values (p_service, current_date, 1)
  on conflict (service, day) do update set count = ai_usage.count + 1
  returning count, alerted into v_count, v_alerted;

  if p_threshold is not null and v_count >= p_threshold and not v_alerted then
    update public.ai_usage set alerted = true where service = p_service and day = current_date;
    v_just_crossed := true;
  end if;

  return query select v_count, v_just_crossed;
end;
$$;

-- 3. Descripción visual cacheada por mascota (evita re-analizar y
--    re-enviar la misma foto a Gemini en cada búsqueda de mascota perdida).
alter table public.mascotas
  add column if not exists visual_description text;
