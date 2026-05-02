/**
 * Phulpur24 — create test accounts for every user_role.
 *
 * Idempotent: re-running this script resets the password and re-syncs the
 * profile row, but never duplicates auth users or profiles.
 *
 * Usage (Node 20.6+):
 *   node --env-file=.env scripts/create-test-users.mjs
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY    (server-only, NEVER ship to the browser)
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    '[create-test-users] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.'
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = 'Test@123';
const EMAIL_DOMAIN = 'phulpur24.com';

/**
 * Each entry becomes one Supabase Auth user AND one row in `profiles`.
 * `id` is the text PK on `profiles`. Keeping it stable + readable so it's
 * easy to spot test accounts in the admin UI.
 */
const ACCOUNTS = [
  { id: 'test-admin',               role: 'admin',               full_name: 'Admin Test' },
  { id: 'test-editor',              role: 'editor',              full_name: 'Editor Test' },
  { id: 'test-reporter',            role: 'reporter',            full_name: 'Reporter Test' },
  { id: 'test-translator',          role: 'translator',          full_name: 'Translator Test' },
  { id: 'test-seo-editor',          role: 'seo_editor',          full_name: 'SEO Editor Test' },
  { id: 'test-sports-reporter',     role: 'sports_reporter',     full_name: 'Sports Reporter Test' },
  { id: 'test-local-correspondent', role: 'local_correspondent', full_name: 'Local Correspondent Test' },
];

const emailFor = (role) => `test.${role.replace(/_/g, '-')}@${EMAIL_DOMAIN}`;

/**
 * Find an existing auth user by email (Supabase admin API doesn't expose a
 * direct getByEmail; we walk the listing one page at a time).
 */
async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  const PAGE_SIZE = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw error;
    const hit = (data?.users ?? []).find((u) => (u.email ?? '').toLowerCase() === target);
    if (hit) return hit;
    if (!data?.users || data.users.length < PAGE_SIZE) return null;
  }
  return null;
}

async function ensureAuthUser({ email, full_name, role }) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (!createErr && created?.user) {
    return { authUser: created.user, action: 'created' };
  }

  const message = createErr?.message ?? '';
  const code = createErr?.code ?? '';
  const alreadyExists =
    code === 'email_exists' ||
    /already.*registered|already exists|user already/i.test(message);

  if (!alreadyExists) {
    throw createErr ?? new Error('Auth create failed for unknown reason');
  }

  const existing = await findAuthUserByEmail(email);
  if (!existing) {
    throw new Error(`Auth user reported as existing but not found in listing: ${email}`);
  }

  const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name, role },
    }
  );
  if (updateErr) throw updateErr;
  return { authUser: updated?.user ?? existing, action: 'reset' };
}

async function upsertProfile({ id, email, full_name, role, authUserId }) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id,
        email,
        full_name,
        role,
        status: 'active',
        auth_user_id: authUserId,
      },
      { onConflict: 'id' }
    );
  if (error) throw error;
}

async function main() {
  console.log(`[create-test-users] target: ${url}`);
  console.log(`[create-test-users] creating ${ACCOUNTS.length} accounts (password: ${PASSWORD})\n`);

  const results = [];
  for (const acc of ACCOUNTS) {
    const email = emailFor(acc.role);
    try {
      const { authUser, action } = await ensureAuthUser({
        email,
        full_name: acc.full_name,
        role: acc.role,
      });
      await upsertProfile({
        id: acc.id,
        email,
        full_name: acc.full_name,
        role: acc.role,
        authUserId: authUser.id,
      });
      results.push({ ok: true, role: acc.role, email, action, authUserId: authUser.id });
      console.log(`  [${action.toUpperCase().padEnd(7)}] ${acc.role.padEnd(22)} ${email}`);
    } catch (err) {
      results.push({ ok: false, role: acc.role, email, error: err?.message ?? String(err) });
      console.error(`  [FAIL   ] ${acc.role.padEnd(22)} ${email}  -> ${err?.message ?? err}`);
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`\n[create-test-users] done: ${ok} succeeded, ${fail} failed`);

  if (ok > 0) {
    console.log('\nLogin credentials (admin.phulpur24.com/admin/login):\n');
    console.log('  Password for all accounts: Test@123\n');
    for (const r of results.filter((x) => x.ok)) {
      console.log(`    ${r.role.padEnd(22)} ${r.email}`);
    }
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[create-test-users] fatal:', err);
  process.exit(1);
});
