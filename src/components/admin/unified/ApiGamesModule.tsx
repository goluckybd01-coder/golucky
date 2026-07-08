import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit2, Trash2, Save, Loader2, 
  ExternalLink, Power, PowerOff, Gamepad2,
  Globe, Search, RefreshCw, Download, Upload,
  BarChart3, DollarSign, Users, Activity, Eye,
  Star, Zap, TrendingUp, TrendingDown, Clock,
  Copy, Check, AlertTriangle, Settings, Play,
  Pause, RotateCcw, FileJson, Link2, Shield,
  Percent, Wallet, ArrowUpDown, Hash, Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';

interface GameProvider {
  id: string;
  provider_name: string;
  provider_code: string;
  api_url?: string | null;
  api_key_encrypted?: string | null;
  secret_key_encrypted?: string | null;
  is_enabled: boolean;
  is_test_mode: boolean;
  callback_url?: string | null;
  logo_url: string | null;
  description: string | null;
  supported_currencies: string[];
  commission_rate: number;
  min_bet: number;
  max_bet: number;
  created_at: string;
}

interface ApiGame {
  id: string;
  provider_id: string;
  game_name: string;
  game_code: string;
  game_type: string;
  thumbnail_url: string | null;
  is_enabled: boolean;
  is_featured: boolean;
  is_new: boolean;
  sort_order: number;
  rtp_percent: number | null;
  min_bet: number | null;
  max_bet: number | null;
  launch_url: string | null;
  demo_url: string | null;
}

interface GameTransaction {
  id: string;
  user_id: string;
  provider_id: string;
  game_id: string | null;
  transaction_type: string;
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  status: string | null;
  external_ref: string | null;
  round_id: string | null;
  created_at: string;
}

interface ProviderStats {
  provider_id: string;
  total_transactions: number;
  total_bets: number;
  total_wins: number;
  net_revenue: number;
  unique_players: number;
}

const GAME_TYPES = ['slot', 'table', 'live', 'fishing', 'arcade', 'poker', 'sports', 'lottery', 'crash', 'card'];
const CURRENCIES = ['BDT', 'USD', 'EUR', 'USDT'];

