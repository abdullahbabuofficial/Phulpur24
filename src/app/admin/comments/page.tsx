'use client';

import { useEffect, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Tabs } from '@/components/admin/ui/Tabs';
import { Button } from '@/components/admin/ui/Button';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { comments } from '@/lib/supabase';
import type { CommentRow, ModerationStatus } from '@/lib/supabase/types';

type Filter = ModerationStatus | 'all';
const TABS: { id: Filter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'spam', label: 'Spam' },
  { id: 'all', label: 'All' },
];

const emptyCounts: Record<Filter, number> = { pending: 0, approved: 0, rejected: 0, spam: 0, all: 0 };

export default function AdminCommentsPage() {
  const { push } = useToast();
  const [filter, setFilter] = useState<Filter>('pending');
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<Filter, number>>(emptyCounts);

  const refreshCounts = async () => {
    const c = await comments.countByModerationStatus();
    setCounts({
      pending: c.pending,
      approved: c.approved,
      rejected: c.rejected,
      spam: c.spam,
      all: c.all,
    });
  };

  const reload = async (status: Filter = filter) => {
    setLoading(true);
    const res = await comments.listAllForModeration(status, 300);
    setRows(res.data);
    setLoading(false);
    await refreshCounts();
  };

  useEffect(() => {
    void refreshCounts();
  }, []);

  useEffect(() => {
    reload(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const moderate = async (id: string, status: ModerationStatus) => {
    await comments.moderate(id, status);
    push({ tone: 'success', title: `Marked ${status}` });
    reload(filter);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    await comments.deleteComment(id);
    push({ tone: 'success', title: 'Deleted' });
    reload(filter);
  };

  return (
    <AdminPageShell title="Comments">
      <PageHeader
        title="Comments moderation"
        description="Approve, reject, or delete reader comments. New comments arrive in Pending."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Comments' }]}
      />

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-line px-3 pt-3">
          <Tabs<Filter>
            tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] || undefined }))}
            active={filter}
            onChange={setFilter}
          />
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Icon.Activity size={18} />} title={`No ${filter} comments`} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span className="font-medium text-ink">{c.author_name}</span>
                      {c.author_email ? <span>· {c.author_email}</span> : null}
                      <Badge
                        tone={
                          c.status === 'approved'
                            ? 'success'
                            : c.status === 'rejected'
                            ? 'danger'
                            : c.status === 'spam'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {c.status}
                      </Badge>
                      <span>· {new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{c.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">on article: <span className="font-mono">{c.article_id}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status !== 'approved' ? (
                      <Button size="sm" variant="secondary" onClick={() => moderate(c.id, 'approved')}>
                        Approve
                      </Button>
                    ) : null}
                    {c.status !== 'rejected' ? (
                      <Button size="sm" variant="ghost" onClick={() => moderate(c.id, 'rejected')}>
                        Reject
                      </Button>
                    ) : null}
                    {c.status !== 'spam' ? (
                      <Button size="sm" variant="ghost" onClick={() => moderate(c.id, 'spam')}>
                        Spam
                      </Button>
                    ) : null}
                    <Button size="sm" variant="danger" onClick={() => remove(c.id)} iconLeft={<Icon.Trash size={14} />}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminPageShell>
  );
}
