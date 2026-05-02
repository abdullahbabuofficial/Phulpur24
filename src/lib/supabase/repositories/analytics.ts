import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../db';
import * as viewsRepo from './views';
import type { ArticleWithRelations, DashboardStatsRow } from '../types';

const ARTICLE_SELECT = `
  *,
  category:categories(*),
  author:authors(*),
  article_tags(tag:tags(*))
`;

function flatten(row: Record<string, unknown>): ArticleWithRelations {
  const joins = (row.article_tags as Array<{ tag: unknown }> | undefined) ?? [];
  const tags = joins.map((j) => j.tag);
  const { article_tags, ...rest } = row as { article_tags?: unknown };
  void article_tags;
  return { ...(rest as ArticleWithRelations), tags } as ArticleWithRelations;
}

function clientOrDefault(sb?: SupabaseClient): SupabaseClient {
  return sb ?? getSupabase();
}

/**
 * Dashboard KPIs. Pass `sb` from `createSupabaseServer()` in admin RSC routes so
 * `page_views` aggregates respect authenticated staff RLS.
 */
export async function getDashboardStats(sb?: SupabaseClient) {
  const supabase = clientOrDefault(sb);
  const [
    settingsRes,
    publishedRes,
    draftsRes,
    pendingRes,
    translationPendingRes,
    seoIssuesRes,
    rollingRes,
    weeklyLive,
    trafficLive,
  ] = await Promise.all([
    supabase.from('dashboard_stats').select('*').eq('id', 'stats').maybeSingle(),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .neq('translation_status', 'complete'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).lt('seo_score', 70),
    viewsRepo.getRollingTotals(supabase),
    viewsRepo.getLastSevenUtcDayViewCounts(supabase),
    viewsRepo.getTrafficSourceMix(supabase),
  ]);

  const seeded = (settingsRes.data as DashboardStatsRow | null) ?? fallback();
  const merged: DashboardStatsRow = {
    ...seeded,
    published_posts: publishedRes.count ?? 0,
    drafts: draftsRes.count ?? 0,
    pending_review: pendingRes.count ?? 0,
    translation_pending: translationPendingRes.count ?? 0,
    seo_issues: seoIssuesRes.count ?? 0,
    today_views: rollingRes.data.today,
    weekly_views: weeklyLive,
    traffic_sources: trafficLive.length > 0 ? trafficLive : seeded.traffic_sources,
  };
  return { data: merged, error: settingsRes.error };
}

export async function getTopArticles(limit = 5, sb?: SupabaseClient) {
  const supabase = clientOrDefault(sb);
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);
  return {
    data: (data ?? []).map((r) => flatten(r as Record<string, unknown>)),
    error,
  };
}

export async function getTotals(sb?: SupabaseClient) {
  const supabase = clientOrDefault(sb);
  const [{ count: published }, { count: drafts }, { count: pending }] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const { data: viewsRows } = await supabase.from('articles').select('views');
  const totalViews = (viewsRows ?? []).reduce((s, r) => s + (r.views ?? 0), 0);
  return {
    data: {
      totalViews,
      published: published ?? 0,
      drafts: drafts ?? 0,
      pending: pending ?? 0,
    },
    error: null,
  };
}

function fallback(): DashboardStatsRow {
  return {
    published_posts: 0,
    drafts: 0,
    pending_review: 0,
    today_views: 0,
    seo_issues: 0,
    translation_pending: 0,
    weekly_views: [0, 0, 0, 0, 0, 0, 0],
    monthly_views: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    traffic_sources: [],
  };
}
