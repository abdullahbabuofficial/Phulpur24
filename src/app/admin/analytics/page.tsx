import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatTile } from '@/components/admin/ui/StatTile';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Icon } from '@/components/admin/ui/Icon';
import { Badge } from '@/components/admin/ui/Badge';
import { analytics } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const sourceColors: Record<string, string> = {
  Direct: 'bg-accent',
  Facebook: 'bg-info',
  'Google Search': 'bg-success',
  WhatsApp: 'bg-emerald-500',
  Other: 'bg-line',
};

export default async function AnalyticsPage() {
  const stats = await analytics.getDashboardStats();
  const top = await analytics.getTopArticles(8);
  const totals = await analytics.getTotals();

  const dashboardStats = stats.data!;
  const peak = Math.max(...dashboardStats.weekly_views);
  const articles = top.data ?? [];
  const totalViews = articles.reduce((s, a) => s + a.views, 0) || 1;

  return (
    <AdminPageShell title="Analytics">
      <PageHeader
        title="Analytics"
        description="Traffic, performance, and the top stories driving readership."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Analytics' }]}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Today’s views"
          value={dashboardStats.today_views}
          delta={{ value: '8.3%', positive: true }}
          icon={<Icon.Eye size={18} />}
          tone="accent"
        />
        <StatTile
          label="This week"
          value={dashboardStats.weekly_views.reduce((s, x) => s + x, 0) * 100}
          delta={{ value: '12.1%', positive: true }}
          icon={<Icon.BarChart size={18} />}
          tone="success"
        />
        <StatTile
          label="Total views"
          value={(totals.data?.totalViews ?? 0).toLocaleString()}
          icon={<Icon.Activity size={18} />}
          tone="info"
        />
        <StatTile
          label="Bounce rate"
          value="42.3%"
          delta={{ value: '3.2%', positive: true }}
          icon={<Icon.ArrowDown size={18} />}
          tone="warning"
          hint="Lower is better"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded>
          <CardHeader title="Weekly page views" subtitle="Hundreds of pageviews · last 7 days" />
          <div className="mt-6 flex h-56 items-end gap-3">
            {dashboardStats.weekly_views.map((val, i) => {
              const pct = Math.max(8, Math.round((val / peak) * 100));
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-ink-muted">{val}</span>
                  <div className="relative w-full flex-1 rounded-md bg-accent-soft transition-colors group-hover:bg-accent/20">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-md bg-gradient-to-t from-accent to-indigo-400"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-ink-muted">{days[i]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padded>
          <CardHeader title="Traffic sources" />
          <ul className="mt-4 space-y-3">
            {dashboardStats.traffic_sources.map((s) => (
              <li key={s.source}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink">{s.source}</span>
                  <span className="font-medium text-ink-muted">{s.pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-app">
                  <div
                    className={`h-full rounded-full ${sourceColors[s.source] ?? 'bg-line'}`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card padded={false} className="mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-base font-semibold text-ink">Top articles by views</p>
          <p className="text-xs text-ink-muted">Among published stories only</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Article</th>
                <th className="px-5 py-3 text-left font-medium">Category</th>
                <th className="px-5 py-3 text-right font-medium">Views</th>
                <th className="px-5 py-3 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {articles.map((a, i) => {
                const share = (a.views / totalViews) * 100;
                return (
                  <tr key={a.id} className="transition-colors hover:bg-app">
                    <td className="px-5 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={a.cover_image_url} alt="" className="h-10 w-14 rounded-md object-cover" />
                        <p className="line-clamp-1 text-sm font-medium text-ink">{a.title_en}</p>
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
                    <td className="px-5 py-3 text-right font-medium text-ink">{a.views.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-app">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                        </div>
                        <Badge tone="accent">{share.toFixed(1)}%</Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminPageShell>
  );
}
