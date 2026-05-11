import { NextResponse } from 'next/server';

export async function GET() {
  const payload = {
    ok: true,
    service: 'phulpur24-web',
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    },
  };

  return NextResponse.json(payload, { status: 200 });
}

