import ContactPageContent from '@/components/pages/ContactPageContent';
import { getCategories } from '@/lib/data';

export const revalidate = 300;

export default async function BnContactPage() {
  const categories = await getCategories();
  return <ContactPageContent lang="bn" categories={categories} />;
}
