import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ProfileRow } from '@/lib/supabase/types';

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

export function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function requireStaff(
  allowedRoles: ProfileRow['role'][],
  request?: Request
): Promise<
  | {
      ok: true;
      user: { id: string; email: string | null; fullName: string; role: ProfileRow['role'] };
    }
  | { ok: false; response: NextResponse }
> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.',
        },
        503
      ),
    };
  }

  let authUser: { id: string; email?: string | null } | null = null;
  const header = request?.headers.get('authorization') ?? '';
  const tokenMatch = header.match(/^Bearer\s+(.+)$/i);
  if (tokenMatch) {
    const token = tokenMatch[1].trim();
    if (!token) {
      return { ok: false, response: json({ ok: false, error: 'Empty bearer token.' }, 401) };
    }
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return { ok: false, response: json({ ok: false, error: 'Invalid or expired bearer token.' }, 401) };
    }
    authUser = { id: data.user.id, email: data.user.email };
  }

  if (!authUser) {
    const sessionClient = await createSupabaseServer();
    const {
      data: { user },
      error: sessionErr,
    } = await sessionClient.auth.getUser();
    if (sessionErr || !user) {
      return { ok: false, response: json({ ok: false, error: 'You must be signed in.' }, 401) };
    }
    authUser = { id: user.id, email: user.email };
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id,email,full_name,role,auth_user_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return {
      ok: false,
      response: json({ ok: false, error: 'Profile is missing or unavailable.' }, 403),
    };
  }

  if (!allowedRoles.includes(profile.role)) {
    return { ok: false, response: json({ ok: false, error: 'Insufficient permissions.' }, 403) };
  }

  return {
    ok: true,
    user: {
      id: authUser.id,
      email: authUser.email ?? null,
      fullName: profile.full_name || authUser.email || 'Admin',
      role: profile.role,
    },
  };
}
