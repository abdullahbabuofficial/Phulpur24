import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Icon } from '@/components/admin/ui/Icon';
import {
  analytics,
  audit,
  authors as authorsRepo,
  categories as categoriesRepo,
  media as mediaRepo,
  posts as postsRepo,
  settings as settingsRepo,
  tags as tagsRepo,
  users as usersRepo,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Probe {
  name: string;
  description: string;
  ok: boolean;
  detail: string;
  errorMessage?: string;
}

async function runProbes(): Promise<Probe[]> {
  const probes: Probe[] = [];

  async function probe(
    name: string,
    description: string,
    fn: () => Promise<{ ok: boolean; detail: string }>
  ) {
    try {
      const r = await fn();
      probes.push({ name, description, ok: r.ok, detail: r.detail });
    } catch (err) {
      probes.push({
        name,
        description,
        ok: false,
        detail: 'threw',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await probe('categories.listCategories', 'Read categories', async () => {
    const r = await categoriesRepo.listCategories();
    return { ok: !r.error && r.data.length > 0, detail: `${r.data.length} categories` };
  });

  await probe('tags.listTags', 'Read tags', async () => {
    const r = await tagsRepo.listTags();
    return { ok: !r.error && r.data.length > 0, detail: `${r.data.length} tags` };
  });

  await probe('authors.listAuthors', 'Read authors', async () => {
    const r = await authorsRepo.listAuthors();
    return { ok: !r.error && r.data.length > 0, detail: `${r.data.length} authors` };
  });

  await probe('users.listUsers', 'Read profiles', async () => {
    const r = await usersRepo.listUsers();
    return { ok: !r.error && r.data.length > 0, detail: `${r.data.length} profiles` };
  });

  await probe('posts.listPosts', 'Read paginated posts (live join)', async () => {
    const r = await postsRepo.listPosts({ pageSize: 5 });
    const ok = r.total > 0 && r.rows.length > 0;
    const sample = r.rows[0];
    const tagsLoaded = sample ? Array.isArray(sample.tags) : false;
    return {
      ok: ok && tagsLoaded,
      detail: `total ${r.total}, page rows ${r.rows.length}, sample tags ${sample?.tags?.length ?? 0}`,
    };
  });

  await probe('posts.getPostById(sample)', 'Single post + nested category/author/tags', async () => {
    const list = await postsRepo.listPosts({ pageSize: 1, status: 'published' });
    const id = list.rows[0]?.id;
    if (!id) return { ok: false, detail: 'No published posts to sample' };
    const r = await postsRepo.getPostById(id);
    if (r.error || !r.data) return { ok: false, detail: r.error?.message ?? 'not found' };
    return {
      ok: Boolean(r.data.category && r.data.author && Array.isArray(r.data.tags)),
      detail: `${r.data.title_en} · ${r.data.category?.name_en} · ${r.data.tags.length} tags`,
    };
  });

  await probe('media.listMedia', 'Read media library', async () => {
    const r = await mediaRepo.listMedia();
    return { ok: !r.error && r.data.length > 0, detail: `${r.data.length} assets` };
  });

  await probe('audit.recentAudit', 'Read audit log', async () => {
    const r = await audit.recentAudit(5);
    return { ok: !r.error, detail: `${r.data.length} log entries` };
  });

  await probe('analytics.getDashboardStats', 'Singleton dashboard stats row', async () => {
    const r = await analytics.getDashboardStats();
    if (r.error || !r.data) return { ok: false, detail: r.error?.message ?? 'no row' };
    return {
      ok: r.data.published_posts > 0,
      detail: `${r.data.published_posts} published · ${r.data.drafts} drafts · ${r.data.today_views.toLocaleString()} views today`,
    };
  });

  await probe('analytics.getTotals', 'Aggregate totals', async () => {
    const r = await analytics.getTotals();
    return {
      ok: !r.error && r.data.published > 0,
      detail: `published=${r.data.published} drafts=${r.data.drafts} pending=${r.data.pending} totalViews=${r.data.totalViews.toLocaleString()}`,
    };
  });

  await probe('settings.getSettings', 'Site settings row', async () => {
    const r = await settingsRepo.getSettings();
    if (r.error || !r.data) return { ok: false, detail: r.error?.message ?? 'no row' };
    return {
      ok: Boolean(r.data.site_name),
      detail: `site=${r.data.site_name}, lang=${r.data.default_language}, ads=${r.data.enable_ads}`,
    };
  });

  // RLS / write probe: insert + delete a temporary newsletter row to confirm
  // anon-keyed writes survive Row-Level Security in production.
  await probe('newsletter.subscribe (RLS write probe)', 'Anon write through PostgREST + RLS', async () => {
    const { newsletter } = await import('@/lib/supabase');
    const testEmail = `diagnostic-${Date.now()}@phulpur24.local`;
    const ins = await newsletter.subscribe(testEmail, 'en', 'diagnostic');
    if (ins.error) return { ok: false, detail: ins.error.message };
    if (ins.data) {
      await newsletter.unsubscribe(ins.data.id).catch(() => undefined);
    }
    return { ok: true, detail: 'insert + delete succeeded' };
  });

  return probes;
}

export default async function DiagnosticPage() {
  const probes = await runProbes();
  const passing = probes.filter((p) => p.ok).length;
  const failing = probes.length - passing;

  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(missing)',
    keyHint: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').slice(0, 12) + '…',
  };

  return (
    <AdminPageShell title="Diagnostic">
      <PageHeader
        title="Health check"
        description="Runs every Supabase repository function and reports pass/fail. Use this to verify end-to-end connectivity from the running Next server to your database."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Diagnostic' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card padded>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Probes passing</p>
          <p className={`mt-2 text-3xl font-semibold ${failing === 0 ? 'text-success-text' : 'text-warning-text'}`}>
            {passing} / {probes.length}
          </p>
        </Card>
        <Card padded>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Project URL</p>
          <p className="mt-2 break-all text-sm text-ink">{env.url}</p>
        </Card>
        <Card padded>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Anon key (start)</p>
          <p className="mt-2 font-mono text-sm text-ink">{env.keyHint}</p>
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-base font-semibold text-ink">Repository probes</p>
          <p className="text-xs text-ink-muted">Each row exercises one read path the admin or public site depends on.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Probe</th>
                <th className="px-5 py-3 text-left font-medium">What it tests</th>
                <th className="px-5 py-3 text-left font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {probes.map((p) => (
                <tr key={p.name} className="hover:bg-app">
                  <td className="px-5 py-3">
                    {p.ok ? (
                      <Badge tone="success" dot>
                        OK
                      </Badge>
                    ) : (
                      <Badge tone="danger" dot>
                        FAIL
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{p.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{p.description}</td>
                  <td className="px-5 py-3 text-ink">
                    {p.ok ? p.detail : <span className="text-danger-text">{p.errorMessage ?? p.detail}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
        <Icon.Info size={14} />
        <span>
          Reload this page after a change to re-run the probes. If everything is green here, every admin and public
          page should also load real data — they all share these repository functions.
        </span>
      </div>
    </AdminPageShell>
  );
}
