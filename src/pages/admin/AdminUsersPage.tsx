import { AdminShell } from '@/components/admin/AdminShell';
import { UsersModule } from '@/components/admin/unified/UsersModule';

const AdminUsersPage = () => {
  return (
    <AdminShell title="Users" description="Manage all registered users">
      <UsersModule />
    </AdminShell>
  );
};

export default AdminUsersPage;
