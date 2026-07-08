import { useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { RolePermissionManager } from '@/components/admin/RolePermissionManager';
import { AssignSuperAdminForm } from '@/components/admin/AssignSuperAdminForm';
import { StaffRole } from '@/lib/adminPermissions';

const AdminRolesPage = () => {
  const [selectedRole, setSelectedRole] = useState<StaffRole>('super_admin');

  return (
    <AdminShell
      title="Roles & Permissions"
      description="View and manage admin role permissions"
    >
      <div className="space-y-6">
        <AssignSuperAdminForm />
        <RolePermissionManager
          selectedRole={selectedRole}
          onRoleSelect={setSelectedRole}
        />
      </div>
    </AdminShell>
  );
};

export default AdminRolesPage;
