-- ============================================================
-- Sugerencias de mejora ("Ayúdanos a mejorar") — Ejecutar en Supabase SQL Editor
-- ============================================================

create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  mensaje     text not null,
  email       text,
  pagina      text,
  created_at  timestamptz not null default now()
);

-- RLS: nadie puede leer/escribir directo desde el cliente; solo la API
-- (con service role) inserta y lee. Igual que refugios/avistamientos.
alter table public.feedback enable row level security;
