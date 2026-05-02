import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { AdminWorkspaceProvider } from '@/components/admin/AdminWorkspaceContext';
import { ToastProvider } from '@/components/admin/ui/Toast';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGate>
      <ToastProvider>
        <AdminWorkspaceProvider>{children}</AdminWorkspaceProvider>
      </ToastProvider>
    </AdminAuthGate>
  );
}
