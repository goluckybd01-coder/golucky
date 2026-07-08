import { AdminShell } from '@/components/admin/AdminShell';
import { DepositsModule } from '@/components/admin/unified/DepositsModule';

const AdminDepositsPage = () => {
  return (
    <AdminShell title="Deposits" description="Review and process deposit requests">
      <DepositsModule />
    </AdminShell>
  );
};

export default AdminDepositsPage;
