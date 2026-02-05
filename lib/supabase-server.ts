// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const cookieStore = await cookies();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => cookieStore.get(key)?.value ?? null,
          setItem: () => {
            // cookies are server-owned; if you need to set cookies,
            // do it in a Route Handler using NextResponse cookies.
          },
          removeItem: () => {
            // same note as setItem
          },
        },
      },
    }
  );

  return supabase;
}
