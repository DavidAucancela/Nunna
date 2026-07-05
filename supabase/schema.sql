-- ─────────────────────────────────────────────────────────────────────────────
-- Nunna — Desbloqueo de imanes + colección sincronizada
-- Esquema Supabase/Postgres. Aplicar en el SQL Editor del proyecto Supabase
-- (dhhesajpexcyainibwvl) o vía `supabase db push`.
--
-- Resumen:
--   • unlock_codes  → catálogo de códigos de 6 caracteres impresos bajo cada tarjeta.
--   • user_unlocks  → la colección de cada usuario (qué personajes ha desbloqueado).
--   • redeem_code() → RPC server-side que valida y canjea un código de forma atómica.
--
-- Seguridad: los códigos NUNCA se exponen a clientes (sin policies de SELECT).
-- El único camino de escritura es la RPC `redeem_code` (SECURITY DEFINER).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.unlock_codes (
  code            text primary key,
  personaje_slug  text not null,
  batch           text,
  created_at      timestamptz not null default now(),
  redeemed_by     uuid references auth.users (id) on delete set null,
  redeemed_at     timestamptz
);

comment on table public.unlock_codes is
  'Catálogo de códigos de 6 caracteres impresos bajo cada tarjeta de imán. Un código = una tarjeta = un canje.';

create index if not exists unlock_codes_personaje_slug_idx
  on public.unlock_codes (personaje_slug);

create table if not exists public.user_unlocks (
  user_id         uuid not null references auth.users (id) on delete cascade,
  personaje_slug  text not null,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, personaje_slug)
);

comment on table public.user_unlocks is
  'Colección de cada usuario: qué personajes ha desbloqueado. Fuente de verdad sincronizada entre dispositivos.';

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.unlock_codes enable row level security;
alter table public.user_unlocks enable row level security;

-- unlock_codes: SIN policies → ningún cliente (anon/authenticated) puede leer ni
-- escribir directo. Solo la RPC SECURITY DEFINER toca esta tabla.

-- user_unlocks: cada usuario lee SOLO su propia colección.
drop policy if exists "user_unlocks_select_own" on public.user_unlocks;
create policy "user_unlocks_select_own"
  on public.user_unlocks
  for select
  using (auth.uid() = user_id);

-- (Sin policies de INSERT/UPDATE/DELETE → la colección solo se modifica vía RPC.)

-- ── RPC de canje ─────────────────────────────────────────────────────────────
-- Canjea un código y añade el personaje a la colección del usuario autenticado.
-- Devuelve un estado tipado para que el frontend muestre el mensaje correcto.
--   status ∈ {ok, invalid, wrong_character, already_yours, already_redeemed_by_other, not_authenticated}
-- En 'ok' / 'already_yours' / 'wrong_character' devuelve también el personaje_slug real del código.
--
-- p_expected_slug (opcional): si se pasa, el código DEBE pertenecer a ese personaje;
-- si no coincide se devuelve 'wrong_character' y no se canjea nada. Así cada personaje
-- solo acepta sus propios códigos (control por personaje). En null → sin validación
-- (canjea el personaje que el código traiga; p. ej. la página genérica /desbloquear).

-- La firma cambió (se añadió un parámetro): hay que dropear la versión de 1 argumento.
drop function if exists public.redeem_code(text);

create or replace function public.redeem_code(p_code text, p_expected_slug text default null)
returns table (status text, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_slug text;
begin
  if v_uid is null then
    return query select 'not_authenticated'::text, null::text;
    return;
  end if;

  -- Normalizar: mayúsculas y sin espacios (coincide con la entrada del formulario).
  p_code := upper(btrim(p_code));

  select uc.personaje_slug into v_slug
  from public.unlock_codes uc
  where uc.code = p_code;

  if v_slug is null then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  -- El código es válido pero pertenece a otro personaje distinto al esperado.
  if p_expected_slug is not null and v_slug <> p_expected_slug then
    return query select 'wrong_character'::text, v_slug;
    return;
  end if;

  -- ¿Ya está este personaje en la colección del usuario? (p. ej. dos tarjetas del mismo ser)
  if exists (
    select 1 from public.user_unlocks uu
    where uu.user_id = v_uid and uu.personaje_slug = v_slug
  ) then
    return query select 'already_yours'::text, v_slug;
    return;
  end if;

  -- Reclamo atómico del código: solo gana quien lo canjea primero.
  update public.unlock_codes uc
    set redeemed_by = v_uid, redeemed_at = now()
    where uc.code = p_code and uc.redeemed_by is null;

  if not found then
    -- El código existe pero ya fue canjeado por otra cuenta.
    return query select 'already_redeemed_by_other'::text, v_slug;
    return;
  end if;

  insert into public.user_unlocks (user_id, personaje_slug)
    values (v_uid, v_slug)
    on conflict (user_id, personaje_slug) do nothing;

  return query select 'ok'::text, v_slug;
end;
$$;

-- Solo usuarios autenticados pueden canjear.
revoke all on function public.redeem_code(text, text) from public;
grant execute on function public.redeem_code(text, text) to authenticated;

-- ── RPC de pre-validación (sin auth) ─────────────────────────────────────────
-- Comprueba si un código existe y está sin canjear, ANTES de pedir el correo.
-- Devuelve true/false. No revela el personaje_slug ni datos del código.
-- Accesible sin sesión (anon) — la RLS de unlock_codes sigue bloqueando SELECT directo.
--
-- p_expected_slug (opcional): si se pasa, además exige que el código pertenezca a
-- ese personaje (rechaza códigos de otros personajes ya en la pre-validación).

-- La firma cambió (se añadió un parámetro): hay que dropear la versión de 1 argumento.
drop function if exists public.check_code_valid(text);

create or replace function public.check_code_valid(p_code text, p_expected_slug text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.unlock_codes
    where code = upper(btrim(p_code))
      and redeemed_by is null
      and (p_expected_slug is null or personaje_slug = p_expected_slug)
  );
$$;

revoke all on function public.check_code_valid(text, text) from public;
grant execute on function public.check_code_valid(text, text) to anon;
grant execute on function public.check_code_valid(text, text) to authenticated;

-- ── RPC de contador anónimo ───────────────────────────────────────────────────
-- Devuelve cuántas personas han desbloqueado un personaje.
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
