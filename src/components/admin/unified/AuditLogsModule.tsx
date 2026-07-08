import { useState, useEffect, useCallback } from 'react';
import {
  FileText, RefreshCw, Search, Filter, Download, Calendar,
  User, Shield, Settings, Wallet, Users, Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  staff_id: string | null;
  action: string;
  module: string | null;
  target_type: string | null;
  target_id: string | null;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  staff?: {
    display_name: string;
    email: string;
    staff_role: string;
  };
}

const ACTION_ICONS: Record<string, any> = {
  settings_updated: Settings,
  withdraw_approve: Wallet,
  withdraw_reject: Wallet,
  agent_approve: Users,
  agent_reject: Users,
  agent_freeze: Users,
  staff_create: Shield,
  staff_update: Shield,
  user_freeze: User,
  game_settings: Gamepad2,
};

const ACTION_COLORS: Record<string, string> = {
  settings_updated: 'bg-blue-500/20 text-blue-400',
  withdraw_approve: 'bg-green-500/20 text-green-400',
  withdraw_reject: 'bg-red-500/20 text-red-400',
  agent_approve: 'bg-green-500/20 text-green-400',
  agent_reject: 'bg-red-500/20 text-red-400',
  agent_freeze: 'bg-yellow-500/20 text-yellow-400',
  staff_create: 'bg-purple-500/20 text-purple-400',
  staff_update: 'bg-purple-500/20 text-purple-400',
  user_freeze: 'bg-orange-500/20 text-orange-400',
  game_settings: 'bg-cyan-500/20 text-cyan-400',
};

export const AuditLogsModule = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('staff_audit_logs')
        .select(`
          *,
          staff:staff_accounts(display_name, email, staff_role)
        `)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (moduleFilter !== 'all') {
        query = query.eq('module', moduleFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [moduleFilter]);
  
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.module?.toLowerCase().includes(query) ||
      log.staff?.display_name?.toLowerCase().includes(query) ||
      log.target_id?.toLowerCase().includes(query)
    );
  });
  
  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Module', 'Staff', 'Target', 'IP Address'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.module || '-',
        log.staff?.display_name || 'System',
        log.target_id || '-',
        log.ip_address || '-',
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };
  
  const modules = ['all', 'finance', 'withdrawals', 'agents', 'users', 'games', 'staff', 'settings'];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-400" />
            Audit Logs
          </h1>
          <p className="text-gray-400">Track all admin actions and changes</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLogs} className="border-gray-700 text-gray-400">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadLogs} className="border-gray-700 text-gray-400">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Total Logs</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Today's Actions</p>
            <p className="text-2xl font-bold text-blue-400">
              {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Unique Staff</p>
            <p className="text-2xl font-bold text-purple-400">
              {new Set(logs.filter(l => l.staff_id).map(l => l.staff_id)).size}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Withdrawals Processed</p>
            <p className="text-2xl font-bold text-green-400">
              {logs.filter(l => l.action.startsWith('withdraw_')).length}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search actions, modules, staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {modules.map(m => (
              <SelectItem key={m} value={m}>
                {m === 'all' ? 'All Modules' : m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Logs Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Activity Log</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredLogs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Timestamp</TableHead>
                  <TableHead className="text-gray-400">Action</TableHead>
                  <TableHead className="text-gray-400">Module</TableHead>
                  <TableHead className="text-gray-400">Staff</TableHead>
                  <TableHead className="text-gray-400">Target</TableHead>
                  <TableHead className="text-gray-400">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = ACTION_ICONS[log.action] || FileText;
                  const actionColor = ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400';
                  
                  return (
                    <TableRow key={log.id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="text-gray-400 text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${actionColor} flex items-center gap-1 w-fit`}>
                          <ActionIcon className="h-3 w-3" />
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-300">
                          {log.module || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-sm">{log.staff?.display_name || 'System'}</p>
                          <p className="text-xs text-gray-500">{log.staff?.staff_role || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm font-mono">
                        {log.target_id?.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-gray-400"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Timestamp</p>
                  <p className="text-white">{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Action</p>
                  <Badge className={ACTION_COLORS[selectedLog.action] || 'bg-gray-500/20 text-gray-400'}>
                    {selectedLog.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Staff</p>
                  <p className="text-white">{selectedLog.staff?.display_name || 'System'}</p>
                  <p className="text-xs text-gray-400">{selectedLog.staff?.email}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">IP Address</p>
                  <p className="text-white font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.old_value && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Previous Value</p>
                  <pre className="text-xs text-gray-400 overflow-x-auto max-h-32">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.new_value && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">New Value</p>
                  <pre className="text-xs text-gray-400 overflow-x-auto max-h-32">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">User Agent</p>
                  <p className="text-xs text-gray-400 break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
