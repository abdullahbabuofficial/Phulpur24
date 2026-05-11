'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Input, Select, Textarea } from '@/components/admin/ui/Input';
import { Badge, StatusBadge } from '@/components/admin/ui/Badge';
import { Icon } from '@/components/admin/ui/Icon';
import { Tabs } from '@/components/admin/ui/Tabs';
import { Switch } from '@/components/admin/ui/Switch';
import { useToast } from '@/components/admin/ui/Toast';
import { posts as postsRepo } from '@/lib/supabase';
import type {
  ArticleWithRelations,
  AuthorRow,
  CategoryRow,
  PostStatus,
  TagRow,
  TranslationStatus,
} from '@/lib/supabase/types';

const TABS = ['content', 'seo', 'translation', 'ai', 'preview'] as const;
type Tab = (typeof TABS)[number];
const tabLabel: Record<Tab, string> = {
  content: 'Content',
  seo: 'SEO',
  translation: 'Translation',
  ai: 'AI Assistant',
  preview: 'Preview',
};

const AI_DRAFT_KEY = 'phulpur24.aiDraft';

interface Draft {
  id?: string;
  slug: string;
  title_bn: string;
  title_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  body_bn: string;
  body_en: string;
  category_id: string;
  author_id: string;
  cover_image_url: string;
  cover_image_caption: string;
  status: PostStatus;
  translation_status: TranslationStatus;
  featured: boolean;
  breaking: boolean;
  seo_title: string;
  seo_description: string;
  seo_focus_keyword: string;
  tag_ids: string[];
}

interface PostEditorProps {
  mode: 'create' | 'edit';
  initial?: ArticleWithRelations;
  categories: CategoryRow[];
  authors: AuthorRow[];
  allTags: TagRow[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function buildInitialDraft(initial?: ArticleWithRelations, categories: CategoryRow[] = [], authors: AuthorRow[] = []): Draft {
  return {
    id: initial?.id,
    slug: initial?.slug ?? '',
    title_bn: initial?.title_bn ?? '',
    title_en: initial?.title_en ?? '',
    subtitle_bn: initial?.subtitle_bn ?? '',
    subtitle_en: initial?.subtitle_en ?? '',
    body_bn: initial?.body_bn ?? '',
    body_en: initial?.body_en ?? '',
    category_id: initial?.category.id ?? categories[0]?.id ?? '',
    author_id: initial?.author.id ?? authors[0]?.id ?? '',
    cover_image_url: initial?.cover_image_url ?? '',
    cover_image_caption: initial?.cover_image_caption ?? '',
    status: initial?.status ?? 'draft',
    translation_status: initial?.translation_status ?? 'missing',
    featured: initial?.featured ?? false,
    breaking: initial?.breaking ?? false,
    seo_title: initial?.seo_title ?? initial?.title_en ?? '',
    seo_description: initial?.seo_description ?? initial?.subtitle_en ?? '',
    seo_focus_keyword: initial?.seo_focus_keyword ?? '',
    tag_ids: initial?.tags.map((t) => t.id) ?? [],
  };
}

export default function PostEditor({ mode, initial, categories, authors, allTags }: PostEditorProps) {
  const { push } = useToast();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('content');
  const [draft, setDraft] = useState<Draft>(() => buildInitialDraft(initial, categories, authors));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  type MdAction =
    | { wrap: false; prefix: string; line?: undefined }
    | { wrap: false; prefix?: undefined; line: string }
    | { wrap: true; before: string; after: string; placeholder: string };

  const applyMarkdown = (action: MdAction) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = draft.body_en;
    let next = value;
    let newCursor = end;

    if (action.wrap) {
      const selected = value.slice(start, end) || action.placeholder;
      const inserted = `${action.before}${selected}${action.after}`;
      next = value.slice(0, start) + inserted + value.slice(end);
      newCursor = start + inserted.length;
    } else if (action.line) {
      const insertAt = value.slice(0, start).lastIndexOf('\n') + 1;
      next = value.slice(0, insertAt) + action.line + '\n' + value.slice(insertAt);
      newCursor = insertAt + action.line.length;
    } else if (action.prefix) {
      // Prefix the current line
      const lineStart = value.slice(0, start).lastIndexOf('\n') + 1;
      next = value.slice(0, lineStart) + action.prefix + value.slice(lineStart);
      newCursor = end + action.prefix.length;
    }

    update('body_en', next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = newCursor;
    });
  };

