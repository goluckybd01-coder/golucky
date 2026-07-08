import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import GameAdminSidebar from '@/components/game-admin/GameAdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Search,
  Download,
  FileText,
  Settings,
  Zap,
  Eye,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLog {
  id: string;
  action: string;
  admin_id: string;
  game_type?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

type LogSource = 'game_admin' | 'crash' | 'mines';

const ACTION_ICONS: Record<string, React.ElementType> = {
  update_settings: Settings,
  force_result: Zap,
  view: Eye,
  default: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  update_settings: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  force_result: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  view: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  default: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const GameAdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [logSource, setLogSource] = useState<LogSource>('game_admin');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminName, setAdminName] = useState('Game Admin');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: AuditLog[] = [];

      if (logSource === 'game_admin') {
        let query = supabase
          .from('game_admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (gameFilter !== 'all') {
          query = query.eq('game_type', gameFilter);
        }

        const { data: gameData, error } = await query;
        if (error) throw error;
        data = (gameData as AuditLog[]) || [];
      } else if (logSource === 'crash') {
        const { data: crashData, error } = await supabase
          .from('admin_crash_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        data = (crashData as AuditLog[]) || [];
      } else if (logSource === 'mines') {
        const { data: minesData, error } = await supabase
          .from('mines_admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;
        data = (minesData as AuditLog[]) || [];
      }

      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [logSource, gameFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const fetchAdminName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        if (profile?.username) {
          setAdminName(profile.username);
        }
      }
    };
    fetchAdminName();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.game_type?.toLowerCase().includes(query) ||
      log.admin_id.toLowerCase().includes(query)
    );
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Game Type', 'Admin ID', 'IP Address'],
      ...filteredLogs.map((log) => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.game_type || '-',
        log.admin_id,
        log.ip_address || '-',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-admin-audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || ACTION_ICONS.default;
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || ACTION_COLORS.default;
  };

  const stats = {
    total: logs.length,
    settingsChanges: logs.filter((l) => l.action.includes('settings')).length,
    forceResults: logs.filter((l) => l.action.includes('force')).length,
    today: logs.filter(
      (l) =>
        new Date(l.created_at).toDateString() === new Date().toDateString()
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <GameAdminSidebar adminName={adminName} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
              <p className="text-gray-400">
                Track all admin actions and changes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                className="border-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={isLoading}
                className="border-white/20"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Logs</p>
                    <p className="text-xl font-bold text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Settings className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Settings Changes</p>
                    <p className="text-xl font-bold text-white">
                      {stats.settingsChanges}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Force Results</p>
                    <p className="text-xl font-bold text-white">
                      {stats.forceResults}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Today</p>
                    <p className="text-xl font-bold text-white">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-white/10"
                    />
                  </div>
                </div>

                <Select value={logSource} onValueChange={(v) => setLogSource(v as LogSource)}>
                  <SelectTrigger className="w-[180px] bg-gray-800/50 border-white/10">
                    <SelectValue placeholder="Log Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="game_admin">Game Admin Logs</SelectItem>
                    <SelectItem value="crash">Crash Game Logs</SelectItem>
                    <SelectItem value="mines">Mines Game Logs</SelectItem>
                  </SelectContent>
                </Select>

                {logSource === 'game_admin' && (
                  <Select value={gameFilter} onValueChange={setGameFilter}>
                    <SelectTrigger className="w-[150px] bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Game Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Games</SelectItem>
                      <SelectItem value="wingo">WinGo</SelectItem>
                      <SelectItem value="k3">K3</SelectItem>
                      <SelectItem value="5d">5D</SelectItem>
                      <SelectItem value="crash">Crash</SelectItem>
                      <SelectItem value="mines">Mines</SelectItem>
                      <SelectItem value="aviator">Aviator</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activity Log
                <Badge variant="secondary" className="ml-2">
                  {filteredLogs.length} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-400">Timestamp</TableHead>
                        <TableHead className="text-gray-400">Action</TableHead>
                        <TableHead className="text-gray-400">Game</TableHead>
                        <TableHead className="text-gray-400">Admin</TableHead>
                        <TableHead className="text-gray-400">IP Address</TableHead>
                        <TableHead className="text-gray-400 text-right">
                          Details
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <TableCell className="text-gray-300">
                            {format(
                              new Date(log.created_at),
                              'MMM dd, HH:mm:ss'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getActionColor(log.action)} flex items-center gap-1 w-fit`}
                            >
                              {getActionIcon(log.action)}
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {log.game_type || '-'}
                          </TableCell>
                          <TableCell className="text-gray-400 font-mono text-xs">
                            {log.admin_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {log.ip_address || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Timestamp</p>
                  <p className="text-white">
                    {format(
                      new Date(selectedLog.created_at),
                      'MMM dd, yyyy HH:mm:ss'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Action</p>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Game Type</p>
                  <p className="text-white">{selectedLog.game_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Admin ID</p>
                  <p className="text-white font-mono text-sm">
                    {selectedLog.admin_id}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-400">IP Address</p>
                  <p className="text-white">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>

              {selectedLog.old_value && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Previous Value</p>
                  <pre className="bg-gray-800/50 p-3 rounded-lg text-xs text-gray-300 overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">New Value</p>
                  <pre className="bg-gray-800/50 p-3 rounded-lg text-xs text-green-300 overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameAdminAuditLogs;
