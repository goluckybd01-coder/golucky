import { AdminShell } from '@/components/admin/AdminShell';
import { AuditLogsModule } from '@/components/admin/unified/AuditLogsModule';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

const REPORT_FILE_NAME = 'admin-final-audit-inventory.pdf';

const downloadAuditInventoryReport = () => {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  doc.setProperties({
    title: 'GoLucky Admin Final Audit & Feature Inventory',
    subject: 'Admin, CMS, automation, wallet, and control module inventory',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GoLucky Admin Final Audit & Feature Inventory', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, 14, 27);
  doc.text('Scope: admin, CMS, automation, wallet, payment, game-control, and audit modules.', 14, 34);

  const sections = [
    ['Admin Access', 'Role-gated admin routes, secure session checks, and audit logging are required for privileged actions.'],
    ['Wallet Controls', 'Frontend balance is read-only; deposits, withdrawals, bets, and credits must flow through backend operations.'],
    ['CMS Diagnostics', 'Admin-only empty-state diagnostics expose role status, policy checks, and last fetch timestamps.'],
    ['Payment Operations', 'PayFastFlow remains the unified payment channel with BDT formatting across user-facing flows.'],
    ['Game Operations', 'Game provider codes stay normalized and game actions revalidate wallet state after every result.'],
    ['Security Posture', 'Sensitive tables require access rules, audit trails, and server-side role validation.'],
  ];

  let y = 48;
  sections.forEach(([title, body], index) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${title}`, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(body, 180);
    doc.text(lines, 18, y);
    y += lines.length * 5 + 7;
  });

  doc.save(REPORT_FILE_NAME);
};

const AdminAuditLogsPage = () => {
  return (
    <AdminShell title="Audit Logs" description="View all administrative actions">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Final Admin Audit & Feature Inventory Report
          </p>
          <p className="text-xs text-muted-foreground">
            Complete audit of all admin, CMS, automation, and control modules.
          </p>
        </div>
        <Button size="sm" type="button" onClick={downloadAuditInventoryReport}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
      <AuditLogsModule />
    </AdminShell>
  );
};

export default AdminAuditLogsPage;
