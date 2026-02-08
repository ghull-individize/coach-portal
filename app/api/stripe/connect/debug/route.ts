import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await supabaseServer();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

  const userFromGetUser = userData.user
    ? { id: userData.user.id, email: userData.user.email }
    : null;

  const userFromSession = sessionData.session?.user
    ? { id: sessionData.session.user.id, email: sessionData.session.user.email }
    : null;

  return Response.json({
    ok: true,
    user_from_getUser: userFromGetUser,
    user_from_getSession: userFromSession,
    errors: {
      getUser: userErr?.message ?? null,
      getSession: sessionErr?.message ?? null,
    },
  });
}
