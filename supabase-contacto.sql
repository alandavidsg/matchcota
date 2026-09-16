-- ============================================================
-- Formulario de contacto — Ejecutar en Supabase SQL Editor
-- ============================================================
-- El formulario de /contacto existía desde siempre pero no enviaba a ningún
-- lado: el botón solo mostraba "Mensaje enviado" y el texto se perdía.

create table if not exists public.contacto (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  email       text not null,
  mensaje     text not null,
  created_at  timestamptz not null default now()
);

-- RLS: nadie escribe ni lee directo desde el cliente; solo la API con service
-- role. Mismo patrón que feedback, refugios y avistamientos.
alter table public.contacto enable row level security;
