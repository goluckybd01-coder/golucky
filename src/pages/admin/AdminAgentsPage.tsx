import { AdminShell } from '@/components/admin/AdminShell';
import { AgentDashboard } from '@/components/admin/unified/AgentDashboard';

const AdminAgentsPage = () => {
  return (
    <AdminShell title="Agents" description="Manage agent applications and commissions">
      <AgentDashboard />
    </AdminShell>
  );
};

export default AdminAgentsPage;
