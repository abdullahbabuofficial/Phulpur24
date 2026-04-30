import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { ToastProvider } from '@/components/admin/ui/Toast';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGate>
      <ToastProvider>{children}</ToastProvider>
    </AdminAuthGate>
  );
}
