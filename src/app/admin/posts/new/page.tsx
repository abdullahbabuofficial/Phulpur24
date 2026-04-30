import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import PostEditor from '@/components/admin/PostEditor';
import { authors as authorsRepo, categories as categoriesRepo, tags as tagsRepo } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const [cats, auths, allTags] = await Promise.all([
    categoriesRepo.listCategories(),
    authorsRepo.listAuthors(),
    tagsRepo.listTags(),
  ]);

  return (
    <AdminPageShell title="New post">
      <PageHeader
        title="Create a new article"
        description="Draft, translate, and publish a story to Phulpur24."
        crumbs={[
          { label: 'Console', href: '/admin/dashboard' },
          { label: 'Posts', href: '/admin/posts' },
          { label: 'New' },
        ]}
      />
      <PostEditor mode="create" categories={cats.data ?? []} authors={auths.data ?? []} allTags={allTags.data ?? []} />
    </AdminPageShell>
  );
}
