import { useEffect, useState, useCallback } from 'react';
import { Plus, Save, Trash2, RefreshCw, Loader2, Target, Dices, Trophy, Zap, Rocket, Bomb, Plane, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_CONFIG, GameType } from '@/lib/adminPermissions';

const ICONS: Record<string, any> = { Target, Dices, Trophy, Zap, Rocket, Bomb, Plane };

interface GameRow {
  id: string;
  game_type: string;
  is_enabled: boolean;
  maintenance_mode: boolean;
  min_bet: number;
  max_bet: number;
  house_edge_percent: number;
}

interface SportRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_enabled: boolean;
}

interface ApiGameRow {
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
  rtp_percent: number;
  min_bet: number;
  max_bet: number;
  launch_url: string | null;
}

interface ProviderRow {
  id: string;
  provider_code: string;
  provider_name: string;
}

const ALL_GAMES: GameType[] = ['wingo', 'k3', '5d', 'trxwin', 'aviator', 'crash', 'mines'];

export const GamesCatalogModule = () => {
  const [games, setGames] = useState<GameRow[]>([]);
  const [sports, setSports] = useState<SportRow[]>([]);
  const [apiGames, setApiGames] = useState<ApiGameRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Add Game dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newGame, setNewGame] = useState({ game_type: '', min_bet: 10, max_bet: 50000, house_edge_percent: 2 });

  // Sports dialog (add/edit)
  const [sportOpen, setSportOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportRow | null>(null);
  const [sportForm, setSportForm] = useState({ name: '', slug: '', icon: 'Trophy', sort_order: 0, is_enabled: true });

  // API Game dialog (add/edit)
  const emptyApiForm = {
    provider_id: '',
    game_name: '',
    game_code: '',
    game_type: 'slot',
    thumbnail_url: '',
    launch_url: '',
    rtp_percent: 96,
    min_bet: 10,
    max_bet: 50000,
    sort_order: 0,
    is_enabled: true,
    is_featured: false,
    is_new: false,
  };
  const [apiGameOpen, setApiGameOpen] = useState(false);
  const [editingApiGame, setEditingApiGame] = useState<ApiGameRow | null>(null);
  const [apiGameForm, setApiGameForm] = useState(emptyApiForm);

  const load = useCallback(async () => {
    setLoading(true);
    const [g, s, ag, p] = await Promise.all([
      supabase.from('game_admin_settings').select('id,game_type,is_enabled,maintenance_mode,min_bet,max_bet,house_edge_percent').order('game_type'),
      supabase.from('sports_categories').select('*').order('sort_order'),
      supabase.from('api_games').select('id,provider_id,game_name,game_code,game_type,thumbnail_url,is_enabled,is_featured,is_new,sort_order,rtp_percent,min_bet,max_bet,launch_url').order('sort_order'),
      supabase.from('api_game_providers').select('id,provider_code,provider_name').order('provider_name'),
    ]);
    if (g.error) toast.error('Failed to load games'); else setGames((g.data ?? []) as GameRow[]);
    if (s.error) toast.error('Failed to load sports'); else setSports((s.data ?? []) as SportRow[]);
    if (ag.error) toast.error('Failed to load API games'); else setApiGames((ag.data ?? []) as ApiGameRow[]);
    if (p.error) toast.error('Failed to load providers'); else setProviders((p.data ?? []) as ProviderRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateGame = (id: string, patch: Partial<GameRow>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  const saveGame = async (g: GameRow) => {
    setSavingId(g.id);
    const { error } = await supabase.from('game_admin_settings').update({
      is_enabled: g.is_enabled,
      maintenance_mode: g.maintenance_mode,
      min_bet: g.min_bet,
      max_bet: g.max_bet,
      house_edge_percent: g.house_edge_percent,
    }).eq('id', g.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`${g.game_type.toUpperCase()} saved`);
  };

  const toggleGame = async (g: GameRow, field: 'is_enabled' | 'maintenance_mode', value: boolean) => {
    updateGame(g.id, { [field]: value });
    const patch = field === 'is_enabled' ? { is_enabled: value } : { maintenance_mode: value };
    const { error } = await supabase.from('game_admin_settings').update(patch).eq('id', g.id);
    if (error) { toast.error(error.message); load(); }
    else toast.success(`${g.game_type.toUpperCase()} ${field === 'is_enabled' ? (value ? 'enabled' : 'disabled') : (value ? 'in maintenance' : 'live')}`);
  };

  const addGame = async () => {
    if (!newGame.game_type.trim()) { toast.error('Game type required'); return; }
    const { error } = await supabase.from('game_admin_settings').insert({
      game_type: newGame.game_type.trim().toLowerCase(),
      is_enabled: true,
      maintenance_mode: false,
      min_bet: newGame.min_bet,
      max_bet: newGame.max_bet,
      house_edge_percent: newGame.house_edge_percent,
      auto_result_enabled: true,
      manual_result_override: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Game added');
    setAddOpen(false);
    setNewGame({ game_type: '', min_bet: 10, max_bet: 50000, house_edge_percent: 2 });
    load();
  };

  const deleteGame = async (g: GameRow) => {
    if (!confirm(`Delete ${g.game_type}? This cannot be undone.`)) return;
    const { error } = await supabase.from('game_admin_settings').delete().eq('id', g.id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  // ===== Sports =====
  const openSportDialog = (s?: SportRow) => {
    if (s) {
      setEditingSport(s);
      setSportForm({ name: s.name, slug: s.slug, icon: s.icon, sort_order: s.sort_order, is_enabled: s.is_enabled });
    } else {
      setEditingSport(null);
      setSportForm({ name: '', slug: '', icon: 'Trophy', sort_order: sports.length + 1, is_enabled: true });
    }
    setSportOpen(true);
  };

  const saveSport = async () => {
    if (!sportForm.name.trim() || !sportForm.slug.trim()) { toast.error('Name & slug required'); return; }
    const payload = { ...sportForm, slug: sportForm.slug.trim().toLowerCase() };
    const q = editingSport
      ? supabase.from('sports_categories').update(payload).eq('id', editingSport.id)
      : supabase.from('sports_categories').insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editingSport ? 'Sport updated' : 'Sport added');
    setSportOpen(false);
    load();
  };

  const toggleSport = async (s: SportRow, value: boolean) => {
    const { error } = await supabase.from('sports_categories').update({ is_enabled: value }).eq('id', s.id);
    if (error) toast.error(error.message);
    else { toast.success(`${s.name} ${value ? 'enabled' : 'disabled'}`); load(); }
  };

  const deleteSport = async (s: SportRow) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    const { error } = await supabase.from('sports_categories').delete().eq('id', s.id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  // ===== API Games =====
  const openApiGameDialog = (g?: ApiGameRow) => {
    if (g) {
      setEditingApiGame(g);
      setApiGameForm({
        provider_id: g.provider_id,
        game_name: g.game_name,
        game_code: g.game_code,
        game_type: g.game_type || 'slot',
        thumbnail_url: g.thumbnail_url ?? '',
        launch_url: g.launch_url ?? '',
        rtp_percent: Number(g.rtp_percent) || 96,
        min_bet: Number(g.min_bet) || 10,
        max_bet: Number(g.max_bet) || 50000,
        sort_order: g.sort_order ?? 0,
        is_enabled: g.is_enabled,
        is_featured: g.is_featured,
        is_new: g.is_new,
      });
    } else {
      setEditingApiGame(null);
      setApiGameForm({ ...emptyApiForm, provider_id: providers[0]?.id ?? '', sort_order: apiGames.length + 1 });
    }
    setApiGameOpen(true);
  };

  const saveApiGame = async () => {
    const f = apiGameForm;
    if (!f.provider_id) { toast.error('Provider required'); return; }
    if (!f.game_name.trim() || !f.game_code.trim()) { toast.error('Name & game code required'); return; }
    const payload = {
      provider_id: f.provider_id,
      game_name: f.game_name.trim(),
      game_code: f.game_code.trim(),
      game_type: f.game_type.trim() || 'slot',
      thumbnail_url: f.thumbnail_url.trim() || null,
      launch_url: f.launch_url.trim() || null,
      rtp_percent: f.rtp_percent,
      min_bet: f.min_bet,
      max_bet: f.max_bet,
      sort_order: f.sort_order,
      is_enabled: f.is_enabled,
      is_featured: f.is_featured,
      is_new: f.is_new,
    };
    const q = editingApiGame
      ? supabase.from('api_games').update(payload).eq('id', editingApiGame.id)
      : supabase.from('api_games').insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editingApiGame ? 'API game updated' : 'API game added');
    setApiGameOpen(false);
    load();
  };

  const toggleApiGame = async (g: ApiGameRow, field: 'is_enabled' | 'is_featured' | 'is_new', value: boolean) => {
    setApiGames(prev => prev.map(x => x.id === g.id ? { ...x, [field]: value } : x));
    const patch: Partial<ApiGameRow> = { [field]: value };
    const { error } = await supabase.from('api_games').update(patch).eq('id', g.id);
    if (error) { toast.error(error.message); load(); }
    else toast.success(`${g.game_name} ${field.replace('is_', '')}: ${value ? 'on' : 'off'}`);
  };

  const deleteApiGame = async (g: ApiGameRow) => {
    if (!confirm(`Delete ${g.game_name}?`)) return;
    const { error } = await supabase.from('api_games').delete().eq('id', g.id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  const providerName = (id: string) => providers.find(p => p.id === id)?.provider_name ?? '—';

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Games Catalog Manager</h1>
          <p className="text-gray-400">Add, edit & toggle in-house games, API provider games, and sports categories.</p>
        </div>
        <Button variant="outline" onClick={load} className="border-gray-700"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <Tabs defaultValue="games">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="games">In-House Games ({games.length})</TabsTrigger>
          <TabsTrigger value="api">API Games ({apiGames.length})</TabsTrigger>
          <TabsTrigger value="sports">Sports Categories ({sports.length})</TabsTrigger>
        </TabsList>

        {/* ===== GAMES TAB ===== */}
        <TabsContent value="games" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500"><Plus className="h-4 w-4 mr-2" />Add Game</Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader><DialogTitle>Add New Game</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Game Type (slug, lowercase)</Label>
                    <Input value={newGame.game_type} onChange={e => setNewGame(v => ({ ...v, game_type: e.target.value }))} placeholder="e.g. wingo7" className="bg-gray-950 border-gray-800" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Min Bet (৳)</Label><Input type="number" value={newGame.min_bet} onChange={e => setNewGame(v => ({ ...v, min_bet: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                    <div><Label>Max Bet (৳)</Label><Input type="number" value={newGame.max_bet} onChange={e => setNewGame(v => ({ ...v, max_bet: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                    <div><Label>House Edge %</Label><Input type="number" step="0.1" value={newGame.house_edge_percent} onChange={e => setNewGame(v => ({ ...v, house_edge_percent: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={addGame} className="bg-emerald-500">Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {games.map(g => {
              const cfg = GAME_CONFIG[g.game_type as GameType];
              const Icon = cfg ? ICONS[cfg.icon] || Target : Target;
              return (
                <Card key={g.id} className="bg-gray-900/60 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white text-base">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg?.gradient ?? 'from-gray-600 to-gray-700'}`}><Icon className="h-4 w-4 text-white" /></div>
                        <span>{cfg?.label ?? g.game_type.toUpperCase()}</span>
                      </CardTitle>
                      <Badge className={g.is_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {g.is_enabled ? 'LIVE' : 'OFF'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Enabled</span>
                      <Switch checked={g.is_enabled} onCheckedChange={v => toggleGame(g, 'is_enabled', v)} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Maintenance</span>
                      <Switch checked={g.maintenance_mode} onCheckedChange={v => toggleGame(g, 'maintenance_mode', v)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label className="text-xs text-gray-500">Min Bet</Label><Input type="number" value={g.min_bet} onChange={e => updateGame(g.id, { min_bet: Number(e.target.value) })} className="bg-gray-950 border-gray-800 h-9" /></div>
                      <div><Label className="text-xs text-gray-500">Max Bet</Label><Input type="number" value={g.max_bet} onChange={e => updateGame(g.id, { max_bet: Number(e.target.value) })} className="bg-gray-950 border-gray-800 h-9" /></div>
                      <div><Label className="text-xs text-gray-500">Edge %</Label><Input type="number" step="0.1" value={g.house_edge_percent} onChange={e => updateGame(g.id, { house_edge_percent: Number(e.target.value) })} className="bg-gray-950 border-gray-800 h-9" /></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 bg-teal-500 hover:bg-teal-600" onClick={() => saveGame(g)} disabled={savingId === g.id}>
                        {savingId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save</>}
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => deleteGame(g)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== API GAMES TAB ===== */}
        <TabsContent value="api" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={() => openApiGameDialog()} disabled={providers.length === 0}>
              <Plus className="h-4 w-4 mr-2" />Add API Game
            </Button>
          </div>
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">#</TableHead>
                    <TableHead className="text-gray-400">Provider</TableHead>
                    <TableHead className="text-gray-400">Game</TableHead>
                    <TableHead className="text-gray-400">Code</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">RTP</TableHead>
                    <TableHead className="text-gray-400">Bet (৳)</TableHead>
                    <TableHead className="text-gray-400">Enabled</TableHead>
                    <TableHead className="text-gray-400">Featured</TableHead>
                    <TableHead className="text-gray-400">New</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiGames.map(g => (
                    <TableRow key={g.id} className="border-gray-800">
                      <TableCell className="text-gray-400">{g.sort_order}</TableCell>
                      <TableCell className="text-white">{providerName(g.provider_id)}</TableCell>
                      <TableCell className="text-white font-medium">{g.game_name}</TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">{g.game_code}</TableCell>
                      <TableCell className="text-gray-400">{g.game_type}</TableCell>
                      <TableCell className="text-gray-400">{Number(g.rtp_percent).toFixed(1)}%</TableCell>
                      <TableCell className="text-gray-400 text-xs">{g.min_bet}–{g.max_bet}</TableCell>
                      <TableCell><Switch checked={g.is_enabled} onCheckedChange={v => toggleApiGame(g, 'is_enabled', v)} /></TableCell>
                      <TableCell><Switch checked={g.is_featured} onCheckedChange={v => toggleApiGame(g, 'is_featured', v)} /></TableCell>
                      <TableCell><Switch checked={g.is_new} onCheckedChange={v => toggleApiGame(g, 'is_new', v)} /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="border-gray-700" onClick={() => openApiGameDialog(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => deleteApiGame(g)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {apiGames.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center text-gray-500 py-8">No API games yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={apiGameOpen} onOpenChange={setApiGameOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader><DialogTitle>{editingApiGame ? 'Edit' : 'Add'} API Game</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto">
                <div className="col-span-2">
                  <Label>Provider</Label>
                  <select
                    value={apiGameForm.provider_id}
                    onChange={e => setApiGameForm(v => ({ ...v, provider_id: e.target.value }))}
                    className="w-full bg-gray-950 border border-gray-800 rounded-md h-10 px-3 text-sm"
                  >
                    <option value="">— Select provider —</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.provider_name} ({p.provider_code})</option>)}
                  </select>
                </div>
                <div><Label>Game Name</Label><Input value={apiGameForm.game_name} onChange={e => setApiGameForm(v => ({ ...v, game_name: e.target.value }))} className="bg-gray-950 border-gray-800" /></div>
                <div><Label>Game Code</Label><Input value={apiGameForm.game_code} onChange={e => setApiGameForm(v => ({ ...v, game_code: e.target.value }))} placeholder="vs20fruitsw" className="bg-gray-950 border-gray-800 font-mono" /></div>
                <div><Label>Game Type</Label><Input value={apiGameForm.game_type} onChange={e => setApiGameForm(v => ({ ...v, game_type: e.target.value }))} placeholder="slot / live / table" className="bg-gray-950 border-gray-800" /></div>
                <div><Label>Sort Order</Label><Input type="number" value={apiGameForm.sort_order} onChange={e => setApiGameForm(v => ({ ...v, sort_order: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                <div className="col-span-2"><Label>Thumbnail URL</Label><Input value={apiGameForm.thumbnail_url} onChange={e => setApiGameForm(v => ({ ...v, thumbnail_url: e.target.value }))} className="bg-gray-950 border-gray-800" /></div>
                <div className="col-span-2"><Label>Launch URL (optional override)</Label><Input value={apiGameForm.launch_url} onChange={e => setApiGameForm(v => ({ ...v, launch_url: e.target.value }))} className="bg-gray-950 border-gray-800" /></div>
                <div><Label>RTP %</Label><Input type="number" step="0.1" value={apiGameForm.rtp_percent} onChange={e => setApiGameForm(v => ({ ...v, rtp_percent: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                <div><Label>Min Bet (৳)</Label><Input type="number" value={apiGameForm.min_bet} onChange={e => setApiGameForm(v => ({ ...v, min_bet: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                <div><Label>Max Bet (৳)</Label><Input type="number" value={apiGameForm.max_bet} onChange={e => setApiGameForm(v => ({ ...v, max_bet: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                <div className="col-span-2 grid grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center justify-between rounded-md border border-gray-800 px-3 py-2"><Label>Enabled</Label><Switch checked={apiGameForm.is_enabled} onCheckedChange={v => setApiGameForm(s => ({ ...s, is_enabled: v }))} /></div>
                  <div className="flex items-center justify-between rounded-md border border-gray-800 px-3 py-2"><Label>Featured</Label><Switch checked={apiGameForm.is_featured} onCheckedChange={v => setApiGameForm(s => ({ ...s, is_featured: v }))} /></div>
                  <div className="flex items-center justify-between rounded-md border border-gray-800 px-3 py-2"><Label>New</Label><Switch checked={apiGameForm.is_new} onCheckedChange={v => setApiGameForm(s => ({ ...s, is_new: v }))} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setApiGameOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-500" onClick={saveApiGame}>{editingApiGame ? 'Save' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== SPORTS TAB ===== */}
        <TabsContent value="sports" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={() => openSportDialog()}>
              <Plus className="h-4 w-4 mr-2" />Add Sport Category
            </Button>
          </div>
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Order</TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Slug</TableHead>
                    <TableHead className="text-gray-400">Icon</TableHead>
                    <TableHead className="text-gray-400">Enabled</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sports.map(s => (
                    <TableRow key={s.id} className="border-gray-800">
                      <TableCell className="text-white">{s.sort_order}</TableCell>
                      <TableCell className="text-white font-medium">{s.name}</TableCell>
                      <TableCell className="text-gray-400">{s.slug}</TableCell>
                      <TableCell className="text-gray-400">{s.icon}</TableCell>
                      <TableCell><Switch checked={s.is_enabled} onCheckedChange={v => toggleSport(s, v)} /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="border-gray-700" onClick={() => openSportDialog(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => deleteSport(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sports.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No sports categories yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={sportOpen} onOpenChange={setSportOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader><DialogTitle>{editingSport ? 'Edit' : 'Add'} Sport Category</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div><Label>Name</Label><Input value={sportForm.name} onChange={e => setSportForm(v => ({ ...v, name: e.target.value }))} className="bg-gray-950 border-gray-800" /></div>
                <div><Label>Slug</Label><Input value={sportForm.slug} onChange={e => setSportForm(v => ({ ...v, slug: e.target.value }))} placeholder="cricket" className="bg-gray-950 border-gray-800" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Icon</Label><Input value={sportForm.icon} onChange={e => setSportForm(v => ({ ...v, icon: e.target.value }))} className="bg-gray-950 border-gray-800" /></div>
                  <div><Label>Sort Order</Label><Input type="number" value={sportForm.sort_order} onChange={e => setSportForm(v => ({ ...v, sort_order: Number(e.target.value) }))} className="bg-gray-950 border-gray-800" /></div>
                </div>
                <div className="flex items-center justify-between pt-1"><Label>Enabled</Label><Switch checked={sportForm.is_enabled} onCheckedChange={v => setSportForm(s => ({ ...s, is_enabled: v }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setSportOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-500" onClick={saveSport}>{editingSport ? 'Save' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};
