import { supabase } from '../client';

export async function recordView(input: { articleId?: string | null; path: string; lang?: 'bn' | 'en'; referrer?: string }) {
  const { error } = await supabase.from('page_views').insert({
    article_id: input.articleId ?? null,
    path: input.path,
    lang: input.lang ?? null,
    referrer: input.referrer ?? null,
  });
  return { data: !error, error };
}

export async function getRollingTotals() {
  // Today, this week, last 7 / 30 days, top referrers — derived live.
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000).toISOString();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86_400_000).toISOString();

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('viewed_at', startOfToday),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('viewed_at', sevenDaysAgo),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('viewed_at', thirtyDaysAgo),
  ]);

  return {
    data: {
      today: todayRes.count ?? 0,
      week: weekRes.count ?? 0,
      month: monthRes.count ?? 0,
    },
    error: null,
  };
}
