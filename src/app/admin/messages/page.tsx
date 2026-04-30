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
import { messages } from '@/lib/supabase';
import type { ContactMessageRow } from '@/lib/supabase/types';

export default function AdminMessagesPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const res = await messages.listMessages(200);
    setRows(res.data);
    setLoading(false);
    if (!selectedId && res.data[0]) setSelectedId(res.data[0].id);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const handleStatus = async (status: 'unread' | 'read' | 'archived') => {
    if (!selected) return;
    await messages.markStatus(selected.id, status);
    push({ tone: 'success', title: `Marked ${status}` });
    reload();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm('Delete this message permanently?')) return;
    await messages.deleteMessage(selected.id);
    setSelectedId(null);
    push({ tone: 'success', title: 'Deleted' });
    reload();
  };

  return (
    <AdminPageShell title="Messages">
      <PageHeader
        title="Contact messages"
        description="Inbound messages from the public contact form."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Messages' }]}
        actions={
          <Button variant="secondary" onClick={reload} iconLeft={<Icon.Refresh size={14} />}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-line px-4 py-3 text-xs text-ink-muted">
            {loading ? 'Loading…' : `${rows.length} message${rows.length === 1 ? '' : 's'}`}
          </div>
          {!loading && rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Icon.Mail size={18} />} title="No messages yet" />
            </div>
          ) : (
            <ul className="max-h-[640px] divide-y divide-line overflow-y-auto">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      selectedId === m.id ? 'bg-accent-soft' : 'hover:bg-app'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                      <Badge tone={m.status === 'unread' ? 'info' : m.status === 'archived' ? 'neutral' : 'success'}>
                        {m.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-ink-muted">{m.subject || m.message.slice(0, 60)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false} className="overflow-hidden">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{selected.subject || '(no subject)'}</p>
                  <p className="text-xs text-ink-muted">
                    From {selected.name} ({selected.email}) ·{' '}
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleStatus('read')}>
                    Mark read
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleStatus('archived')}>
                    Archive
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleDelete} iconLeft={<Icon.Trash size={14} />}>
                    Delete
                  </Button>
                </div>
              </div>
              <div className="p-5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{selected.message}</div>
              <div className="border-t border-line px-5 py-3">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Phulpur24 enquiry')}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Reply via email →
                </a>
              </div>
            </>
          ) : (
            <EmptyState icon={<Icon.Mail size={20} />} title="Pick a message" description="Select a message from the list." />
          )}
        </Card>
      </div>
    </AdminPageShell>
  );
}