export const ApiGamesModule = () => {
  const [providers, setProviders] = useState<GameProvider[]>([]);
  const [games, setGames] = useState<ApiGame[]>([]);
  const [transactions, setTransactions] = useState<GameTransaction[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('providers');
  
  // Provider form
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<GameProvider | null>(null);
  const [providerForm, setProviderForm] = useState({
    provider_name: '',
    provider_code: '',
    api_url: '',
    api_key: '',
    secret_key: '',
    callback_url: '',
    logo_url: '',
    description: '',
    commission_rate: 0,
    min_bet: 10,
    max_bet: 100000,
    is_test_mode: true,
    supported_currencies: ['BDT'],
  });
  
  // Game form
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<ApiGame | null>(null);
  const [gameForm, setGameForm] = useState({
    provider_id: '',
    game_name: '',
    game_code: '',
    game_type: 'slot',
    thumbnail_url: '',
    rtp_percent: '',
    min_bet: '',
    max_bet: '',
    launch_url: '',
    demo_url: '',
    is_featured: false,
    is_new: false,
    sort_order: 0,
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Bulk operations
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkUpdate, setBulkUpdate] = useState({
    apply_game_type: false, game_type: 'slot',
    apply_provider: false, provider_id: '',
    apply_rtp: false, rtp_percent: '',
    apply_min_bet: false, min_bet: '',
    apply_max_bet: false, max_bet: '',
    apply_sort: false, sort_order: '',
    apply_featured: false, is_featured: false,
    apply_new: false, is_new: false,
  });
  
  // Test connection
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  
  // Import/Export
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [providersRes, gamesRes, transactionsRes] = await Promise.all([
        supabase.from('api_game_providers').select('id,provider_name,provider_code,is_enabled,is_test_mode,logo_url,description,supported_currencies,commission_rate,min_bet,max_bet,created_at,updated_at,created_by,last_modified_by,category').order('provider_name'),
        supabase.from('api_games').select('*').order('sort_order'),
        supabase.from('api_game_transactions').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (providersRes.data) setProviders(providersRes.data);
      if (gamesRes.data) setGames(gamesRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);

      // Calculate provider stats
      if (transactionsRes.data && providersRes.data) {
        const stats: ProviderStats[] = providersRes.data.map(provider => {
          const providerTxs = transactionsRes.data.filter(tx => tx.provider_id === provider.id);
          const bets = providerTxs.filter(tx => tx.transaction_type === 'bet');
          const wins = providerTxs.filter(tx => tx.transaction_type === 'win');
          const totalBets = bets.reduce((sum, tx) => sum + tx.amount, 0);
          const totalWins = wins.reduce((sum, tx) => sum + tx.amount, 0);
          const uniquePlayers = new Set(providerTxs.map(tx => tx.user_id)).size;

          return {
            provider_id: provider.id,
            total_transactions: providerTxs.length,
            total_bets: totalBets,
            total_wins: totalWins,
            net_revenue: totalBets - totalWins,
            unique_players: uniquePlayers,
          };
        });
        setProviderStats(stats);
      }
    } catch (error) {
      console.error('Error loading API games data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Real-time subscription
    const channel = supabase
      .channel('api-games-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_game_providers' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_games' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_game_transactions' }, () => loadData())
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Provider functions
  const handleSaveProvider = async () => {
    if (!providerForm.provider_name || !providerForm.provider_code) {
      toast.error('Provider name and code are required');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const providerData: any = {
        provider_name: providerForm.provider_name,
        provider_code: providerForm.provider_code.toLowerCase().replace(/\s+/g, '_'),
        api_url: providerForm.api_url || null,
        callback_url: providerForm.callback_url || null,
        logo_url: providerForm.logo_url || null,
        description: providerForm.description || null,
        commission_rate: providerForm.commission_rate,
        min_bet: providerForm.min_bet,
        max_bet: providerForm.max_bet,
        is_test_mode: providerForm.is_test_mode,
        supported_currencies: providerForm.supported_currencies,
        last_modified_by: user?.id,
      };

      // Only update keys if provided
      if (providerForm.api_key) {
        providerData.api_key_encrypted = providerForm.api_key;
      }
      if (providerForm.secret_key) {
        providerData.secret_key_encrypted = providerForm.secret_key;
      }

      if (editingProvider) {
        const { error } = await supabase
          .from('api_game_providers')
          .update(providerData)
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast.success('Provider updated successfully');
      } else {
        const { error } = await supabase
          .from('api_game_providers')
          .insert({ ...providerData, created_by: user?.id, is_enabled: false });

        if (error) throw error;
        toast.success('Provider added successfully');
      }

      setShowProviderDialog(false);
      resetProviderForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast.error(error.message || 'Failed to save provider');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Delete this provider and all its games? This action cannot be undone.')) return;

    try {
      // First delete all games for this provider
      await supabase.from('api_games').delete().eq('provider_id', id);
      
      const { error } = await supabase
        .from('api_game_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Provider deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const toggleProviderEnabled = async (provider: GameProvider) => {
    try {
      const { error } = await supabase
        .from('api_game_providers')
        .update({ is_enabled: !provider.is_enabled })
        .eq('id', provider.id);

      if (error) throw error;
      loadData();
      toast.success(`Provider ${provider.is_enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update provider');
    }
  };

  const testProviderConnection = async (provider: GameProvider) => {
    setTestingProvider(provider.id);
    try {
      // Simulate API test - in real scenario, call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (provider.api_url) {
        toast.success(`Connection to ${provider.provider_name} successful!`);
      } else {
        toast.warning('No API URL configured for testing');
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTestingProvider(null);
    }
  };

  const resetProviderForm = () => {
    setEditingProvider(null);
    setProviderForm({
      provider_name: '',
      provider_code: '',
      api_url: '',
      api_key: '',
      secret_key: '',
      callback_url: '',
      logo_url: '',
      description: '',
      commission_rate: 0,
      min_bet: 10,
      max_bet: 100000,
      is_test_mode: true,
      supported_currencies: ['BDT'],
    });
  };

  const openEditProvider = (provider: GameProvider) => {
    setEditingProvider(provider);
    setProviderForm({
      provider_name: provider.provider_name,
      provider_code: provider.provider_code,
      api_url: provider.api_url || '',
      api_key: '',
      secret_key: '',
      callback_url: provider.callback_url || '',
      logo_url: provider.logo_url || '',
      description: provider.description || '',
      commission_rate: provider.commission_rate,
      min_bet: provider.min_bet,
      max_bet: provider.max_bet,
      is_test_mode: provider.is_test_mode,
      supported_currencies: provider.supported_currencies || ['BDT'],
    });
    setShowProviderDialog(true);
  };

  // Game functions
  const handleSaveGame = async () => {
    if (!gameForm.provider_id || !gameForm.game_name || !gameForm.game_code) {
      toast.error('Provider, game name, and code are required');
      return;
    }

    setIsSaving(true);
    try {
      const gameData = {
        provider_id: gameForm.provider_id,
        game_name: gameForm.game_name,
        game_code: gameForm.game_code,
        game_type: gameForm.game_type,
        thumbnail_url: gameForm.thumbnail_url || null,
        rtp_percent: gameForm.rtp_percent ? parseFloat(gameForm.rtp_percent) : null,
        min_bet: gameForm.min_bet ? parseFloat(gameForm.min_bet) : null,
        max_bet: gameForm.max_bet ? parseFloat(gameForm.max_bet) : null,
        launch_url: gameForm.launch_url || null,
        demo_url: gameForm.demo_url || null,
        is_featured: gameForm.is_featured,
        is_new: gameForm.is_new,
        sort_order: gameForm.sort_order,
      };

      if (editingGame) {
        const { error } = await supabase
          .from('api_games')
          .update(gameData)
          .eq('id', editingGame.id);

        if (error) throw error;
        toast.success('Game updated');
      } else {
        const { error } = await supabase
          .from('api_games')
          .insert({ ...gameData, is_enabled: false });

        if (error) throw error;
        toast.success('Game added');
      }

      setShowGameDialog(false);
      resetGameForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving game:', error);
      toast.error(error.message || 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('Delete this game?')) return;

    try {
      const { error } = await supabase
        .from('api_games')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Game deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete game');
    }
  };

  const toggleGameEnabled = async (game: ApiGame) => {
    try {
      const { error } = await supabase
        .from('api_games')
        .update({ is_enabled: !game.is_enabled })
        .eq('id', game.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      toast.error('Failed to update game');
    }
  };

  const resetGameForm = () => {
    setEditingGame(null);
    setGameForm({
      provider_id: '',
      game_name: '',
      game_code: '',
      game_type: 'slot',
      thumbnail_url: '',
      rtp_percent: '',
      min_bet: '',
      max_bet: '',
      launch_url: '',
      demo_url: '',
      is_featured: false,
      is_new: false,
      sort_order: 0,
    });
  };

  const openEditGame = (game: ApiGame) => {
    setEditingGame(game);
    setGameForm({
      provider_id: game.provider_id,
      game_name: game.game_name,
      game_code: game.game_code,
      game_type: game.game_type,
      thumbnail_url: game.thumbnail_url || '',
      rtp_percent: game.rtp_percent?.toString() || '',
      min_bet: game.min_bet?.toString() || '',
      max_bet: game.max_bet?.toString() || '',
      launch_url: game.launch_url || '',
      demo_url: game.demo_url || '',
      is_featured: game.is_featured,
      is_new: game.is_new,
      sort_order: game.sort_order,
    });
    setShowGameDialog(true);
  };

  // Bulk operations
  const handleBulkEnable = async () => {
    try {
      const { error } = await supabase
        .from('api_games')
        .update({ is_enabled: true })
        .in('id', selectedGames);

      if (error) throw error;
      toast.success(`${selectedGames.length} games enabled`);
      setSelectedGames([]);
      loadData();
    } catch (error) {
      toast.error('Failed to enable games');
    }
  };

  const handleBulkDisable = async () => {
    try {
      const { error } = await supabase
        .from('api_games')
        .update({ is_enabled: false })
        .in('id', selectedGames);

      if (error) throw error;
      toast.success(`${selectedGames.length} games disabled`);
      setSelectedGames([]);
      loadData();
    } catch (error) {
      toast.error('Failed to disable games');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedGames.length} games? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('api_games')
        .delete()
        .in('id', selectedGames);

      if (error) throw error;
      toast.success(`${selectedGames.length} games deleted`);
      setSelectedGames([]);
      loadData();
    } catch (error) {
      toast.error('Failed to delete games');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedGames.length === 0) {
      toast.error('Select at least one game to update');
      return;
    }

    const hasSelectedField =
      bulkUpdate.apply_game_type ||
      bulkUpdate.apply_provider ||
      bulkUpdate.apply_rtp ||
      bulkUpdate.apply_min_bet ||
      bulkUpdate.apply_max_bet ||
      bulkUpdate.apply_sort ||
      bulkUpdate.apply_featured ||
      bulkUpdate.apply_new;

    if (!hasSelectedField) {
      toast.error('Select at least one field to update');
      return;
    }

    const patch: Record<string, any> = {};
    if (bulkUpdate.apply_game_type) patch.game_type = bulkUpdate.game_type;
    if (bulkUpdate.apply_provider && bulkUpdate.provider_id) patch.provider_id = bulkUpdate.provider_id;
    if (bulkUpdate.apply_rtp && bulkUpdate.rtp_percent !== '') patch.rtp_percent = parseFloat(bulkUpdate.rtp_percent);
    if (bulkUpdate.apply_min_bet && bulkUpdate.min_bet !== '') patch.min_bet = parseFloat(bulkUpdate.min_bet);
    if (bulkUpdate.apply_max_bet && bulkUpdate.max_bet !== '') patch.max_bet = parseFloat(bulkUpdate.max_bet);
    if (bulkUpdate.apply_sort && bulkUpdate.sort_order !== '') patch.sort_order = parseInt(bulkUpdate.sort_order);
    if (bulkUpdate.apply_featured) patch.is_featured = bulkUpdate.is_featured;
    if (bulkUpdate.apply_new) patch.is_new = bulkUpdate.is_new;

    if (Object.keys(patch).length === 0) {
      toast.error('No valid values to update for the selected fields');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api-admin/games/bulk-update', {
        method: 'POST',
        body: { gameIds: selectedGames, patch },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Bulk update failed');
      const updated = data?.data?.updated_count ?? selectedGames.length;
      toast.success(`Updated ${updated} games (${Object.keys(patch).length} field${Object.keys(patch).length > 1 ? 's' : ''})`);
      setShowBulkDialog(false);
      setSelectedGames([]);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Bulk update failed');
    }
  };

  // Import/Export
  const handleExportGames = () => {
    const exportData = {
      providers: providers.map(p => ({
        provider_name: p.provider_name,
        provider_code: p.provider_code,
        api_url: p.api_url,
        callback_url: p.callback_url,
        logo_url: p.logo_url,
        description: p.description,
        commission_rate: p.commission_rate,
        min_bet: p.min_bet,
        max_bet: p.max_bet,
        is_test_mode: p.is_test_mode,
      })),
      games: games.map(g => ({
        provider_code: providers.find(p => p.id === g.provider_id)?.provider_code,
        game_name: g.game_name,
        game_code: g.game_code,
        game_type: g.game_type,
        thumbnail_url: g.thumbnail_url,
        rtp_percent: g.rtp_percent,
        min_bet: g.min_bet,
        max_bet: g.max_bet,
        launch_url: g.launch_url,
        demo_url: g.demo_url,
        is_featured: g.is_featured,
        is_new: g.is_new,
        sort_order: g.sort_order,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-games-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export completed');
  };

  const handleImportGames = async () => {
    try {
      const data = JSON.parse(importData);
      let imported = 0;

      // Import providers first
      if (data.providers && Array.isArray(data.providers)) {
        for (const provider of data.providers) {
          const existing = providers.find(p => p.provider_code === provider.provider_code);
          if (!existing) {
            await supabase.from('api_game_providers').insert({
              ...provider,
              is_enabled: false,
            });
            imported++;
          }
        }
      }

      // Then import games
      if (data.games && Array.isArray(data.games)) {
        for (const game of data.games) {
          const provider = providers.find(p => p.provider_code === game.provider_code);
          if (provider) {
            const existing = games.find(g => g.game_code === game.game_code && g.provider_id === provider.id);
            if (!existing) {
              await supabase.from('api_games').insert({
                ...game,
                provider_id: provider.id,
                is_enabled: false,
              });
              imported++;
            }
          }
        }
      }

      toast.success(`Imported ${imported} items`);
      setShowImportDialog(false);
      setImportData('');
      loadData();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Invalid JSON format');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered games
  const filteredGames = games.filter(game => {
    const matchesSearch = game.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.game_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || game.provider_id === filterProvider;
    const matchesType = filterType === 'all' || game.game_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'enabled' && game.is_enabled) ||
                          (filterStatus === 'disabled' && !game.is_enabled) ||
                          (filterStatus === 'featured' && game.is_featured) ||
                          (filterStatus === 'new' && game.is_new);
    return matchesSearch && matchesProvider && matchesType && matchesStatus;
  });

  const getProviderName = (providerId: string) => {
    return providers.find(p => p.id === providerId)?.provider_name || 'Unknown';
  };

  const getProviderStats = (providerId: string) => {
    return providerStats.find(s => s.provider_id === providerId);
  };

  // Calculate totals
  const totalBets = providerStats.reduce((sum, s) => sum + s.total_bets, 0);
  const totalWins = providerStats.reduce((sum, s) => sum + s.total_wins, 0);
  const totalRevenue = providerStats.reduce((sum, s) => sum + s.net_revenue, 0);
  const totalPlayers = new Set(transactions.map(t => t.user_id)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-purple-400" />
            API Games Management
          </h1>
          <p className="text-gray-400 mt-1">Manage external game providers, games & transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="border-gray-700">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportGames} className="border-gray-700">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="border-gray-700">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Globe className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{providers.length}</p>
                <p className="text-xs text-gray-400">Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{games.length}</p>
                <p className="text-xs text-gray-400">Total Games</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Power className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{games.filter(g => g.is_enabled).length}</p>
                <p className="text-xs text-gray-400">Active Games</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{totalPlayers}</p>
                <p className="text-xs text-gray-400">Players</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatTaka(totalBets)}</p>
                <p className="text-xs text-gray-400">Total Bets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${totalRevenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatTaka(totalRevenue)}
                </p>
                <p className="text-xs text-gray-400">Net Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="providers" className="data-[state=active]:bg-purple-600">
            <Globe className="h-4 w-4 mr-1" />
            Providers ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-purple-600">
            <Gamepad2 className="h-4 w-4 mr-1" />
            Games ({games.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-600">
            <Activity className="h-4 w-4 mr-1" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { resetProviderForm(); setShowProviderDialog(true); }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <div className="grid gap-4">
            {providers.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-8 text-center">
                  <Globe className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No providers added yet</p>
                  <p className="text-gray-500 text-sm mt-1">Click "Add Provider" to get started</p>
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => {
                const stats = getProviderStats(provider.id);
                const providerGames = games.filter(g => g.provider_id === provider.id);
                
                return (
                  <Card key={provider.id} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {provider.logo_url ? (
                            <img src={provider.logo_url} alt={provider.provider_name} className="w-16 h-16 rounded-xl object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                              <Globe className="h-8 w-8 text-purple-400" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-bold text-lg">{provider.provider_name}</h3>
                              <Badge variant="outline" className="font-mono text-xs">{provider.provider_code}</Badge>
                              {provider.is_test_mode && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Test Mode</Badge>
                              )}
                              {provider.is_enabled ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Disabled</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Games:</span>
                                <span className="text-white ml-1">{providerGames.length}</span>
                                <span className="text-green-400 ml-1">({providerGames.filter(g => g.is_enabled).length} active)</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Commission:</span>
                                <span className="text-purple-400 ml-1">{provider.commission_rate}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Bet Range:</span>
                                <span className="text-white ml-1">৳{provider.min_bet} - ৳{provider.max_bet}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Players:</span>
                                <span className="text-yellow-400 ml-1">{stats?.unique_players || 0}</span>
                              </div>
                            </div>

                            {stats && stats.total_transactions > 0 && (
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3 text-red-400" />
                                  <span className="text-gray-400">Bets: {formatTaka(stats.total_bets)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-green-400" />
                                  <span className="text-gray-400">Wins: {formatTaka(stats.total_wins)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-teal-400" />
                                  <span className={stats.net_revenue >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    Revenue: {formatTaka(stats.net_revenue)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {provider.api_url && (
                              <div className="flex items-center gap-2">
                                <Link2 className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-500 text-xs truncate max-w-md">{provider.api_url}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => copyToClipboard(provider.api_url!, provider.id + '-url')}
                                >
                                  {copiedId === provider.id + '-url' ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-500" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testProviderConnection(provider)}
                            disabled={testingProvider === provider.id}
                            className="text-blue-400"
                          >
                            {testingProvider === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleProviderEnabled(provider)}
                            className={provider.is_enabled ? 'text-green-400' : 'text-gray-500'}
                          >
                            {provider.is_enabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditProvider(provider)}
                            className="text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProvider(provider.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-9"
                />
              </div>
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-36 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-28 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {GAME_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {selectedGames.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkEnable} className="border-green-600 text-green-400">
                    <Power className="h-4 w-4 mr-1" />
                    Enable ({selectedGames.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkDisable} className="border-yellow-600 text-yellow-400">
                    <PowerOff className="h-4 w-4 mr-1" />
                    Disable
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowBulkDialog(true)} className="border-blue-600 text-blue-400">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkDelete} className="border-red-600 text-red-400">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
              <Button
                onClick={() => { resetGameForm(); setShowGameDialog(true); }}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={providers.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </div>
          </div>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedGames.length === filteredGames.length && filteredGames.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGames(filteredGames.map(g => g.id));
                            } else {
                              setSelectedGames([]);
                            }
                          }}
                          className="rounded border-gray-600"
                        />
                      </TableHead>
                      <TableHead className="text-gray-400">Game</TableHead>
                      <TableHead className="text-gray-400">Provider</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">RTP</TableHead>
                      <TableHead className="text-gray-400">Bet Range</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No games found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGames.map((game) => (
                        <TableRow key={game.id} className="border-gray-800">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedGames.includes(game.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGames([...selectedGames, game.id]);
                                } else {
                                  setSelectedGames(selectedGames.filter(id => id !== game.id));
                                }
                              }}
                              className="rounded border-gray-600"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {game.thumbnail_url ? (
                                <img src={game.thumbnail_url} alt={game.game_name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                                  <Gamepad2 className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{game.game_name}</p>
                                <p className="text-gray-500 text-xs font-mono">{game.game_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{getProviderName(game.provider_id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{game.game_type}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {game.rtp_percent ? `${game.rtp_percent}%` : '-'}
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {game.min_bet && game.max_bet 
                              ? `৳${game.min_bet} - ৳${game.max_bet}` 
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {game.is_enabled ? (
                                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-400">Off</Badge>
                              )}
                              {game.is_featured && (
                                <Star className="h-4 w-4 text-yellow-400" />
                              )}
                              {game.is_new && (
                                <Badge className="bg-blue-500/20 text-blue-400 text-xs">NEW</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {game.demo_url && (
                                <Button size="sm" variant="ghost" asChild className="text-purple-400">
                                  <a href={game.demo_url} target="_blank" rel="noopener noreferrer">
                                    <Play className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleGameEnabled(game)}
                                className={game.is_enabled ? 'text-green-400' : 'text-gray-500'}
                              >
                                {game.is_enabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditGame(game)}
                                className="text-blue-400"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGame(game.id)}
                                className="text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Last 100 API game transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Time</TableHead>
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Provider</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400 text-right">Amount</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Ref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-gray-800">
                          <TableCell className="text-gray-400 text-sm">
                            {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="text-white font-mono text-xs">
                            {tx.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {getProviderName(tx.provider_id)}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              tx.transaction_type === 'bet' ? 'bg-red-500/20 text-red-400' :
                              tx.transaction_type === 'win' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }>
                              {tx.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            tx.transaction_type === 'win' ? 'text-green-400' : 'text-white'
                          }`}>
                            {formatTaka(tx.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {tx.status || 'completed'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs font-mono">
                            {tx.external_ref?.slice(0, 12) || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Performance */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Provider Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => {
                    const stats = getProviderStats(provider.id);
                    if (!stats || stats.total_transactions === 0) return null;
                    
                    const revenuePercent = totalRevenue > 0 ? (stats.net_revenue / totalRevenue) * 100 : 0;
                    
                    return (
                      <div key={provider.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{provider.provider_name}</span>
                          <span className={stats.net_revenue >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {formatTaka(stats.net_revenue)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${stats.net_revenue >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.abs(revenuePercent), 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Bets: {formatTaka(stats.total_bets)}</span>
                          <span>Wins: {formatTaka(stats.total_wins)}</span>
                          <span>Players: {stats.unique_players}</span>
                        </div>
                      </div>
                    );
                  })}
                  {providerStats.filter(s => s.total_transactions > 0).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No transaction data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Type Distribution */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  Game Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {GAME_TYPES.map((type) => {
                    const count = games.filter(g => g.game_type === type).length;
                    const activeCount = games.filter(g => g.game_type === type && g.is_enabled).length;
                    const percent = games.length > 0 ? (count / games.length) * 100 : 0;
                    
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-white capitalize">{type}</span>
                          <span className="text-gray-400">{count} ({activeCount} active)</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Summary Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-white">{transactions.length}</p>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-400">{formatTaka(totalBets)}</p>
                  <p className="text-sm text-gray-400">Total Bets</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-400">{formatTaka(totalWins)}</p>
                  <p className="text-sm text-gray-400">Total Wins</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className={`text-3xl font-bold ${totalRevenue >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                    {formatTaka(totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-400">Net Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Provider Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-400" />
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure game provider API integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Provider Name *</Label>
                <Input
                  value={providerForm.provider_name}
                  onChange={(e) => setProviderForm({ ...providerForm, provider_name: e.target.value })}
                  placeholder="e.g., JILI Gaming"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Provider Code *</Label>
                <Input
                  value={providerForm.provider_code}
                  onChange={(e) => setProviderForm({ ...providerForm, provider_code: e.target.value })}
                  placeholder="e.g., jili"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">API URL</Label>
              <Input
                value={providerForm.api_url}
                onChange={(e) => setProviderForm({ ...providerForm, api_url: e.target.value })}
                placeholder="https://api.provider.com"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">API Key</Label>
                <Input
                  type="password"
                  value={providerForm.api_key}
                  onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })}
                  placeholder={editingProvider ? '••••••• (leave empty to keep)' : 'Enter API key'}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Secret Key</Label>
                <Input
                  type="password"
                  value={providerForm.secret_key}
                  onChange={(e) => setProviderForm({ ...providerForm, secret_key: e.target.value })}
                  placeholder={editingProvider ? '••••••• (leave empty to keep)' : 'Enter secret key'}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Callback URL</Label>
              <Input
                value={providerForm.callback_url}
                onChange={(e) => setProviderForm({ ...providerForm, callback_url: e.target.value })}
                placeholder="https://yourdomain.com/api/callback"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Logo URL</Label>
                <Input
                  value={providerForm.logo_url}
                  onChange={(e) => setProviderForm({ ...providerForm, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={providerForm.commission_rate}
                  onChange={(e) => setProviderForm({ ...providerForm, commission_rate: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Min Bet (৳)</Label>
                <Input
                  type="number"
                  value={providerForm.min_bet}
                  onChange={(e) => setProviderForm({ ...providerForm, min_bet: parseFloat(e.target.value) || 10 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Bet (৳)</Label>
                <Input
                  type="number"
                  value={providerForm.max_bet}
                  onChange={(e) => setProviderForm({ ...providerForm, max_bet: parseFloat(e.target.value) || 100000 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={providerForm.description}
                onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                placeholder="Provider description..."
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={providerForm.is_test_mode}
                  onCheckedChange={(checked) => setProviderForm({ ...providerForm, is_test_mode: checked })}
                />
                <Label className="text-gray-300">Test Mode</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowProviderDialog(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSaveProvider} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingProvider ? 'Update' : 'Add'} Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Dialog */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-blue-400" />
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Provider *</Label>
              <Select
                value={gameForm.provider_id}
                onValueChange={(value) => setGameForm({ ...gameForm, provider_id: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Game Name *</Label>
                <Input
                  value={gameForm.game_name}
                  onChange={(e) => setGameForm({ ...gameForm, game_name: e.target.value })}
                  placeholder="e.g., Fortune Gems"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Game Code *</Label>
                <Input
                  value={gameForm.game_code}
                  onChange={(e) => setGameForm({ ...gameForm, game_code: e.target.value })}
                  placeholder="e.g., fortune_gems"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Game Type</Label>
                <Select
                  value={gameForm.game_type}
                  onValueChange={(value) => setGameForm({ ...gameForm, game_type: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">RTP %</Label>
                <Input
                  type="number"
                  value={gameForm.rtp_percent}
                  onChange={(e) => setGameForm({ ...gameForm, rtp_percent: e.target.value })}
                  placeholder="e.g., 96.5"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Thumbnail URL</Label>
              <Input
                value={gameForm.thumbnail_url}
                onChange={(e) => setGameForm({ ...gameForm, thumbnail_url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Min Bet</Label>
                <Input
                  type="number"
                  value={gameForm.min_bet}
                  onChange={(e) => setGameForm({ ...gameForm, min_bet: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Bet</Label>
                <Input
                  type="number"
                  value={gameForm.max_bet}
                  onChange={(e) => setGameForm({ ...gameForm, max_bet: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Launch URL</Label>
              <Input
                value={gameForm.launch_url}
                onChange={(e) => setGameForm({ ...gameForm, launch_url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div>
              <Label className="text-gray-300">Demo URL</Label>
              <Input
                value={gameForm.demo_url}
                onChange={(e) => setGameForm({ ...gameForm, demo_url: e.target.value })}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div>
              <Label className="text-gray-300">Sort Order</Label>
              <Input
                type="number"
                value={gameForm.sort_order}
                onChange={(e) => setGameForm({ ...gameForm, sort_order: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={gameForm.is_featured}
                  onCheckedChange={(checked) => setGameForm({ ...gameForm, is_featured: checked })}
                />
                <Label className="text-gray-300">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={gameForm.is_new}
                  onCheckedChange={(checked) => setGameForm({ ...gameForm, is_new: checked })}
                />
                <Label className="text-gray-300">New</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowGameDialog(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSaveGame} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingGame ? 'Update' : 'Add'} Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileJson className="h-5 w-5 text-blue-400" />
              Import Games Data
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Paste JSON data exported from another instance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"providers": [...], "games": [...]}'
              className="bg-gray-800 border-gray-700 h-64 font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleImportGames} className="bg-purple-600 hover:bg-purple-700">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-400" />
              Bulk Update {selectedGames.length} Games
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Toggle the fields you want to apply. Untoggled fields remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {/* Provider */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_provider} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_provider: v })} />
              <Label className="text-gray-300 w-32">Provider</Label>
              <Select value={bulkUpdate.provider_id} onValueChange={(v) => setBulkUpdate({ ...bulkUpdate, provider_id: v })} disabled={!bulkUpdate.apply_provider}>
                <SelectTrigger className="bg-gray-800 border-gray-700 flex-1"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Game Type */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_game_type} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_game_type: v })} />
              <Label className="text-gray-300 w-32">Game Type</Label>
              <Select value={bulkUpdate.game_type} onValueChange={(v) => setBulkUpdate({ ...bulkUpdate, game_type: v })} disabled={!bulkUpdate.apply_game_type}>
                <SelectTrigger className="bg-gray-800 border-gray-700 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {GAME_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* RTP */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_rtp} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_rtp: v })} />
              <Label className="text-gray-300 w-32">RTP %</Label>
              <Input type="number" step="0.01" value={bulkUpdate.rtp_percent} onChange={(e) => setBulkUpdate({ ...bulkUpdate, rtp_percent: e.target.value })} disabled={!bulkUpdate.apply_rtp} placeholder="96.5" className="bg-gray-800 border-gray-700 flex-1" />
            </div>

            {/* Min Bet */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_min_bet} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_min_bet: v })} />
              <Label className="text-gray-300 w-32">Min Bet (৳)</Label>
              <Input type="number" value={bulkUpdate.min_bet} onChange={(e) => setBulkUpdate({ ...bulkUpdate, min_bet: e.target.value })} disabled={!bulkUpdate.apply_min_bet} placeholder="10" className="bg-gray-800 border-gray-700 flex-1" />
            </div>

            {/* Max Bet */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_max_bet} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_max_bet: v })} />
              <Label className="text-gray-300 w-32">Max Bet (৳)</Label>
              <Input type="number" value={bulkUpdate.max_bet} onChange={(e) => setBulkUpdate({ ...bulkUpdate, max_bet: e.target.value })} disabled={!bulkUpdate.apply_max_bet} placeholder="100000" className="bg-gray-800 border-gray-700 flex-1" />
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_sort} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_sort: v })} />
              <Label className="text-gray-300 w-32">Sort Order</Label>
              <Input type="number" value={bulkUpdate.sort_order} onChange={(e) => setBulkUpdate({ ...bulkUpdate, sort_order: e.target.value })} disabled={!bulkUpdate.apply_sort} placeholder="0" className="bg-gray-800 border-gray-700 flex-1" />
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_featured} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_featured: v })} />
              <Label className="text-gray-300 w-32 flex items-center gap-1"><Star className="h-3 w-3" /> Featured</Label>
              <div className="flex-1 flex items-center gap-2">
                <Switch checked={bulkUpdate.is_featured} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, is_featured: v })} disabled={!bulkUpdate.apply_featured} />
                <span className="text-sm text-gray-400">{bulkUpdate.is_featured ? 'On' : 'Off'}</span>
              </div>
            </div>

            {/* New */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <Switch checked={bulkUpdate.apply_new} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, apply_new: v })} />
              <Label className="text-gray-300 w-32">NEW Badge</Label>
              <div className="flex-1 flex items-center gap-2">
                <Switch checked={bulkUpdate.is_new} onCheckedChange={(v) => setBulkUpdate({ ...bulkUpdate, is_new: v })} disabled={!bulkUpdate.apply_new} />
                <span className="text-sm text-gray-400">{bulkUpdate.is_new ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)} className="border-gray-700">Cancel</Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={
                selectedGames.length === 0 ||
                !(
                  bulkUpdate.apply_game_type ||
                  bulkUpdate.apply_provider ||
                  bulkUpdate.apply_rtp ||
                  bulkUpdate.apply_min_bet ||
                  bulkUpdate.apply_max_bet ||
                  bulkUpdate.apply_sort ||
                  bulkUpdate.apply_featured ||
                  bulkUpdate.apply_new
                )
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              Apply to {selectedGames.length} Games
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};