  const mdToHtml = (md: string) => {
    const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = escaped.split('\n');
    const out: string[] = [];
    let inList: 'ul' | 'ol' | null = null;
    const flushList = () => {
      if (inList) {
        out.push(`</${inList}>`);
        inList = null;
      }
    };
    for (const raw of lines) {
      const l = raw;
      if (/^### (.+)/.test(l)) {
        flushList();
        out.push(`<h3>${l.replace(/^### /, '')}</h3>`);
      } else if (/^## (.+)/.test(l)) {
        flushList();
        out.push(`<h2>${l.replace(/^## /, '')}</h2>`);
      } else if (/^> (.+)/.test(l)) {
        flushList();
        out.push(`<blockquote>${l.replace(/^> /, '')}</blockquote>`);
      } else if (/^\d+\. /.test(l)) {
        if (inList !== 'ol') {
          flushList();
          out.push('<ol>');
          inList = 'ol';
        }
        out.push(`<li>${l.replace(/^\d+\. /, '')}</li>`);
      } else if (/^- /.test(l)) {
        if (inList !== 'ul') {
          flushList();
          out.push('<ul>');
          inList = 'ul';
        }
        out.push(`<li>${l.replace(/^- /, '')}</li>`);
      } else if (l.trim() === '') {
        flushList();
        out.push('');
      } else {
        flushList();
        out.push(`<p>${l}</p>`);
      }
    }
    flushList();
    return out
      .join('\n')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  };
  const [tagInput, setTagInput] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-import any AI-Writer draft if creating new
  useEffect(() => {
    if (mode !== 'create' || typeof window === 'undefined') return;
    const raw = localStorage.getItem(AI_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<Draft> & { aiNotes?: string };
      setDraft((d) => ({
        ...d,
        title_bn: parsed.title_bn || d.title_bn,
        title_en: parsed.title_en || d.title_en,
        subtitle_bn: parsed.subtitle_bn || d.subtitle_bn,
        subtitle_en: parsed.subtitle_en || d.subtitle_en,
        body_bn: parsed.body_bn || d.body_bn,
        body_en: parsed.body_en || d.body_en,
      }));
      if (parsed.aiNotes) setAiNotes(parsed.aiNotes);
      localStorage.removeItem(AI_DRAFT_KEY);
      push({ tone: 'info', title: 'AI draft imported', description: 'Generated content placed into the editor.' });
    } catch {
      /* ignore */
    }
  }, [mode, push]);

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const onTitleChange = (v: string) => {
    setDraft((d) => ({
      ...d,
      title_en: v,
      slug: slugTouched ? d.slug : slugify(v),
      seo_title: d.seo_title || v,
    }));
  };

  const seoScore = useMemo(() => {
    let s = 30;
    if (draft.seo_title.length >= 35 && draft.seo_title.length <= 70) s += 20;
    if (draft.seo_description.length >= 120 && draft.seo_description.length <= 165) s += 20;
    const kw = draft.seo_focus_keyword.toLowerCase();
    if (kw && (draft.title_en + ' ' + draft.body_en).toLowerCase().includes(kw)) s += 20;
    if (draft.slug) s += 10;
    return Math.min(100, s);
  }, [draft.seo_title, draft.seo_description, draft.seo_focus_keyword, draft.title_en, draft.body_en, draft.slug]);

