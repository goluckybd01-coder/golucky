import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Dices, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GameMonitorPanel } from '@/components/admin/game-monitor/GameMonitorPanel';
import { GameType, GAME_CONFIG, StaffRole } from '@/lib/adminPermissions';

interface GameScope {
  game_scope: string;
  can_view: boolean;
  can_edit: boolean;
  can_override: boolean;
}

const GAME_DURATIONS: Record<string, { value: string; label: string }[]> = {
  wingo: [
    { value: '30s', label: '30 Sec' },
    { value: '1m', label: '1 Min' },
    { value: '3m', label: '3 Min' },
    { value: '5m', label: '5 Min' },
  ],
  k3: [
    { value: '1m', label: '1 Min' },
    { value: '3m', label: '3 Min' },
    { value: '5m', label: '5 Min' },
    { value: '10m', label: '10 Min' },
  ],
  '5d': [
    { value: '1m', label: '1 Min' },
    { value: '3m', label: '3 Min' },
    { value: '5m', label: '5 Min' },
    { value: '10m', label: '10 Min' },
  ],
  trxwin: [
    { value: '1m', label: '1 Min' },
    { value: '3m', label: '3 Min' },
    { value: '5m', label: '5 Min' },
  ],
  crash: [{ value: 'live', label: 'Live' }],
  mines: [{ value: 'live', label: 'Live' }],
  aviator: [{ value: 'live', label: 'Live' }],
};

const GAME_ICONS: Record<string, any> = {
  wingo: Target,
  k3: Dices,
  '5d': Trophy,
  trxwin: Zap,
  crash: Zap,
  mines: Dices,
  aviator: Target,
};

export const UnifiedGameAdmin = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [staffRole, setStaffRole] = useState<StaffRole>('game_admin');
  const [gameScopes, setGameScopes] = useState<GameScope[]>([]);
  const [activeDuration, setActiveDuration] = useState('1m');
  const game = (gameType?.toLowerCase() || 'wingo') as GameType;
  const config = GAME_CONFIG[game];
  const GameIcon = GAME_ICONS[game] || Target;
  const durations = GAME_DURATIONS[game] || GAME_DURATIONS.wingo;

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin-login');
        return;
      }
      const { data: staff } = await supabase
        .from('staff_accounts')
        .select('staff_role, is_active')
        .eq('user_id', user.id)
        .single();
      if (!staff?.is_active) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        if (!roles?.length) {
          toast.error('Access denied');
          navigate('/admin-login');
          return;
        }
        setStaffRole(roles[0].role as StaffRole);
      } else {
        setStaffRole(staff.staff_role as StaffRole);
      }
      const { data: scopes } = await supabase
        .from('staff_game_scopes')
        .select('*')
        .eq('staff_id', user.id);
      setGameScopes(scopes || []);
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (durations.length > 0) setActiveDuration(durations[0].value);
  }, [game]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config?.gradient || 'from-gray-500 to-gray-700'} flex items-center justify-center shadow-lg`}>
            <GameIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{config?.label || game} Admin</h1>
            <p className="text-sm text-gray-400">Monitor and manage game settings</p>
          </div>
        </div>
      </div>
      <Tabs value={activeDuration} onValueChange={setActiveDuration} className="w-full">
        <TabsList className="bg-gray-900/50 border border-gray-800 p-1 mb-6">
          {durations.map((d) => (
            <TabsTrigger key={d.value} value={d.value} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white">
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {durations.map((d) => (
          <TabsContent key={d.value} value={d.value}>
            <GameMonitorPanel gameType={game} duration={d.value} staffRole={staffRole} gameScopes={gameScopes} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UnifiedGameAdmin;
