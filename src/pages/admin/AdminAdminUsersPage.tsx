import { AdminShell } from '@/components/admin/AdminShell';
import { StaffManagement } from '@/components/admin/unified/StaffManagement';

const AdminAdminUsersPage = () => {
  return (
    <AdminShell title="Admin Users" description="Manage staff accounts and permissions">
      <StaffManagement />
    </AdminShell>
  );
};

export default AdminAdminUsersPage;
