'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Input, Select } from '@/components/admin/ui/Input';
import { Badge, StatusBadge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Icon } from '@/components/admin/ui/Icon';
import { Tabs } from '@/components/admin/ui/Tabs';
import { useToast } from '@/components/admin/ui/Toast';
import type {
  ArticleWithRelations,
  CategoryRow,
  PostStatus,
  TranslationStatus,
} from '@/lib/supabase/types';
import { posts as postsRepo } from '@/lib/supabase';

type StatusFilter = PostStatus | 'all' | 'scheduled';
type SortKey = 'newest' | 'oldest' | 'most-views' | 'best-seo';

const PAGE_SIZE = 10;

export default function PostsManager({ categories }: { categories: CategoryRow[] }) {
  const { push } = useToast();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [translation, setTranslation] = useState<TranslationStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    rows: ArticleWithRelations[];
    total: number;
    totalPages: number;
  }>({ rows: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Statuses with counts (computed off the in-memory db)
  const statusTabs = useMemo(
    () => [
      { id: 'all' as StatusFilter, label: 'All' },
      { id: 'published' as StatusFilter, label: 'Published' },
      { id: 'scheduled' as StatusFilter, label: 'Scheduled' },
      { id: 'draft' as StatusFilter, label: 'Drafts' },
      { id: 'pending' as StatusFilter, label: 'Pending' },
      { id: 'archived' as StatusFilter, label: 'Archived' },
    ],
    []
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    postsRepo
      .listPosts({
        search: debouncedSearch,
        status,
        categoryId,
        translation,
        sort,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setData({ rows: res.rows, total: res.total, totalPages: res.totalPages });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, categoryId, translation, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, categoryId, translation, sort]);

  const visibleIds = data.rows.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const toggleAll = () =>
    setSelected((cur) =>
      allVisibleSelected ? cur.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...cur, ...visibleIds]))
    );

  const refreshList = async () => {
    const res = await postsRepo.listPosts({
      search: debouncedSearch,
      status,
      categoryId,
      translation,
      sort,
      page,
      pageSize: PAGE_SIZE,
    });
    setData({ rows: res.rows, total: res.total, totalPages: res.totalPages });
  };

  const handleBulk = async (next: PostStatus) => {
    if (selected.length === 0) {
      push({ tone: 'warning', title: 'Pick at least one post', description: 'Select rows in the table first.' });
      return;
    }
    const updateResult = await postsRepo.bulkUpdateStatus(selected, next);
    if (updateResult.error) {
      push({ tone: 'error', title: 'Bulk update failed', description: updateResult.error.message });
      return;
    }
    push({
      tone: 'success',
      title: `${selected.length} post${selected.length === 1 ? '' : 's'} -> ${next}`,
    });
    setSelected([]);
    await refreshList();
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      push({ tone: 'warning', title: 'Pick at least one post' });
      return;
    }
    if (!confirm(`Archive ${selected.length} post${selected.length === 1 ? '' : 's'}? They can be restored from the Archived tab.`)) return;
    const archiveResult = await postsRepo.bulkDelete(selected);
    if (archiveResult.error) {
      push({ tone: 'error', title: 'Archive failed', description: archiveResult.error.message });
      return;
    }
    push({ tone: 'success', title: `Archived ${selected.length} post${selected.length === 1 ? '' : 's'}` });
    setSelected([]);
    await refreshList();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Archive "${title}"? You can restore it from the Archived tab.`)) return;
    const archiveResult = await postsRepo.deletePost(id);
    if (archiveResult.error) {
      push({ tone: 'error', title: 'Archive failed', description: archiveResult.error.message });
      return;
    }
    push({ tone: 'success', title: 'Post archived' });
    setSelected((s) => s.filter((x) => x !== id));
    await refreshList();
  };

  const handleRestore = async (id: string, title: string) => {
    const restoreResult = await postsRepo.restorePost(id);
    if (restoreResult.error) {
      push({ tone: 'error', title: 'Restore failed', description: restoreResult.error.message });
      return;
    }
    push({ tone: 'success', title: 'Post restored', description: title });
    setSelected((s) => s.filter((x) => x !== id));
    await refreshList();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs<StatusFilter> tabs={statusTabs} active={status} onChange={setStatus} variant="pills" />
        <div className="flex flex-wrap items-center gap-2">
          {selected.length > 0 ? (
            <>
              <span className="text-xs text-ink-muted">{selected.length} selected</span>
              <Button size="sm" variant="secondary" onClick={() => handleBulk('published')}>
                Publish
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulk('draft')}>
                {status === 'archived' ? 'Restore' : 'Move to draft'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulk('archived')}>
                Archive
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete} iconLeft={<Icon.Trash size={14} />}>
                Archive selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </>
          ) : null}
          <Link href="/admin/posts/new">
            <Button iconLeft={<Icon.Plus size={14} />}>New post</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex-1 min-w-[220px] max-w-md">
            <Input
              placeholder="Search by title, author, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              iconLeft={<Icon.Search size={16} />}
            />
          </div>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
            className="w-44"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </Select>
          <Select
            value={translation}
            onChange={(e) => setTranslation(e.target.value as TranslationStatus | 'all')}
            aria-label="Filter by translation"
            className="w-44"
          >
            <option value="all">All translations</option>
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
            <option value="missing">Missing</option>
          </Select>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort posts"
            className="w-44"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-views">Most views</option>
            <option value="best-seo">Best SEO</option>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Author</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Translation</th>
                <th className="px-4 py-3 text-right font-medium">SEO</th>
                <th className="px-4 py-3 text-right font-medium">Views</th>
                <th className="w-[1%] px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="skeleton h-4 w-full rounded-md" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.rows.map((row) => (
                    (() => {
                      const publishAtMs = Date.parse(row.published_at || '');
                      const isScheduled =
                        row.status === 'published' &&
                        Number.isFinite(publishAtMs) &&
                        publishAtMs > Date.now();
                      return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        selected.includes(row.id) ? 'bg-accent-soft/40' : 'hover:bg-app'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() => toggle(row.id)}
                          aria-label={`Select ${row.title_en}`}
                          className="h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.cover_image_url?.trim() ? (
                            <img
                              src={row.cover_image_url}
                              alt=""
                              className="h-10 w-14 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-app text-[10px] text-ink-faint">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/admin/posts/${row.id}`}
                              className="line-clamp-1 text-sm font-medium text-ink hover:text-accent"
                            >
                              {row.title_en || row.title_bn}
                            </Link>
                            <p className="line-clamp-1 text-xs text-ink-muted font-bangla">{row.title_bn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: row.category.color }}
                        >
                          {row.category.name_en}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{row.author.name_en}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={row.status} />
                          {isScheduled ? (
                            <span title={`Scheduled for ${new Date(publishAtMs).toLocaleString()}`}>
                              <Badge tone="warning" dot>
                                Scheduled
                              </Badge>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.translation_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          tone={row.seo_score >= 80 ? 'success' : row.seo_score >= 60 ? 'warning' : 'danger'}
                          dot
                        >
                          {row.seo_score}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-ink">{row.views.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/posts/${row.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-app hover:text-ink"
                            aria-label="Edit"
                          >
                            <Icon.Pencil size={14} />
                          </Link>
                          <Link
                            href={`/bn/news/${row.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-app hover:text-ink"
                            aria-label="View on site"
                          >
                            <Icon.ExternalLink size={14} />
                          </Link>
                          {row.status !== 'archived' ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(row.id, row.title_en || row.title_bn)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
                              aria-label="Archive"
                            >
                              <Icon.Trash size={14} />
                            </button>
                          ) : null}
                          {row.status === 'archived' ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(row.id, row.title_en || row.title_bn)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-app hover:text-ink"
                              aria-label="Restore"
                            >
                              <Icon.Refresh size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                      );
                    })()
                  ))}
              {!loading && data.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10">
                    <EmptyState
                      icon={<Icon.Posts size={20} />}
                      title="No posts match your filters"
                      description="Try clearing some filters or searching with a shorter keyword."
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearch('');
                            setStatus('all');
                            setCategoryId('all');
                            setTranslation('all');
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-muted">
          <span>
            {data.total === 0
              ? 'No posts'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, data.total)} of ${data.total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              iconLeft={<Icon.ChevronLeft size={14} />}
            >
              Prev
            </Button>
            <span className="text-xs">
              Page {page} of {data.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              iconRight={<Icon.ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

