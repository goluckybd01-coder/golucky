import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  X,
  Key,
  Gamepad2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  StaffRole,
  Permission,
  GameType,
  ALL_GAMES,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  ROLE_COLORS,
  GAME_CONFIG,
} from '@/lib/adminPermissions';

interface StaffAccount {
  id: string;
  user_id: string;
  staff_role: StaffRole;
  display_name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface StaffPermission {
  id: string;
  staff_id: string;
  permission: Permission;
}

interface StaffGameScope {
  id: string;
  staff_id: string;
  game_scope: GameType | 'all';
  can_view: boolean;
  can_edit: boolean;
  can_override: boolean;
}

export const StaffManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermission[]>([]);
  const [staffGameScopes, setStaffGameScopes] = useState<StaffGameScope[]>([]);
  
  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    staff_role: 'support' as StaffRole,
    selectedGames: [] as GameType[],
    canEdit: false,
    canOverride: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaffAccounts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('staff_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStaffAccounts(data as StaffAccount[]);
    }
    setIsLoading(false);
  }, []);

  const loadStaffDetails = useCallback(async (staffId: string) => {
    const [permsResult, scopesResult] = await Promise.all([
      supabase.from('staff_permissions').select('*').eq('staff_id', staffId),
      supabase.from('staff_game_scopes').select('*').eq('staff_id', staffId),
    ]);

    if (permsResult.data) {
      setStaffPermissions(permsResult.data as StaffPermission[]);
    }
    if (scopesResult.data) {
      setStaffGameScopes(scopesResult.data as StaffGameScope[]);
    }
  }, []);

  useEffect(() => {
    loadStaffAccounts();
  }, [loadStaffAccounts]);

  useEffect(() => {
    if (selectedStaff) {
      loadStaffDetails(selectedStaff.id);
    }
  }, [selectedStaff, loadStaffDetails]);

  // Real-time subscription for staff updates
  useEffect(() => {
    const channel = supabase
      .channel('staff-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_accounts' },
        () => loadStaffAccounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStaffAccounts]);

  const handleCreateStaff = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, find the user by email
      // Note: In production, you might want to invite the user first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', formData.email) // Using phone as a placeholder - adjust as needed
        .single();

      const targetUserId = profiles?.user_id;
      if (!targetUserId && !isEditing) {
        // For demo purposes, we'll create with a placeholder
        toast.error('User not found. Please enter a valid user email/phone.');
        setIsSubmitting(false);
        return;
      }

      if (isEditing && selectedStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff_accounts')
          .update({
            staff_role: formData.staff_role,
            display_name: formData.display_name,
          })
          .eq('id', selectedStaff.id);

        if (error) throw error;

        // Update game scopes
        await supabase.from('staff_game_scopes').delete().eq('staff_id', selectedStaff.id);
        
        if (formData.selectedGames.length > 0) {
          const scopeInserts = formData.selectedGames.map(game => ({
            staff_id: selectedStaff.id,
            game_scope: game,
            can_view: true,
            can_edit: formData.canEdit,
            can_override: formData.canOverride,
          }));
          await supabase.from('staff_game_scopes').insert(scopeInserts);
        }

        toast.success('Staff account updated successfully');
      } else {
        // Create new staff account
        const { data: newStaff, error: createError } = await supabase
          .from('staff_accounts')
          .insert({
            user_id: targetUserId || user.id, // Fallback to current user for demo
            staff_role: formData.staff_role,
            display_name: formData.display_name,
            email: formData.email,
            is_active: true,
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add default permissions for role
        const defaultPerms = ROLE_DEFAULT_PERMISSIONS[formData.staff_role];
        if (defaultPerms.length > 0) {
          const permInserts = defaultPerms.map(perm => ({
            staff_id: newStaff.id,
            permission: perm,
          }));
          await supabase.from('staff_permissions').insert(permInserts);
        }

        // Add game scopes
        if (formData.selectedGames.length > 0) {
          const scopeInserts = formData.selectedGames.map(game => ({
            staff_id: newStaff.id,
            game_scope: game,
            can_view: true,
            can_edit: formData.canEdit,
            can_override: formData.canOverride,
          }));
          await supabase.from('staff_game_scopes').insert(scopeInserts);
        }

        // Log the action
        await supabase.from('staff_audit_logs').insert({
          staff_id: user.id,
          action: 'CREATE_STAFF',
          target_type: 'staff_account',
          target_id: newStaff.id,
          new_value: { role: formData.staff_role, games: formData.selectedGames },
        });

        toast.success('Staff account created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadStaffAccounts();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.message || 'Failed to create staff account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: StaffAccount) => {
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .update({ is_active: !staff.is_active })
        .eq('id', staff.id);

      if (error) throw error;

      toast.success(`Staff account ${staff.is_active ? 'deactivated' : 'activated'}`);
      loadStaffAccounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      display_name: '',
      staff_role: 'support',
      selectedGames: [],
      canEdit: false,
      canOverride: false,
    });
    setIsEditing(false);
    setSelectedStaff(null);
  };

  const openEditDialog = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setFormData({
      email: staff.email || '',
      display_name: staff.display_name || '',
      staff_role: staff.staff_role,
      selectedGames: [],
      canEdit: false,
      canOverride: false,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-pink-400" />
            Staff & Permissions
          </h1>
          <p className="text-gray-400">Manage admin accounts and access control</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadStaffAccounts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-teal-600 hover:bg-teal-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {isEditing ? 'Edit Staff Account' : 'Create Staff Account'}
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update staff role and permissions' : 'Add a new admin staff member'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!isEditing && (
                  <div>
                    <Label className="text-gray-300">Email / Phone</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-gray-300">Display Name</Label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Admin Name"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Role</Label>
                  <Select
                    value={formData.staff_role}
                    onValueChange={(v) => setFormData({ ...formData, staff_role: v as StaffRole })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <SelectItem key={role} value={role}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.staff_role === 'game_admin' && (
                  <div className="space-y-3">
                    <Label className="text-gray-300">Game Access</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_GAMES.map((game) => (
                        <div
                          key={game}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-800 border border-gray-700"
                        >
                          <Checkbox
                            id={game}
                            checked={formData.selectedGames.includes(game)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  selectedGames: [...formData.selectedGames, game],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedGames: formData.selectedGames.filter(g => g !== game),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={game} className={cn('text-sm', GAME_CONFIG[game]?.color)}>
                            {GAME_CONFIG[game]?.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="canEdit"
                          checked={formData.canEdit}
                          onCheckedChange={(c) => setFormData({ ...formData, canEdit: !!c })}
                        />
                        <Label htmlFor="canEdit" className="text-sm text-green-400">Can Edit</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="canOverride"
                          checked={formData.canOverride}
                          onCheckedChange={(c) => setFormData({ ...formData, canOverride: !!c })}
                        />
                        <Label htmlFor="canOverride" className="text-sm text-red-400">Can Override</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStaff}
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Total Staff</p>
            <p className="text-2xl font-bold text-white">{staffAccounts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {staffAccounts.filter(s => s.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Super Admins</p>
            <p className="text-2xl font-bold text-red-400">
              {staffAccounts.filter(s => s.staff_role === 'super_admin').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Game Admins</p>
            <p className="text-2xl font-bold text-purple-400">
              {staffAccounts.filter(s => s.staff_role === 'game_admin').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Staff Accounts</CardTitle>
          <CardDescription>All admin users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                  <TableHead className="text-gray-400">Last Login</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffAccounts.map((staff) => {
                  const roleColors = ROLE_COLORS[staff.staff_role];
                  return (
                    <TableRow key={staff.id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                            {(staff.display_name || staff.email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-white font-medium">
                            {staff.display_name || 'Unnamed'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">{staff.email || '-'}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', roleColors.bg, roleColors.text, roleColors.border)}>
                          {ROLE_LABELS[staff.staff_role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          staff.is_active
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        )}>
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {format(new Date(staff.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {staff.last_login_at
                          ? format(new Date(staff.last_login_at), 'MMM dd, HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(staff)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(staff)}
                            className={staff.is_active ? 'text-red-400' : 'text-green-400'}
                          >
                            {staff.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
