-- ─────────────────────────────────────────────────────────────────────────────
-- Nunna — Colección de personajes (QR único + guardado opcional)
-- Esquema Supabase/Postgres. Aplicar en el SQL Editor del proyecto Supabase
-- (dhhesajpexcyainibwvl) o vía `supabase db push`.
--
-- Resumen:
--   • user_unlocks       → la colección de cada usuario (qué personajes guardó).
--   • save_personaje()   → RPC server-side que guarda un personaje en la colección.
--   • count_collectors() → contador público de cuántas personas guardaron a un personaje.
--
-- Historia: hasta 2026-10 cada tarjeta traía un código de 6 caracteres que se canjeaba
-- (`unlock_codes` + `redeem_code`/`check_code_valid`/`check_code_status`). Se retiró al
-- pasar a un QR único por personaje (docs/PLAN-QR-UNICO.md). La tabla vieja quedó
-- renombrada a `unlock_codes_archivo` como respaldo (ver migración al pie).
--
-- Seguridad: el único camino de escritura de la colección es la RPC `save_personaje`
-- (SECURITY DEFINER). "Solo por QR" se decide en el cliente — no es una garantía server-side.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.user_unlocks (
  user_id         uuid not null references auth.users (id) on delete cascade,
  personaje_slug  text not null,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, personaje_slug)
);

comment on table public.user_unlocks is
  'Colección de cada usuario: qué personajes ha guardado. Fuente de verdad sincronizada entre dispositivos.';

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.user_unlocks enable row level security;

-- user_unlocks: cada usuario lee SOLO su propia colección.
drop policy if exists "user_unlocks_select_own" on public.user_unlocks;
create policy "user_unlocks_select_own"
  on public.user_unlocks
  for select
  using (auth.uid() = user_id);

-- (Sin policies de INSERT/UPDATE/DELETE → la colección solo se modifica vía RPC.)

-- ── RPC de guardado ──────────────────────────────────────────────────────────
-- Guarda un personaje en la colección del usuario autenticado.
--   status ∈ {ok, already_yours, invalid, not_authenticated}
-- El slug solo se valida por formato: el catálogo vive en JSON (no en la base) y el
-- cliente ignora slugs desconocidos al pintar la colección.

create or replace function public.save_personaje(p_slug text)
returns table (status text, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return query select 'not_authenticated'::text, null::text;
    return;
  end if;

  p_slug := lower(btrim(coalesce(p_slug, '')));
  if p_slug !~ '^[a-z0-9-]{1,64}$' then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  insert into public.user_unlocks (user_id, personaje_slug)
    values (v_uid, p_slug)
    on conflict (user_id, personaje_slug) do nothing;

  if found then
    return query select 'ok'::text, p_slug;
  else
    return query select 'already_yours'::text, p_slug;
  end if;
end;
$$;

revoke all on function public.save_personaje(text) from public;
grant execute on function public.save_personaje(text) to authenticated;

-- ── RPC de contador anónimo ───────────────────────────────────────────────────
-- Devuelve cuántas personas han guardado un personaje.
-- Accesible sin sesión (anon) — no revela qué usuarios, solo el total.

create or replace function public.count_collectors(p_slug text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.user_unlocks where personaje_slug = p_slug;
$$;

revoke all on function public.count_collectors(text) from public;
grant execute on function public.count_collectors(text) to anon;
grant execute on function public.count_collectors(text) to authenticated;

-- ── Migración desde el sistema de códigos (una sola vez, ya aplicada en prod) ─
-- Se corre DESPUÉS de desplegar el front que ya no llama a estas RPC.
-- La tabla se renombra (no se borra) para conservar el historial de canjes.
--
-- drop function if exists public.redeem_code(text, text);
-- drop function if exists public.check_code_valid(text, text);
-- drop function if exists public.check_code_status(text, text);
-- alter table if exists public.unlock_codes rename to unlock_codes_archivo;
