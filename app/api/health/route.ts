export async function GET() {
  // Safe to expose: URLs and "is set" booleans. Do NOT expose keys or secrets.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  return Response.json({
    ok: true,
    ts: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      STRIPE_SECRET_KEY_SET: !!process.env.STRIPE_SECRET_KEY,
      GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
    },
  });
}
