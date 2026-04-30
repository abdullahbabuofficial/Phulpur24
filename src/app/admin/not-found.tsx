import Link from 'next/link';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Card } from '@/components/admin/ui/Card';
import { Button } from '@/components/admin/ui/Button';
import { Icon } from '@/components/admin/ui/Icon';

export default function AdminNotFound() {
  return (
    <AdminPageShell title="Not found">
      <PageHeader title="404 — Page not found" crumbs={[{ label: 'Console' }, { label: 'Not found' }]} />
      <Card className="max-w-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon.AlertTriangle size={20} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">We couldn’t find what you were looking for</h3>
        <p className="mt-1 text-sm text-ink-muted">
          The admin page or article you requested does not exist or has been moved.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/dashboard">
            <Button variant="primary" iconLeft={<Icon.Dashboard size={14} />}>
              Open dashboard
            </Button>
          </Link>
          <Link href="/admin/posts">
            <Button variant="secondary" iconLeft={<Icon.Posts size={14} />}>
              Browse posts
            </Button>
          </Link>
        </div>
      </Card>
    </AdminPageShell>
  );
}
