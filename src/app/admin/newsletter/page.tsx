'use client';

import { useEffect, useState } from 'react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Badge } from '@/components/admin/ui/Badge';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Icon } from '@/components/admin/ui/Icon';
import { useToast } from '@/components/admin/ui/Toast';
import { newsletter } from '@/lib/supabase';
import type { NewsletterSubscriberRow } from '@/lib/supabase/types';

export default function AdminNewsletterPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<NewsletterSubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const res = await newsletter.listSubscribers(500);
    setRows(res.data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDelete = async (row: NewsletterSubscriberRow) => {
    if (!confirm(`Unsubscribe ${row.email}?`)) return;
    const res = await newsletter.unsubscribe(row.id);
    if (res.error) return push({ tone: 'error', title: 'Unsubscribe failed' });
    push({ tone: 'success', title: 'Unsubscribed' });
    reload();
  };

  const handleExport = () => {
    const csv = ['email,lang,source,subscribed_at']
      .concat(rows.map((r) => [r.email, r.lang, r.source, r.subscribed_at].join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push({ tone: 'success', title: 'CSV exported' });
  };

  return (
    <AdminPageShell title="Newsletter">
      <PageHeader
        title="Newsletter subscribers"
        description="Emails collected from the public site footer and homepage signup form."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Newsletter' }]}
        actions={
          <>
            <Button variant="secondary" onClick={reload} iconLeft={<Icon.Refresh size={14} />}>
              Refresh
            </Button>
            <Button onClick={handleExport} iconLeft={<Icon.Download size={14} />} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-line px-5 py-4 text-sm text-ink-muted">
          {loading ? 'Loading…' : `${rows.length} subscriber${rows.length === 1 ? '' : 's'}`}
        </div>
        {!loading && rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Icon.Mail size={20} />}
              title="No subscribers yet"
              description="Subscribers will appear here when readers sign up via the public site."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-app text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Language</th>
                  <th className="px-5 py-3 text-left font-medium">Source</th>
                  <th className="px-5 py-3 text-left font-medium">Subscribed</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-app">
                    <td className="px-5 py-3 font-medium text-ink">{r.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone="accent">{r.lang.toUpperCase()}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{r.source}</td>
                    <td className="px-5 py-3 text-ink-muted">{new Date(r.subscribed_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger"
                        aria-label={`Unsubscribe ${r.email}`}
                      >
                        <Icon.Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminPageShell>
  );
}
