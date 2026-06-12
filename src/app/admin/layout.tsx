import { requireAdminPage } from '@/lib/admin-auth';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage('dashboard:view');

  return <AdminShell user={user}>{children}</AdminShell>;
}
