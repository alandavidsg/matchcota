-- ============================================================
-- "Necesita operación" — Ejecutar en Supabase SQL Editor
-- ============================================================

alter table public.mascotas
  add column if not exists necesita_operacion boolean not null default false;
