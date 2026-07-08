import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Play, RefreshCw, CheckCircle, XCircle,
  Loader2, Calendar, Timer, AlertCircle, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface JobLog {
  id: string;
  job_name: string;
  executed_at: string;
  status: string;
  result: any;
  error_message: string | null;
}

interface ScheduledJobMonitorProps {
  className?: string;
}

export function ScheduledJobMonitor({ className }: ScheduledJobMonitorProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any>(null);

  // CRON schedule info
  const cronSchedule = '5 0 1 * *'; // At 00:05 on the 1st of every month
  const nextRun = getNextCronRun();

  function getNextCronRun(): Date {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Check if we've passed the 1st of this month
    const thisMonthRun = new Date(year, month, 1, 0, 5, 0);
    if (now < thisMonthRun) {
      return thisMonthRun;
    }
    
    // Next month's 1st at 00:05 UTC
    return new Date(year, month + 1, 1, 0, 5, 0);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_job_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as JobLog[]);
    } catch (error) {
      console.error('Error loading job logs:', error);
      toast.error('Failed to load job logs');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualRun = async (dryRun: boolean = false) => {
    setTriggering(true);
    setTriggerResult(null);

    try {
      const response = await supabase.functions.invoke('calculate-agent-salaries', {
        body: { dry_run: dryRun },
      });

      if (response.error) throw response.error;

      setTriggerResult(response.data);

      if (!dryRun) {
        // Log the manual trigger
        await supabase
          .from('scheduled_job_logs')
          .insert({
            job_name: 'monthly-salary-calculation',
            status: 'manual_trigger',
            result: response.data,
          });

        toast.success(`Created ${response.data?.summary?.created || 0} salary records`);
        loadLogs();
      } else {
        toast.info(`Preview: Would create ${response.data?.summary?.created || 0} records`);
      }
    } catch (error: any) {
      console.error('Error triggering job:', error);
      toast.error(error.message || 'Failed to trigger job');
      setTriggerResult({ error: error.message });
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle }> = {
      triggered: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Play },
      manual_trigger: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Timer },
      success: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      error: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    };

    const conf = config[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock };
    const Icon = conf.icon;

    return (
      <Badge className={`${conf.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const lastRun = logs.length > 0 ? logs[0] : null;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Next Scheduled Run */}
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Scheduled Run</p>
                <p className="font-semibold text-foreground">
                  {format(nextRun, 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(nextRun, { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Run */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Execution</p>
                {lastRun ? (
                  <>
                    <p className="font-semibold text-foreground">
                      {format(new Date(lastRun.executed_at), 'MMM d, HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastRun.executed_at), { addSuffix: true })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No executions yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Trigger */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Timer className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CRON Schedule</p>
                  <p className="font-mono text-sm text-foreground">{cronSchedule}</p>
                  <p className="text-xs text-muted-foreground">1st of month, 00:05 UTC</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setShowTriggerModal(true)}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manually trigger salary calculation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Execution History
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No job executions recorded yet</p>
              <p className="text-sm mt-1">The first run will occur on the 1st of next month</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Job Name</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {logs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b last:border-0"
                      >
                        <TableCell className="font-mono text-sm">
                          {log.job_name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {format(new Date(log.executed_at), 'MMM d, yyyy HH:mm:ss')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <span className="text-red-400 text-sm">{log.error_message}</span>
                          ) : log.result ? (
                            <span className="text-sm text-muted-foreground">
                              {log.result.summary?.created || 0} created, {log.result.summary?.skipped || 0} skipped
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Trigger Modal */}
      <Dialog open={showTriggerModal} onOpenChange={setShowTriggerModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-amber-400" />
              Manual Salary Calculation
            </DialogTitle>
            <DialogDescription>
              Trigger the monthly salary calculation manually. This will create pending salary claims for all eligible agents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400">Important</p>
                <p className="text-muted-foreground">
                  This will calculate salaries for the previous month. Agents who already have a salary record for that month will be skipped.
                </p>
              </div>
            </div>

            {triggerResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/50 border"
              >
                <h4 className="font-medium mb-2">Result</h4>
                {triggerResult.error ? (
                  <p className="text-red-400">{triggerResult.error}</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Eligible Agents:</span>{' '}
                      <span className="font-medium">{triggerResult.summary?.eligible || 0}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Records Created:</span>{' '}
                      <span className="font-medium text-green-400">{triggerResult.summary?.created || 0}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Skipped (existing):</span>{' '}
                      <span className="font-medium">{triggerResult.summary?.skipped || 0}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Salary Month:</span>{' '}
                      <span className="font-medium">{triggerResult.month || 'N/A'}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => triggerManualRun(true)}
              disabled={triggering}
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Preview
            </Button>
            <Button
              onClick={() => triggerManualRun(false)}
              disabled={triggering}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Run Calculation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
