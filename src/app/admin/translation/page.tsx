'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Input, Textarea } from '@/components/admin/ui/Input';
import { StatusBadge, Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Icon } from '@/components/admin/ui/Icon';
import { Avatar } from '@/components/admin/ui/Avatar';
import { useToast } from '@/components/admin/ui/Toast';
import { posts as postsRepo } from '@/lib/supabase';
import type { ArticleWithRelations, TranslationStatus } from '@/lib/supabase/types';

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'missing', label: 'Missing' },
  { id: 'partial', label: 'Partial' },
  { id: 'complete', label: 'Complete' },
] as const;

type Filter = (typeof statusFilters)[number]['id'];

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function TranslationPage() {
  const { push } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [queue, setQueue] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titleEn, setTitleEn] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');

  const reload = async () => {
    setLoading(true);
    const res = await postsRepo.listPosts({ pageSize: 100, sort: 'newest' });
    setQueue(res.rows);
    setLoading(false);
    if (!selectedId && res.rows.length > 0) {
      const first = res.rows.find((r) => r.translation_status !== 'complete') ?? res.rows[0];
      pickArticle(first);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return queue;
    return queue.filter((q) => q.translation_status === filter);
  }, [queue, filter]);

  const pendingCount = queue.filter((q) => q.translation_status !== 'complete').length;
  const selected = queue.find((q) => q.id === selectedId) ?? null;

  function pickArticle(a: ArticleWithRelations) {
    setSelectedId(a.id);
    setTitleEn(a.title_en);
    setSubtitleEn(a.subtitle_en);
    setBodyEn(a.translation_status === 'missing' ? '' : a.body_en);
  }

  const persistTranslation = async (next: TranslationStatus) => {
    if (!selected) return;
    await postsRepo.upsertPost({
      id: selected.id,
      slug: selected.slug,
      title_bn: selected.title_bn,
      title_en: titleEn.trim(),
      subtitle_bn: selected.subtitle_bn,
      subtitle_en: subtitleEn.trim(),
      body_bn: selected.body_bn,
      body_en: bodyEn.trim(),
      category_id: selected.category.id,
      author_id: selected.author.id,
      cover_image_url: selected.cover_image_url,
      cover_image_caption: selected.cover_image_caption,
      status: selected.status,
      translation_status: next,
      featured: selected.featured,
      breaking: selected.breaking,
      seo_title: selected.seo_title,
      seo_description: selected.seo_description,
      seo_focus_keyword: selected.seo_focus_keyword,
      tag_ids: selected.tags.map((t) => t.id),
    });
    await reload();
  };

  const handleSave = async () => {
    if (!selected) return;
    const next: TranslationStatus =
      titleEn.trim() && subtitleEn.trim() && bodyEn.trim() ? 'partial' : 'missing';
    await persistTranslation(next);
    push({ tone: 'success', title: 'Translation draft saved' });
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (!titleEn.trim() || !subtitleEn.trim() || !bodyEn.trim()) {
      push({ tone: 'warning', title: 'Complete title, subtitle, and body before approval.' });
      return;
    }
    await persistTranslation('complete');
    push({ tone: 'success', title: 'Translation approved' });
  };

  const handleAuto = () => {
    if (!selected) return;
    setTitleEn(selected.title_en || `${selected.category.name_en} update from Phulpur`);
    setSubtitleEn(selected.subtitle_en || `Latest local update on ${selected.category.name_en.toLowerCase()}.`);
    setBodyEn(selected.body_en || `Translation draft for "${selected.title_bn}". ${stripHtml(selected.body_bn).slice(0, 260)}…`);
    push({ tone: 'info', title: 'Auto-translation drafted', description: 'Review carefully before approving.' });
  };

  return (
    <AdminPageShell title="Translation">
      <PageHeader
        title="Translation Center"
        description="Convert Bangla originals into polished English. Approve translations after a careful review."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Translation' }]}
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning-text">
            <Icon.Globe size={14} /> {pendingCount} pending
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Queue */}
        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-line p-3">
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === f.id ? 'bg-accent text-white' : 'bg-app text-ink-muted hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="max-h-[640px] divide-y divide-line overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-3">
                  <div className="skeleton h-12 w-full rounded-md" />
                </li>
              ))
            ) : filtered.length === 0 ? (
              <li className="p-4">
                <EmptyState icon={<Icon.Globe size={18} />} title="Nothing in this view" />
              </li>
            ) : (
              filtered.map((a) => {
                const isActive = a.id === selectedId;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => pickArticle(a)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? 'bg-accent-soft' : 'hover:bg-app'
                      }`}
                    >
                      <img src={a.cover_image_url} alt="" className="h-10 w-12 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium text-ink font-bangla">{a.title_bn}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge status={a.translation_status} />
                          <span className="truncate text-[10px] text-ink-muted">{a.author.name_en}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Card>

        {/* Editor */}
        {selected ? (
          <div className="space-y-4">
            <Card padded>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base font-semibold text-ink">{selected.title_en || selected.title_bn}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <Avatar name={selected.author.name_en} size="xs" />
                    <span>{selected.author.name_en}</span>
                    <span>·</span>
                    <span>{new Date(selected.published_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <Badge tone="accent">{selected.category.name_en}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleAuto} iconLeft={<Icon.Wand size={14} />}>
                    Auto-translate
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSave} iconLeft={<Icon.Pencil size={14} />}>
                    Save draft
                  </Button>
                  <Button size="sm" onClick={handleApprove} iconLeft={<Icon.Check size={14} />}>
                    Approve
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Source */}
              <Card padded>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">বাংলা <span className="text-ink-faint">/ source</span></p>
                  <StatusBadge status="complete" />
                </div>
                <p className="mb-1.5 text-xs text-ink-muted">শিরোনাম</p>
                <div className="rounded-md bg-app p-3 text-sm text-ink font-bangla">{selected.title_bn}</div>
                <p className="mt-3 mb-1.5 text-xs text-ink-muted">সারসংক্ষেপ</p>
                <div className="rounded-md bg-app p-3 text-sm text-ink font-bangla">{selected.subtitle_bn}</div>
                <p className="mt-3 mb-1.5 text-xs text-ink-muted">বিষয়বস্তু</p>
                <div
                  className="prose-sm max-h-72 overflow-y-auto rounded-md bg-app p-3 text-sm leading-relaxed text-ink font-bangla"
                  dangerouslySetInnerHTML={{ __html: selected.body_bn }}
                />
              </Card>

              {/* Translation */}
              <Card padded>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">English <span className="text-ink-faint">/ translation</span></p>
                  <StatusBadge status={selected.translation_status} />
                </div>
                <Input
                  label="Title"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="English title"
                />
                <div className="h-3" />
                <Textarea
                  label="Subtitle"
                  rows={3}
                  value={subtitleEn}
                  onChange={(e) => setSubtitleEn(e.target.value)}
                />
                <div className="h-3" />
                <Textarea
                  label="Body"
                  rows={10}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="Begin translating the article body…"
                />
              </Card>
            </div>
          </div>
        ) : (
          <Card padded>
            <EmptyState
              icon={<Icon.Globe size={20} />}
              title="Pick an article to start translating"
              description="The queue lists articles by translation status. Choose one to view the source and edit the English version."
            />
          </Card>
        )}
      </div>
    </AdminPageShell>
  );
}
