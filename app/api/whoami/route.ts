import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  return Response.json({
    ok: !error,
    error: error?.message ?? null,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
  });
}
