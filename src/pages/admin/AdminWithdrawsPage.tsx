import { AdminShell } from '@/components/admin/AdminShell';
import { WithdrawRequestsModule } from '@/components/admin/unified/WithdrawRequestsModule';

const AdminWithdrawsPage = () => {
  return (
    <AdminShell title="Withdrawals" description="Process user withdrawal requests">
      <WithdrawRequestsModule />
    </AdminShell>
  );
};

export default AdminWithdrawsPage;