  const wordCount = useMemo(() => stripHtml(draft.body_en || draft.body_bn).split(/\s+/).filter(Boolean).length, [draft.body_en, draft.body_bn]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));

  const addTag = (raw: string) => {
    const value = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!value) return;
    const existing = allTags.find((t) => t.slug === value);
    const id = existing?.id ?? `tag-${value}`;
    if (draft.tag_ids.includes(id)) return;
    update('tag_ids', [...draft.tag_ids, id]);
  };

  const removeTag = (id: string) => update('tag_ids', draft.tag_ids.filter((x) => x !== id));

  const tagChips = draft.tag_ids.map((id) => {
    const found = allTags.find((t) => t.id === id);
    return { id, label: found ? found.name_en : id.replace('tag-', '') };
  });

  const persist = async (nextStatus?: PostStatus) => {
    setSaving(true);
    const status = nextStatus ?? draft.status;
    const res = await postsRepo.upsertPost({
      id: draft.id,
      slug: draft.slug || slugify(draft.title_en || 'untitled'),
      title_bn: draft.title_bn,
      title_en: draft.title_en,
      subtitle_bn: draft.subtitle_bn,
      subtitle_en: draft.subtitle_en,
      body_bn: draft.body_bn,
      body_en: draft.body_en,
      category_id: draft.category_id,
      author_id: draft.author_id,
      cover_image_url: draft.cover_image_url,
      cover_image_caption: draft.cover_image_caption,
      status,
      translation_status: draft.translation_status,
      featured: draft.featured,
      breaking: draft.breaking,
      seo_title: draft.seo_title || null,
      seo_description: draft.seo_description || null,
      seo_focus_keyword: draft.seo_focus_keyword || null,
      tag_ids: draft.tag_ids,
    });
    setSaving(false);
    if (res.error) {
      push({ tone: 'error', title: 'Save failed', description: res.error.message });
      return;
    }
    push({
      tone: 'success',
      title: status === 'published' ? 'Published' : status === 'pending' ? 'Submitted for review' : 'Draft saved',
    });
    if (mode === 'create' && res.data) {
      router.replace(`/admin/posts/${res.data.id}`);
    }
  };

  const generateAi = () => {
    const topic = draft.title_en || draft.title_bn || 'this story';
    setAiNotes(
      `Suggested lead for "${topic}":\n\n` +
        `Open with the local impact, follow with one official quote, and close with what readers should expect next. ` +
        `Be sure to include the focus keyword "${draft.seo_focus_keyword || 'Phulpur'}" in the first paragraph and again under a subheading.`
    );
    push({ tone: 'info', title: 'AI suggestion generated' });
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Main column */}
      <div className="min-w-0 space-y-5">
        {/* Title & slug */}
        <Card padded>
          <input
            value={draft.title_en}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Article title…"
            className="w-full bg-transparent text-2xl font-semibold text-ink placeholder:text-ink-faint focus:outline-none sm:text-[28px]"
          />
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <span className="rounded bg-app px-2 py-0.5 font-mono">/news/</span>
            <input
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug', slugify(e.target.value));
              }}
              placeholder="post-slug"
              className="flex-1 rounded border border-line bg-white px-2 py-1 font-mono focus:border-accent focus:outline-none"
            />
            <span className="text-ink-faint">·</span>
            <span>{wordCount} words · {readingTime} min</span>
          </div>
        </Card>

        {/* Tabs */}
        <Card padded={false}>
          <div className="px-3 pt-2">
            <Tabs<Tab>
              tabs={TABS.map((id) => ({ id, label: tabLabel[id] }))}
              active={tab}
              onChange={setTab}
            />
          </div>

          <div className="p-5 sm:p-6">
            {tab === 'content' ? (
              <div className="space-y-4">
                <Input
                  label="Excerpt / subtitle"
                  value={draft.subtitle_en}
                  onChange={(e) => update('subtitle_en', e.target.value)}
                  placeholder="A one-sentence summary that appears below the headline"
                  hint={`${draft.subtitle_en.length} chars · ideal: 80–160`}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Body (English)</label>
                  <div className="rounded-lg border border-line">
                    <div className="flex flex-wrap gap-1 border-b border-line bg-app px-2 py-1.5">
                      {([
                        { label: 'H2', md: { wrap: false, prefix: '## ' } },
                        { label: 'H3', md: { wrap: false, prefix: '### ' } },
                        { label: 'B', md: { wrap: true, before: '**', after: '**', placeholder: 'bold' } },
                        { label: 'I', md: { wrap: true, before: '*', after: '*', placeholder: 'italic' } },
                        { label: 'Quote', md: { wrap: false, prefix: '> ' } },
                        { label: 'Link', md: { wrap: true, before: '[', after: '](https://)', placeholder: 'text' } },
                        { label: '• List', md: { wrap: false, prefix: '- ' } },
                        { label: '1. List', md: { wrap: false, prefix: '1. ' } },
                        { label: 'Image', md: { wrap: false, line: '![alt](https://)' } },
                        { label: 'Code', md: { wrap: true, before: '`', after: '`', placeholder: 'code' } },
                      ] as const).map((b) => (
                        <button
                          type="button"
                          key={b.label}
                          className="rounded px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-white hover:text-ink"
                          onClick={() => applyMarkdown(b.md)}
                        >
                          {b.label}
                        </button>
                      ))}
                      <span className="ml-auto text-[10px] text-ink-faint self-center">Markdown supported</span>
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={draft.body_en}
                      onChange={(e) => update('body_en', e.target.value)}
                      placeholder="Write the English version of the article here. Markdown is supported."
                      className="block min-h-[280px] w-full resize-y bg-white p-4 text-sm leading-relaxed text-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'seo' ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <Input
                    label="SEO title"
                    value={draft.seo_title}
                    onChange={(e) => update('seo_title', e.target.value)}
                    hint={`${draft.seo_title.length}/70 — keep it punchy and keyword-rich`}
                    error={draft.seo_title.length > 70 ? 'Too long for Google snippets' : undefined}
                  />
                  <Textarea
                    label="Meta description"
                    rows={3}
                    value={draft.seo_description}
                    onChange={(e) => update('seo_description', e.target.value)}
                    hint={`${draft.seo_description.length}/160 — best between 120–160`}
                  />
                  <Input
                    label="Focus keyword"
                    value={draft.seo_focus_keyword}
                    onChange={(e) => update('seo_focus_keyword', e.target.value)}
                    hint="Used to score keyword presence in title and body"
                  />
                </div>
                <Card padded>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">SEO score</p>
                    <Badge tone={seoScore >= 80 ? 'success' : seoScore >= 60 ? 'warning' : 'danger'}>
                      {seoScore}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-app">
                    <div
                      className={`h-full rounded-full ${
                        seoScore >= 80 ? 'bg-success' : seoScore >= 60 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${seoScore}%` }}
                    />
                  </div>
                  <ul className="mt-4 space-y-1.5 text-xs text-ink-muted">
                    <li>· Title length 35–70 chars</li>
                    <li>· Description 120–165 chars</li>
                    <li>· Focus keyword in title and body</li>
                    <li>· URL slug populated</li>
                  </ul>
                  <div className="mt-4 rounded-lg border border-line bg-app p-3">
                    <p className="text-[11px] font-semibold text-ink-faint">Google preview</p>
                    <p className="mt-1.5 text-sm font-medium text-info">{draft.seo_title || 'Article title'}</p>
                    <p className="text-[11px] text-success-text">phulpur24.com/news/{draft.slug || 'post-slug'}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{draft.seo_description || 'Meta description preview…'}</p>
                  </div>
                </Card>
              </div>
            ) : null}

            {tab === 'translation' ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">বাংলা (Bangla)</p>
                    <StatusBadge status={draft.translation_status} />
                  </div>
                  <Input
                    value={draft.title_bn}
                    onChange={(e) => update('title_bn', e.target.value)}
                    placeholder="বাংলা শিরোনাম"
                    langClass="font-bangla"
                  />
                  <Textarea
                    value={draft.subtitle_bn}
                    onChange={(e) => update('subtitle_bn', e.target.value)}
                    placeholder="সারসংক্ষেপ"
                    rows={3}
                    langClass="font-bangla"
                  />
                  <Textarea
                    value={draft.body_bn}
                    onChange={(e) => update('body_bn', e.target.value)}
                    placeholder="বাংলা বিষয়বস্তু…"
                    rows={10}
                    langClass="font-bangla"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">English</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        update('title_en', draft.title_en || draft.title_bn);
                        update('body_en', draft.body_en || draft.body_bn);
                        update('translation_status', 'partial');
                        push({ tone: 'info', title: 'Bangla copied as starting point', description: 'Translation status set to partial.' });
                      }}
                    >
                      Copy Bangla → English
                    </Button>
                  </div>
                  <Input
                    value={draft.title_en}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="English title"
                  />
                  <Textarea
                    value={draft.subtitle_en}
                    onChange={(e) => update('subtitle_en', e.target.value)}
                    placeholder="Subtitle"
                    rows={3}
                  />
                  <Textarea
                    value={draft.body_en}
                    onChange={(e) => update('body_en', e.target.value)}
                    placeholder="English content…"
                    rows={10}
                  />
                  <Select
                    label="Translation status"
                    value={draft.translation_status}
                    onChange={(e) => update('translation_status', e.target.value as TranslationStatus)}
                  >
                    <option value="complete">Complete</option>
                    <option value="partial">Partial</option>
                    <option value="missing">Missing</option>
                  </Select>
                </div>
              </div>
            ) : null}

            {tab === 'ai' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent-soft via-white to-violet-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
                      <Icon.Sparkles size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">AI Writing Assistant</p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        Generate suggestions based on your draft, then apply them with one click.
                      </p>
                    </div>
                    <Button onClick={generateAi} iconLeft={<Icon.Wand size={14} />}>
                      Generate
                    </Button>
                  </div>
                </div>
                <Textarea
                  label="Suggestion / notes"
                  rows={8}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="AI suggestions appear here. Apply them to the body or use as outline."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      update('body_en', `${draft.body_en}\n\n${aiNotes}`.trim());
                      push({ tone: 'success', title: 'Notes appended to English body' });
                    }}
                    disabled={!aiNotes.trim()}
                  >
                    Append to body
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAiNotes('');
                      push({ tone: 'info', title: 'Notes cleared' });
                    }}
                  >
                    Clear notes
                  </Button>
                </div>
              </div>
            ) : null}

            {tab === 'preview' ? (
              <div className="rounded-2xl bg-app p-6">
                <article className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-card">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <Badge tone="accent">
                      {categories.find((c) => c.id === draft.category_id)?.name_en}
                    </Badge>
                    <span>·</span>
                    <span>{authors.find((a) => a.id === draft.author_id)?.name_en}</span>
                    <span>·</span>
                    <StatusBadge status={draft.status} />
                  </div>
                  <h1 className="text-2xl font-semibold text-ink">
                    {draft.title_en || draft.title_bn || 'Untitled story'}
                  </h1>
                  <p className="mt-1 text-sm text-ink-muted">{draft.subtitle_en || draft.subtitle_bn}</p>
                  {draft.cover_image_url.trim() ? (
                    <img src={draft.cover_image_url.trim()} alt="" className="mt-4 aspect-video w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mt-4 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-line text-ink-faint">
                      <Icon.Image size={20} />
                    </div>
                  )}
                  {draft.body_en ? (
                    <div
                      className="prose prose-sm mt-4 max-w-none text-sm leading-relaxed text-ink"
                      dangerouslySetInnerHTML={{ __html: mdToHtml(draft.body_en) }}
                    />
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                      Start writing in the Content tab to see the preview.
                    </p>
                  )}
                </article>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Right rail */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card padded>
          <CardHeader title="Publish" subtitle="Choose how this story goes live" />
          <div className="mt-4 space-y-3">
            <Select
              label="Status"
              value={draft.status}
              onChange={(e) => update('status', e.target.value as PostStatus)}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            <Switch
              label="Featured"
              description="Highlights on the homepage hero block."
              checked={draft.featured}
              onChange={(v) => update('featured', v)}
            />
            <Switch
              label="Breaking"
              description="Pinned to the top ticker for 24h."
              checked={draft.breaking}
              onChange={(v) => update('breaking', v)}
            />
            <div className="flex flex-col gap-2 pt-1">
              <Button onClick={() => persist('published')} loading={saving} iconLeft={<Icon.Check size={14} />}>
                {mode === 'create' ? 'Publish' : 'Update & publish'}
              </Button>
              <Button variant="secondary" onClick={() => persist('draft')} loading={saving}>
                Save draft
              </Button>
              {mode === 'edit' && draft.id ? (
                <Link href={`/bn/news/${draft.slug}`} target="_blank" rel="noreferrer">
                  <Button variant="ghost" fullWidth iconLeft={<Icon.ExternalLink size={14} />}>
                    Preview on site
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <Card padded>
          <CardHeader title="Organize" />
          <div className="mt-4 space-y-3">
            <Select
              label="Category"
              value={draft.category_id}
              onChange={(e) => update('category_id', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} / {c.name_bn}
                </option>
              ))}
            </Select>
            <Select
              label="Author"
              value={draft.author_id}
              onChange={(e) => update('author_id', e.target.value)}
            >
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_en} — {a.role}
                </option>
              ))}
            </Select>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput('');
                    }
                  }}
                  placeholder="Add a tag…"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    addTag(tagInput);
                    setTagInput('');
                  }}
                >
                  Add
                </Button>
              </div>
              {tagChips.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagChips.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-0.5 text-xs text-ink"
                    >
                      {c.label}
                      <button
                        type="button"
                        onClick={() => removeTag(c.id)}
                        className="text-ink-faint hover:text-danger"
                        aria-label={`Remove ${c.label}`}
                      >
                        <Icon.Close size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card padded>
          <CardHeader title="Cover image" />
          <div className="mt-4 space-y-2">
            {draft.cover_image_url.trim() ? (
              <img src={draft.cover_image_url.trim()} alt="" className="aspect-video w-full rounded-lg object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-line text-ink-faint">
                <Icon.Image size={20} />
              </div>
            )}
            <Input
              type="url"
              value={draft.cover_image_url}
              onChange={(e) => update('cover_image_url', e.target.value)}
              placeholder="https://…"
              hint="Use a 16:9 photo, ≥ 1200×675"
            />
            <Input
              value={draft.cover_image_caption}
              onChange={(e) => update('cover_image_caption', e.target.value)}
              placeholder="Image caption / alt text"
            />
          </div>
        </Card>
      </aside>
    </div>
  );
}
