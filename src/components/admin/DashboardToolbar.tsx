'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/admin/ui/Button';
import { Icon } from '@/components/admin/ui/Icon';

export function DashboardRefreshButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="secondary"
      iconLeft={<Icon.Refresh size={14} />}
      onClick={() => router.refresh()}
    >
      Refresh
    </Button>
  );
}

export function DashboardNewArticleButton() {
  return (
    <Link href="/admin/posts/new">
      <Button iconLeft={<Icon.Plus size={14} />}>New article</Button>
    </Link>
  );
}
