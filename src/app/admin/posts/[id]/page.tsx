import { notFound } from 'next/navigation';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import PostEditor from '@/components/admin/PostEditor';
import { authors as authorsRepo, categories as categoriesRepo, tags as tagsRepo, posts as postsRepo } from '@/lib/supabase';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const [post, cats, auths, allTags] = await Promise.all([
    postsRepo.getPostById(id),
    categoriesRepo.listCategories(),
    authorsRepo.listAuthors(),
    tagsRepo.listTags(),
  ]);

  if (!post.data) notFound();

  return (
    <AdminPageShell title={`Edit · ${post.data.title_en}`}>
      <PageHeader
        title={post.data.title_en || post.data.title_bn}
        description="Edit, translate, and publish updates to this article."
        crumbs={[
          { label: 'Console', href: '/admin/dashboard' },
          { label: 'Posts', href: '/admin/posts' },
          { label: 'Edit' },
        ]}
      />
      <PostEditor
        mode="edit"
        initial={post.data}
        categories={cats.data ?? []}
        authors={auths.data ?? []}
        allTags={allTags.data ?? []}
      />
    </AdminPageShell>
  );
}
