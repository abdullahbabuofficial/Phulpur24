import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../db';

export async function recordView(input: {
  articleId?: string | null;
  path: string;
  lang?: 'bn' | 'en';
  referrer?: string;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from('page_views').insert({
    article_id: input.articleId ?? null,
    path: input.path,
    lang: input.lang ?? null,
    referrer: input.referrer ?? null,
  });
  return { data: !error, error };
}

export async function getRollingTotals(client?: SupabaseClient) {
  const supabase = client ?? getSupabase();
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

/** Last 7 UTC calendar days, oldest → newest (for sparkline charts). */
export async function getLastSevenUtcDayViewCounts(client?: SupabaseClient): Promise<number[]> {
  const supabase = client ?? getSupabase();
  const todayUtc = new Date();
  const startUtcMs = Date.UTC(
    todayUtc.getUTCFullYear(),
    todayUtc.getUTCMonth(),
    todayUtc.getUTCDate() - 6,
    0,
    0,
    0,
    0
  );
  const ranges: { start: string; end: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(startUtcMs + i * 86_400_000);
    const dayEnd = new Date(startUtcMs + (i + 1) * 86_400_000);
    ranges.push({ start: dayStart.toISOString(), end: dayEnd.toISOString() });
  }

  const counts = await Promise.all(
    ranges.map(({ start, end }) =>
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .gte('viewed_at', start)
        .lt('viewed_at', end)
    )
  );

  return counts.map((r) => r.count ?? 0);
}

function labelReferrer(raw: string | null): string {
  if (!raw || !raw.trim()) return 'Direct';
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const u = new URL(raw);
      return u.hostname.replace(/^www\./, '') || 'Direct';
    }
  } catch {
    /* ignore */
  }
  return raw.length > 48 ? `${raw.slice(0, 45)}…` : raw;
}

/** Traffic mix for the last 7 days from `page_views.referrer` (top sources + Other). */
export async function getTrafficSourceMix(
  client?: SupabaseClient,
  limitTop = 5
): Promise<{ source: string; pct: number }[]> {
  const supabase = client ?? getSupabase();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('page_views')
    .select('referrer')
    .gte('viewed_at', sevenDaysAgo)
    .limit(20_000);

  if (error || !data?.length) return [];

  const tallies = new Map<string, number>();
  for (const row of data) {
    const label = labelReferrer(row.referrer);
    tallies.set(label, (tallies.get(label) ?? 0) + 1);
  }

  const sorted = [...tallies.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limitTop);
  const topSum = top.reduce((s, [, n]) => s + n, 0);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  if (total === 0) return [];

  const rest = total - topSum;
  const result: { source: string; pct: number }[] = top.map(([source, n]) => ({
    source,
    pct: Math.round((n / total) * 1000) / 10,
  }));
  if (rest > 0) {
    result.push({ source: 'Other', pct: Math.round((rest / total) * 1000) / 10 });
  }
  return result;
}
