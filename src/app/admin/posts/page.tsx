import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import PostsManager from '@/components/admin/PostsManager';
import { categories as categoriesRepo } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function PostsListPage() {
  const cats = await categoriesRepo.listCategories();
  return (
    <AdminPageShell title="Posts">
      <PageHeader
        title="Posts"
        description="Browse, filter, and manage every article published or in progress."
        crumbs={[{ label: 'Console', href: '/admin/dashboard' }, { label: 'Posts' }]}
      />
      <PostsManager categories={cats.data ?? []} />
    </AdminPageShell>
  );
}
