import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Users, Plus, Trash2, Edit, Loader2,
  UserPlus, Mail, Lock, Crown, Eye, EyeOff, AlertTriangle,
  RefreshCw, Search, Filter, MoreVertical
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NewAdminShell } from '@/components/admin/NewAdminShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Staff role type matching the database enum
type StaffRole = 'super_admin' | 'finance_admin' | 'game_admin' | 'support' | 'agent_admin';

interface StaffAccount {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  staff_role: StaffRole;
  is_active: boolean | null;
  created_at: string | null;
  last_login_at: string | null;
}

const STAFF_ROLES: { value: StaffRole; label: string; color: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-500', description: 'Full system access' },
  { value: 'finance_admin', label: 'Finance Admin', color: 'bg-green-500', description: 'Deposits & withdrawals only' },
  { value: 'game_admin', label: 'Game Admin', color: 'bg-blue-500', description: 'Game control & results' },
  { value: 'agent_admin', label: 'Agent Admin', color: 'bg-orange-500', description: 'Agent management only' },
  { value: 'support', label: 'Support', color: 'bg-purple-500', description: 'User support & chat' },
];

const SuperAdminPage = () => {
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Add new admin modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState<{
    email: string;
    password: string;
    display_name: string;
    staff_role: StaffRole;
  }>({
    email: '',
    password: '',
    display_name: '',
    staff_role: 'support',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit modal
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>('support');
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<StaffAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStaffAccounts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('staff_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (roleFilter !== 'all' && STAFF_ROLES.some(r => r.value === roleFilter)) {
        query = query.eq('staff_role', roleFilter as StaffRole);
      }
      
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Load staff accounts error:', error);
        toast.error('Failed to load staff accounts: ' + error.message);
      } else {
        setStaffAccounts((data || []) as StaffAccount[]);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('Failed to load staff accounts');
    }
    
    setIsLoading(false);
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    loadStaffAccounts();
  }, [loadStaffAccounts]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      toast.error('Email and password are required');
      return;
    }
    
    if (newAdmin.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to create admin accounts');
        setIsCreating(false);
        return;
      }

      // Call the edge function to create admin
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: newAdmin.email.trim().toLowerCase(),
            password: newAdmin.password,
            display_name: newAdmin.display_name.trim() || null,
            staff_role: newAdmin.staff_role,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create admin');
      }
      
      toast.success('Admin account created successfully');
      setShowAddModal(false);
      setNewAdmin({ email: '', password: '', display_name: '', staff_role: 'support' });
      loadStaffAccounts();
    } catch (error: any) {
      console.error('Create admin error:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .update({
          staff_role: editRole,
          display_name: editName.trim() || null,
        })
        .eq('id', editingStaff.id);
      
      if (error) throw error;
      
      toast.success('Staff account updated successfully');
      setEditingStaff(null);
      loadStaffAccounts();
    } catch (error: any) {
      console.error('Update staff error:', error);
      toast.error(error.message || 'Failed to update staff account');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (staff: StaffAccount) => {
    try {
      const newStatus = !staff.is_active;
      const { error } = await supabase
        .from('staff_accounts')
        .update({ is_active: newStatus })
        .eq('id', staff.id);
      
      if (error) throw error;
      
      toast.success(newStatus ? 'Account activated' : 'Account deactivated');
      loadStaffAccounts();
    } catch (error: any) {
      console.error('Toggle active error:', error);
      toast.error(error.message || 'Failed to update account status');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      
      toast.success('Staff account deleted successfully');
      setDeleteConfirm(null);
      loadStaffAccounts();
    } catch (error: any) {
      console.error('Delete staff error:', error);
      toast.error(error.message || 'Failed to delete staff account');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = STAFF_ROLES.find(r => r.value === role);
    return (
      <Badge className={`${roleConfig?.color || 'bg-gray-500'} text-white`}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  const totalCount = staffAccounts.length;
  const activeCount = staffAccounts.filter(s => s.is_active).length;

  return (
    <NewAdminShell title="Super Admin" description="Manage all admin accounts and permissions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-400" />
              Super Admin Panel
            </h1>
            <p className="text-slate-400 mt-1">Manage admin accounts, roles & permissions</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-400" />
                  Create Admin Account
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new admin user with specific role and permissions
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="admin@example.com"
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Display Name</Label>
                  <Input
                    placeholder="Admin Name"
                    className="bg-slate-800 border-slate-700 text-white"
                    value={newAdmin.display_name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, display_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Role *</Label>
                  <Select
                    value={newAdmin.staff_role}
                    onValueChange={(value) => setNewAdmin({ ...newAdmin, staff_role: value as StaffRole })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value} className="text-white">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${role.color}`} />
                            <span>{role.label}</span>
                            <span className="text-slate-500 text-xs">- {role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)} 
                  className="border-slate-700"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAdmin} 
                  disabled={isCreating}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Admin
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalCount}</p>
                  <p className="text-xs text-slate-400">Total Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {STAFF_ROLES.map((role) => {
            const count = staffAccounts.filter(s => s.staff_role === role.value).length;
            return (
              <Card key={role.value} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center`}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-xs text-slate-400">{role.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by email or name..."
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Roles</SelectItem>
              {STAFF_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value} className="text-white">
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadStaffAccounts} className="border-slate-700" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Staff Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Admin</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Last Login</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell colSpan={6}>
                        <div className="h-12 bg-slate-700/30 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : staffAccounts.length === 0 ? (
                  <TableRow className="border-slate-700">
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No admin accounts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  staffAccounts.map((staff) => (
                    <TableRow key={staff.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {staff.display_name?.[0]?.toUpperCase() || staff.email?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{staff.display_name || 'No Name'}</p>
                            <p className="text-sm text-slate-400">{staff.email || 'No Email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(staff.staff_role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={staff.is_active ?? false}
                            onCheckedChange={() => handleToggleActive(staff)}
                          />
                          <span className={staff.is_active ? 'text-green-400' : 'text-red-400'}>
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {staff.last_login_at 
                          ? format(new Date(staff.last_login_at), 'MMM d, HH:mm')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {staff.created_at 
                          ? format(new Date(staff.created_at), 'MMM d, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              className="text-white hover:bg-slate-700 cursor-pointer"
                              onClick={() => {
                                setEditingStaff(staff);
                                setEditRole(staff.staff_role);
                                setEditName(staff.display_name || '');
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                              onClick={() => setDeleteConfirm(staff)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Admin Account</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update role and display name for {editingStaff?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Display Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as StaffRole)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="text-white">
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingStaff(null)} 
                className="border-slate-700"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStaff} 
                className="bg-amber-500 hover:bg-amber-600"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Delete Admin Account
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm?.email}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700" disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </NewAdminShell>
  );
};

export default SuperAdminPage;
