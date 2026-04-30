'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Input, Textarea } from '@/components/admin/ui/Input';
import { Button } from '@/components/admin/ui/Button';
import { Badge } from '@/components/admin/ui/Badge';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { audit, posts as postsRepo } from '@/lib/supabase';
import type { ArticleWithRelations } from '@/lib/supabase/types';

interface Fields {
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

function defaultFields(a: ArticleWithRelations): Fields {
  return {
    meta_title: a.seo_title ?? `${a.title_en} | Phulpur24`,
    meta_description: a.seo_description ?? a.subtitle_en,
    focus_keyword: a.seo_focus_keyword ?? a.tags[0]?.name_en ?? '',
  };
}

function computeIssues(a: ArticleWithRelations, f: Fields) {
  const issues: { label: string; severity: 'high' | 'medium' | 'low' }[] = [];
  const body = a.body_en.replace(/<[^>]+>/g, ' ').toLowerCase();
  const kw = f.focus_keyword.trim().toLowerCase();
  if (!f.meta_description.trim()) issues.push({ label: 'Missing meta description', severity: 'high' });
  else if (f.meta_description.length < 80 || f.meta_description.length > 160) {
    issues.push({ label: `Meta description ${f.meta_description.length} chars (target 80–160)`, severity: 'medium' });
  }
  if (f.meta_title.length > 70) issues.push({ label: `Title too long (${f.meta_title.length} chars)`, severity: 'medium' });
  if (!kw) issues.push({ label: 'No focus keyword set', severity: 'medium' });
  else if (!f.meta_title.toLowerCase().includes(kw) && !body.includes(kw)) {
    issues.push({ label: 'Focus keyword not found in title or body', severity: 'low' });
  }
  if (!a.cover_image_caption.trim()) issues.push({ label: 'Cover image missing alt/caption', severity: 'low' });
  return issues;
}

function computeScore(a: ArticleWithRelations, f: Fields) {
  const issues = computeIssues(a, f);
  const penalty = issues.reduce((p, i) => p + (i.severity === 'high' ? 18 : i.severity === 'medium' ? 9 : 4), 0);
  return Math.max(35, Math.min(100, a.seo_score + 5 - penalty));
}

export default function SEOPage() {
  const { push } = useToast();
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Fields>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsRepo.listPosts({ status: 'published', pageSize: 50, sort: 'best-seo' }).then((res) => {
      setArticles(res.rows);
      setLoading(false);
      if (res.rows.length > 0) setSelectedId(res.rows[0].id);
    });
  }, []);

  const selected = articles.find((a) => a.id === selectedId) ?? articles[0];
  const fields = selected ? overrides[selected.id] ?? defaultFields(selected) : null;

  const scored = useMemo(
    () =>
      articles.map((a) => {
        const f = overrides[a.id] ?? defaultFields(a);
        return { article: a, fields: f, score: computeScore(a, f), issues: computeIssues(a, f) };
      }),
    [articles, overrides]
  );

  const summary = useMemo(() => {
    const total = scored.length || 1;
    const avg = Math.round(scored.reduce((s, x) => s + x.score, 0) / total);
    const good = scored.filter((x) => x.score >= 80).length;
    const fair = scored.filter((x) => x.score >= 60 && x.score < 80).length;
    const poor = scored.filter((x) => x.score < 60).length;
    return { avg, good, fair, poor };
  }, [scored]);

  const sortedScored = useMemo(() => [...scored].sort((a, b) => a.score - b.score), [scored]);

  const updateField = (k: keyof Fields, v: string) => {
    if (!selected || !fields) return;
    setOverrides((cur) => ({ ...cur, [selected.id]: { ...fields, [k]: v } }));
  };

  const autoFix = () => {
    if (!selected) return;
    const kw = selected.tags[0]?.name_en ?? selected.category.name_en;
    setOverrides((cur) => ({
      ...cur,
      [selected.id]: {
        meta_title: `${selected.title_en.slice(0, 50)} | Phulpur24`,
        meta_description: `${selected.subtitle_en} Read the latest verified update from Phulpur24.`,
        focus_keyword: kw,
      },
    }));
    push({ tone: 'success', title: 'SEO fixes applied' });
  };

  const handleSave = async () => {
    if (!selected || !fields) return;
    const res = await postsRepo.upsertPost({
      id: selected.id,
      slug: selected.slug,
      title_bn: selected.title_bn,
      title_en: selected.title_en,
      subtitle_bn: selected.subtitle_bn,
      subtitle_en: selected.subtitle_en,
      body_bn: selected.body_bn,
      body_en: selected.body_en,
      category_id: selected.category.id,
      author_id: selected.author.id,
      cover_image_url: selected.cover_image_url,
      cover_image_caption: selected.cover_image_caption,
      status: selected.status,
      translation_status: selected.translation_status,
      featured: selected.featured,
      breaking: selected.breaking,
      seo_title: fields.meta_title,
      seo_description: fields.meta_description,
      seo_focus_keyword: fields.focus_keyword,
      tag_ids: selected.tags.map((t) => t.id),
    });
    if (res.error) {
      push({ tone: 'error', title: 'Save failed', description: res.error.message });
      return;
    }
    await audit.logAction('Updated SEO', selected.title_en, 'Admin', 'search');
    push({ tone: 'success', title: 'SEO fields persisted' });
  };

  return (
    <AdminPageShell title="SEO Center">
      <PageHeader
        title="SEO Center"
        description="Score every published article, fix the worst offenders first, and preview Google snippets."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'SEO' }]}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Avg score', value: summary.avg, tone: 'accent' as const },
          { label: 'Good (80+)', value: summary.good, tone: 'success' as const },
          { label: 'Fair (60–79)', value: summary.fair, tone: 'warning' as const },
          { label: 'Poor (<60)', value: summary.poor, tone: 'danger' as const },
        ].map((s) => (
          <Card key={s.label} padded>
            <p className="text-xs uppercase tracking-wide text-ink-muted">{s.label}</p>
            <p
              className={`mt-2 text-3xl font-semibold ${
                s.tone === 'accent'
                  ? 'text-accent'
                  : s.tone === 'success'
                  ? 'text-success-text'
                  : s.tone === 'warning'
                  ? 'text-warning-text'
                  : 'text-danger-text'
              }`}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-base font-semibold text-ink">Articles · sorted by lowest score</p>
            <p className="text-xs text-ink-muted">Fix the bottom of the list first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 text-left font-medium">Article</th>
                  <th className="px-5 py-3 text-center font-medium">Score</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="skeleton h-4 w-full rounded-md" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : sortedScored.map(({ article, score }) => {
                      const isActive = selectedId === article.id;
                      return (
                        <tr
                          key={article.id}
                          className={`transition-colors ${isActive ? 'bg-accent-soft/40' : 'hover:bg-app'}`}
                        >
                          <td className="px-5 py-3">
                            <p className="line-clamp-1 text-sm font-medium text-ink">{article.title_en}</p>
                            <p className="text-xs text-ink-muted">{article.category.name_en}</p>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-line">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-danger'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  score >= 80 ? 'text-success-text' : score >= 60 ? 'text-warning-text' : 'text-danger-text'
                                }`}
                              >
                                {score}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge
                              tone={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
                              dot
                            >
                              {score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedId(article.id)}
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              {isActive ? 'Editing' : 'Fix SEO'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </Card>

        {selected && fields ? (
          <div className="space-y-4">
            <Card padded>
              <CardHeader title="Optimize" subtitle={selected.title_en} />
              <div className="mt-4 space-y-3">
                <Input
                  label="Meta title"
                  value={fields.meta_title}
                  onChange={(e) => updateField('meta_title', e.target.value)}
                  hint={`${fields.meta_title.length}/70`}
                  error={fields.meta_title.length > 70 ? 'Too long' : undefined}
                />
                <Textarea
                  label="Meta description"
                  rows={3}
                  value={fields.meta_description}
                  onChange={(e) => updateField('meta_description', e.target.value)}
                  hint={`${fields.meta_description.length}/160`}
                />
                <Input
                  label="Focus keyword"
                  value={fields.focus_keyword}
                  onChange={(e) => updateField('focus_keyword', e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={autoFix} iconLeft={<Icon.Wand size={14} />}>
                    Apply auto-fix
                  </Button>
                  <Button variant="secondary" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </Card>
            <Card padded>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Google preview</p>
              <div className="mt-3 rounded-lg border border-line bg-app p-3.5">
                <p className="text-sm font-medium text-info">{fields.meta_title}</p>
                <p className="text-[11px] text-success-text">phulpur24.com/news/{selected.slug}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                  {fields.meta_description || 'No meta description set.'}
                </p>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">Issues</p>
              <ul className="mt-2 space-y-1 text-xs">
                {computeIssues(selected, fields).map((i, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 ${
                      i.severity === 'high'
                        ? 'text-danger-text'
                        : i.severity === 'medium'
                        ? 'text-warning-text'
                        : 'text-ink-muted'
                    }`}
                  >
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    {i.label}
                  </li>
                ))}
                {computeIssues(selected, fields).length === 0 ? (
                  <li className="text-success-text">All checks pass. ✨</li>
                ) : null}
              </ul>
            </Card>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
