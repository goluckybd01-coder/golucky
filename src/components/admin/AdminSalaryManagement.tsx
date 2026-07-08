import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Plus, Edit, Trash2, Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface SalaryRecord {
  id: string;
  user_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { username: string; email: string };
}

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  profiles?: { username: string; email: string };
}

export function AdminSalaryManagement() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    amount: "",
    period_start: "",
    period_end: "",
    notes: "",
  });

  const { data: salaryRecords, isLoading } = useQuery({
    queryKey: ["admin-salary-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SalaryRecord[];
    },
  });

  const { data: staffMembers } = useQuery({
    queryKey: ["admin-staff-for-salary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("salary_records").insert({
        user_id: data.user_id,
        amount: parseFloat(data.amount),
        period_start: data.period_start,
        period_end: data.period_end,
        notes: data.notes || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-salary-records"] });
      toast.success("Salary record created");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; amount?: number }) => {
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }
      const { error } = await supabase.from("salary_records").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-salary-records"] });
      toast.success("Salary record updated");
      setEditingRecord(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-salary-records"] });
      toast.success("Salary record deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ user_id: "", amount: "", period_start: "", period_end: "", notes: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const markAsPaid = (id: string) => {
    updateMutation.mutate({ id, status: "paid" });
  };

  const totalPending = salaryRecords?.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalPaid = salaryRecords?.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Salary Management</h2>
          <p className="text-muted-foreground">Manage staff salaries and payments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Salary Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Salary Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staffMembers?.map((staff) => (
                      <SelectItem key={staff.user_id} value={staff.user_id}>
                        {staff.user_id.slice(0, 8)}... ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period Start</Label>
                  <Input type="date" value={formData.period_start} onChange={(e) => setFormData({ ...formData, period_start: e.target.value })} required />
                </div>
                <div>
                  <Label>Period End</Label>
                  <Input type="date" value={formData.period_end} onChange={(e) => setFormData({ ...formData, period_end: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>Create Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{salaryRecords?.filter(r => r.status === "pending").length || 0} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{salaryRecords?.filter(r => r.status === "paid").length || 0} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">staff members</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-bold">${record.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(record.period_start), "MMM d")} - {format(new Date(record.period_end), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === "paid" ? "default" : "secondary"}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {record.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(record.id)}>
                            Mark Paid
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
