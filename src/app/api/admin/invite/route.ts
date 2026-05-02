import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const VALID_ROLES: ProfileRow['role'][] = [
  'admin',
  'editor',
  'reporter',
  'translator',
  'seo_editor',
  'sports_reporter',
  'local_correspondent',
];

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  if (!hasSupabaseAdmin()) {
    return json(
      {
        ok: false,
        error:
          'SUPABASE_SERVICE_ROLE_KEY is not configured. Invitations require the service role on the server.',
      },
      503
    );
  }

  let body: { email?: string; role?: string };
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const role = (body.role ?? 'reporter') as ProfileRow['role'];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'A valid email address is required.' }, 400);
  }
  if (!VALID_ROLES.includes(role)) {
    return json({ ok: false, error: 'Invalid role.' }, 400);
  }

  const sessionClient = await createSupabaseServer();
  const {
    data: { user },
    error: sessionErr,
  } = await sessionClient.auth.getUser();
  if (sessionErr || !user) {
    return json({ ok: false, error: 'You must be signed in.' }, 401);
  }

  const admin = getSupabaseAdmin()!;
  const { data: actor } = await admin
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (actor?.role !== 'admin') {
    return json({ ok: false, error: 'Only admins can send invitations.' }, 403);
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/admin/login`;

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (inviteErr || !invited.user) {
    const msg =
      inviteErr?.message ??
      'Invite failed. The address may already be registered — remove the existing user first or reset password in Supabase.';
    return json({ ok: false, error: msg }, 400);
  }

  const uid = invited.user.id;
  const localPart = email.split('@')[0] ?? 'User';
  const fullName = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');

  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: uid,
      email,
      full_name: fullName || email,
      role,
      status: 'invited',
      articles_count: 0,
      auth_user_id: uid,
    },
    { onConflict: 'id' }
  );

  if (profileErr) {
    return json(
      {
        ok: false,
        error: `Auth invite succeeded but profile row failed: ${profileErr.message}`,
      },
      500
    );
  }

  return json({ ok: true, userId: uid }, 200);
}
