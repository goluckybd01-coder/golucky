import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Loader2, Users, TrendingUp, Calendar, Activity } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface RetentionData {
  date: string;
  displayDate: string;
  dailyActive: number;
  weeklyActive: number;
  newUsers: number;
}

interface UserRetentionChartProps {
  className?: string;
}

export function UserRetentionChart({ className }: UserRetentionChartProps) {
  const [data, setData] = useState<RetentionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    loadRetentionData();
  }, [days]);

  const loadRetentionData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const { data: activityData, error: activityError } = await supabase
        .from('player_activity')
        .select('user_id, activity_date, games_played')
        .gte('activity_date', format(startDate, 'yyyy-MM-dd'))
        .lte('activity_date', format(endDate, 'yyyy-MM-dd'));

      if (activityError) throw activityError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (profilesError) throw profilesError;

      const dateMap = new Map<string, { dailyActive: Set<string>; newUsers: number }>();
      
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(endDate, days - i), 'yyyy-MM-dd');
        dateMap.set(date, { dailyActive: new Set(), newUsers: 0 });
      }

      activityData?.forEach((activity) => {
        const dateEntry = dateMap.get(activity.activity_date);
        if (dateEntry) {
          dateEntry.dailyActive.add(activity.user_id);
        }
      });

      profilesData?.forEach((profile) => {
        const date = format(new Date(profile.created_at), 'yyyy-MM-dd');
        const dateEntry = dateMap.get(date);
        if (dateEntry) {
          dateEntry.newUsers++;
        }
      });

      const chartData: RetentionData[] = [];
      const sortedDates = Array.from(dateMap.keys()).sort();

      sortedDates.forEach((date, index) => {
        const weeklyActiveSet = new Set<string>();
        
        for (let i = Math.max(0, index - 6); i <= index; i++) {
          const lookbackDate = sortedDates[i];
          const entry = dateMap.get(lookbackDate);
          if (entry) {
            entry.dailyActive.forEach(userId => weeklyActiveSet.add(userId));
          }
        }

        const entry = dateMap.get(date)!;
        chartData.push({
          date,
          displayDate: format(new Date(date), 'MMM dd'),
          dailyActive: entry.dailyActive.size,
          weeklyActive: weeklyActiveSet.size,
          newUsers: entry.newUsers,
        });
      });

      setData(chartData);
    } catch (error) {
      console.error('Error loading retention data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDAU = data.length > 0 ? data[data.length - 1]?.dailyActive || 0 : 0;
  const totalWAU = data.length > 0 ? data[data.length - 1]?.weeklyActive || 0 : 0;
  const avgDAU = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.dailyActive, 0) / data.length) : 0;
  const totalNewUsers = data.reduce((sum, d) => sum + d.newUsers, 0);
  const retentionRate = totalWAU > 0 ? Math.round((totalDAU / totalWAU) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            User Retention & Activity
          </CardTitle>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  days === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold text-blue-400">{totalDAU}</p>
            <p className="text-xs text-muted-foreground">Today's DAU</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
            <p className="text-lg font-bold text-emerald-400">{totalWAU}</p>
            <p className="text-xs text-muted-foreground">WAU (7d)</p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-400" />
            <p className="text-lg font-bold text-purple-400">{avgDAU}</p>
            <p className="text-xs text-muted-foreground">Avg DAU</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-amber-400" />
            <p className="text-lg font-bold text-amber-400">{totalNewUsers}</p>
            <p className="text-xs text-muted-foreground">New Users</p>
          </div>
          <div className="bg-cyan-500/10 rounded-lg p-3 text-center">
            <Activity className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
            <p className="text-lg font-bold text-cyan-400">{retentionRate}%</p>
            <p className="text-xs text-muted-foreground">DAU/WAU</p>
          </div>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWAU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="weeklyActive"
                name="Weekly Active (WAU)"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorWAU)"
              />
              <Area
                type="monotone"
                dataKey="dailyActive"
                name="Daily Active (DAU)"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorDAU)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground mb-2">New User Registrations</p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="newUsers" name="New Users" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
