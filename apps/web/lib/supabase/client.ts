import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase para el navegador (auth + colección). El contenido del sitio
// sigue viniendo de JSON estático; Supabase solo entra en runtime para el
// desbloqueo de imanes y la colección sincronizada del usuario.
//
// Las variables NEXT_PUBLIC_* se inlinean en build. Si faltan (build sin backend),
// `supabase` es null y `supabaseEnabled` es false → el gating se desactiva y la
// experiencia inmersiva se muestra como antes (degradación segura, no rompe el sitio).

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
