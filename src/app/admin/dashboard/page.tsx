import Link from 'next/link';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatTile } from '@/components/admin/ui/StatTile';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Button } from '@/components/admin/ui/Button';
import { Icon } from '@/components/admin/ui/Icon';
import { analytics, audit } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function DashboardPage() {
  const [stats, top, recent] = await Promise.all([
    analytics.getDashboardStats(),
    analytics.getTopArticles(5),
    audit.recentAudit(8),
  ]);

  const dashboardStats = stats.data!;
  const topArticles = top.data ?? [];
  const auditLogs = recent.data ?? [];
  const peak = Math.max(...dashboardStats.monthly_views);

  const tiles = [
    {
      label: 'Published',
      value: dashboardStats.published_posts,
      delta: { value: '12 this week', positive: true },
      icon: <Icon.Posts size={18} />,
      tone: 'accent' as const,
    },
    {
      label: 'Drafts',
      value: dashboardStats.drafts,
      delta: { value: '2 from yesterday', positive: false },
      icon: <Icon.Pencil size={18} />,
      tone: 'warning' as const,
    },
    {
      label: 'Pending review',
      value: dashboardStats.pending_review,
      hint: 'Awaiting editor',
      icon: <Icon.Clock size={18} />,
      tone: 'info' as const,
    },
    {
      label: 'Today’s views',
      value: dashboardStats.today_views,
      delta: { value: '8.3%', positive: true },
      icon: <Icon.Eye size={18} />,
      tone: 'success' as const,
    },
    {
      label: 'SEO issues',
      value: dashboardStats.seo_issues,
      hint: 'Need fixing',
      icon: <Icon.Search size={18} />,
      tone: 'danger' as const,
    },
    {
      label: 'Translation queue',
      value: dashboardStats.translation_pending,
      hint: 'Awaiting English',
      icon: <Icon.Globe size={18} />,
      tone: 'neutral' as const,
    },
  ];

  return (
    <AdminPageShell title="Dashboard">
      <PageHeader
        title="Welcome back, Admin"
        description="Here’s what’s happening across Phulpur24 today."
        crumbs={[{ label: 'Console' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="secondary" iconLeft={<Icon.Refresh size={14} />}>Refresh</Button>
            <Link href="/admin/posts/new">
              <Button iconLeft={<Icon.Plus size={14} />}>New article</Button>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded>
          <CardHeader
            title="Page views — last 12 months"
            subtitle="Hourly resolution available in Analytics"
            action={
              <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                Analytics
                <Icon.ArrowRight size={12} />
              </Link>
            }
          />
          <div className="mt-6 h-56">
            <BarChart data={dashboardStats.monthly_views} labels={monthLabels} peak={peak} />
          </div>
        </Card>

        <Card padded>
          <CardHeader title="Quick actions" />
          <ul className="mt-4 space-y-2">
            {[
              { label: 'New article', href: '/admin/posts/new', icon: <Icon.Plus size={16} />, tone: 'bg-accent-soft text-accent' },
              { label: 'AI Writer', href: '/admin/ai-writer', icon: <Icon.Sparkles size={16} />, tone: 'bg-violet-100 text-violet-600' },
              { label: 'Translation queue', href: '/admin/translation', icon: <Icon.Globe size={16} />, tone: 'bg-info-soft text-info' },
              { label: 'SEO Center', href: '/admin/seo', icon: <Icon.Search size={16} />, tone: 'bg-success-soft text-success' },
              { label: 'Media library', href: '/admin/media', icon: <Icon.Image size={16} />, tone: 'bg-warning-soft text-warning' },
            ].map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink transition-all hover:border-accent/30 hover:bg-app"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.tone}`}>{a.icon}</span>
                  <span className="flex-1 font-medium">{a.label}</span>
                  <Icon.ArrowRight size={14} className="text-ink-faint group-hover:translate-x-0.5 group-hover:text-ink transition" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top articles + activity */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-base font-semibold text-ink">Top articles</p>
              <p className="text-xs text-ink-muted">Most viewed published stories</p>
            </div>
            <Link href="/admin/posts" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 text-left font-medium">Article</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-right font-medium">Views</th>
                  <th className="px-5 py-3 text-right font-medium">SEO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topArticles.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-app">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.cover_image_url}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/posts/${a.id}`}
                            className="block truncate text-sm font-medium text-ink hover:text-accent"
                          >
                            {a.title_en || a.title_bn}
                          </Link>
                          <p className="truncate text-xs text-ink-muted">{a.author.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: a.category.color }}
                      >
                        {a.category.name_en}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-ink">
                      {a.views.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <SeoChip score={a.seo_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-5 py-4">
            <p className="text-base font-semibold text-ink">Recent activity</p>
            <p className="text-xs text-ink-muted">Audit log across the team</p>
          </div>
          <ul className="divide-y divide-line">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <ActivityIcon name={log.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{log.action}</p>
                  <p className="truncate text-xs text-ink-muted">{log.target}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {log.user_name} · {new Date(log.created_at).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminPageShell>
  );
}

function BarChart({ data, labels, peak }: { data: number[]; labels: string[]; peak: number }) {
  return (
    <div className="flex h-full items-end gap-2">
      {data.map((v, i) => {
        const pct = Math.max(5, Math.round((v / peak) * 100));
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-2">
            <div
              className="relative w-full flex-1 rounded-md bg-accent-soft transition-colors group-hover:bg-accent/20"
              title={`${v}K views`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-md bg-gradient-to-t from-accent to-indigo-400 transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-muted">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SeoChip({ score }: { score: number }) {
  const tone = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
  return (
    <Badge tone={tone} dot>
      {score}
    </Badge>
  );
}

function ActivityIcon({ name }: { name: string }) {
  const map: Record<string, JSX.Element> = {
    check: <Icon.Check size={14} />,
    pencil: <Icon.Pencil size={14} />,
    search: <Icon.Search size={14} />,
    globe: <Icon.Globe size={14} />,
    image: <Icon.Image size={14} />,
    clock: <Icon.Clock size={14} />,
    user: <Icon.Users size={14} />,
    tag: <Icon.Tag size={14} />,
    settings: <Icon.Settings size={14} />,
    megaphone: <Icon.Megaphone size={14} />,
  };
  return map[name] ?? <Icon.Activity size={14} />;
}

