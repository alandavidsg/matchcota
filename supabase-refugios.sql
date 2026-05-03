-- ============================================================
-- Panel de Refugios — Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de refugios
create table if not exists public.refugios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  nombre      text not null,
  email       text not null,
  telefono    text,
  region      text,
  descripcion text,
  logo        text,
  aprobado    boolean default true,
  created_at  timestamptz default now()
);

-- 2. Agregar columna refugio_id a mascotas (si no existe)
alter table public.mascotas
  add column if not exists refugio_id uuid references public.refugios(id);

-- 3. Tabla de solicitudes de adopción
create table if not exists public.solicitudes (
  id                  uuid primary key default gen_random_uuid(),
  mascota_id          int references public.mascotas(id) on delete cascade,
  refugio_id          uuid references public.refugios(id),
  nombre_adoptante    text not null,
  email_adoptante     text not null,
  telefono_adoptante  text,
  mensaje             text,
  estado              text default 'pendiente'
                      check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at          timestamptz default now()
);

-- ============================================================
-- Supabase Storage: crear bucket "mascotas" (hacer manualmente
-- desde el panel Storage → New bucket → nombre: mascotas → Public)
-- ============================================================
