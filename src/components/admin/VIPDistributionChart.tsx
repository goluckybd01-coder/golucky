import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface VIPDistributionData {
  level: number;
  name: string;
  count: number;
  percentage: number;
  color: string;
  totalBet: number;
}

interface VIPDistributionChartProps {
  className?: string;
}

const VIP_COLORS: Record<number, { color: string; name: string }> = {
  0: { color: '#6B7280', name: 'VIP 0' },
  1: { color: '#CD7F32', name: 'VIP 1' },
  2: { color: '#C0C0C0', name: 'VIP 2' },
  3: { color: '#FFD700', name: 'VIP 3' },
  4: { color: '#E5E4E2', name: 'VIP 4' },
  5: { color: '#50C878', name: 'VIP 5' },
  6: { color: '#00CED1', name: 'VIP 6' },
  7: { color: '#9370DB', name: 'VIP 7' },
  8: { color: '#FF6B6B', name: 'VIP 8' },
  9: { color: '#FF1493', name: 'VIP 9' },
  10: { color: '#8B0000', name: 'VIP 10' },
};

const VIP_THRESHOLDS = [0, 1000, 5000, 20000, 100000, 500000, 2000000, 10000000, 50000000, 200000000, 1000000000];

const calculateVIPLevel = (totalBet: number): number => {
  for (let i = VIP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalBet >= VIP_THRESHOLDS[i]) return i;
  }
  return 0;
};

export const VIPDistributionChart: React.FC<VIPDistributionChartProps> = ({ className }) => {
  const [chartData, setChartData] = useState<VIPDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [totalUsers, setTotalUsers] = useState(0);
  const [highValueUsers, setHighValueUsers] = useState(0);

  useEffect(() => {
    loadVIPDistribution();
  }, []);

  const loadVIPDistribution = async () => {
    setIsLoading(true);
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('user_id, total_bet');

      if (error) throw error;

      const levelCounts: Record<number, { count: number; totalBet: number }> = {};
      for (let i = 0; i <= 10; i++) {
        levelCounts[i] = { count: 0, totalBet: 0 };
      }

      wallets?.forEach(wallet => {
        const level = calculateVIPLevel(wallet.total_bet || 0);
        levelCounts[level].count++;
        levelCounts[level].totalBet += wallet.total_bet || 0;
      });

      const total = wallets?.length || 0;
      setTotalUsers(total);

      let highValue = 0;
      for (let i = 5; i <= 10; i++) {
        highValue += levelCounts[i].count;
      }
      setHighValueUsers(highValue);

      const data: VIPDistributionData[] = Object.entries(levelCounts)
        .map(([level, stats]) => ({
          level: parseInt(level),
          name: VIP_COLORS[parseInt(level)].name,
          count: stats.count,
          percentage: total > 0 ? (stats.count / total) * 100 : 0,
          color: VIP_COLORS[parseInt(level)].color,
          totalBet: stats.totalBet,
        }))
        .filter(d => d.count > 0);

      setChartData(data);
    } catch (error) {
      console.error('Error loading VIP distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Users: <span className="text-foreground font-medium">{data.count.toLocaleString()}</span>
            </p>
            <p className="text-muted-foreground">
              Percentage: <span className="text-foreground font-medium">{data.percentage.toFixed(1)}%</span>
            </p>
            <p className="text-muted-foreground">
              Total Wagered: <span className="text-foreground font-medium">৳{data.totalBet.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {chartData.map((entry) => (
        <div key={entry.level} className="flex items-center gap-1 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">VIP Level Distribution</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={chartType === 'pie' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('pie')} className="h-8">
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button variant={chartType === 'bar' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('bar')} className="h-8">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" />
              Total Users
            </div>
            <p className="text-xl font-bold">{totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Crown className="h-3 w-3 text-yellow-500" />
              High VIP (5+)
            </div>
            <p className="text-xl font-bold text-yellow-500">{highValueUsers.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              VIP Rate
            </div>
            <p className="text-xl font-bold text-green-500">
              {totalUsers > 0 ? ((highValueUsers / totalUsers) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count" label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`} labelLine={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        {chartType === 'pie' && renderCustomLegend()}
        <div className="mt-4 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Level</th>
                <th className="px-3 py-2 text-right font-medium">Users</th>
                <th className="px-3 py-2 text-right font-medium">%</th>
                <th className="px-3 py-2 text-right font-medium">Total Wagered</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.level} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.percentage.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right">৳{row.totalBet.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
