import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, History, RotateCcw, Plus, Trash2, Search } from "lucide-react";

type Provider = {
  id: string; provider_name: string; provider_code: string; logo_url: string | null;
  description: string | null; category: string | null; is_enabled: boolean;
  maintenance_mode: boolean; display_order: number; commission_rate: number | null;
  last_sync_at: string | null; last_sync_status: string | null; last_sync_error: string | null;
};
type Game = {
  id: string; provider_id: string; game_name: string; game_code: string;
  game_type: string | null; thumbnail_url: string | null; category: string | null;
  is_enabled: boolean; is_featured: boolean; is_new: boolean;
  maintenance_mode: boolean; vip_only: boolean; agent_only: boolean;
  sort_order: number; min_bet: number | null; max_bet: number | null;
  commission_override: number | null;
};
type Version = { id: string; version_number: number; note: string | null; created_at: string };
type Audit = { id: string; target_type: string; action: string; created_at: string; actor: string | null };

const AdminApiGameControlsPage = () => {
  const [tab, setTab] = useState<"providers" | "games" | "audit">("providers");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [flagOn, setFlagOn] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);

  const selectedProvider = useMemo(() => providers.find((p) => p.id === selectedProviderId) || null, [providers, selectedProviderId]);
  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) || null, [games, selectedGameId]);

  const load = async () => {
    const [{ data: prov }, { data: gm }, { data: flag }] = await Promise.all([
      supabase.from("api_game_providers").select("*").order("display_order"),
      supabase.from("api_games").select("*").order("sort_order"),
      supabase.from("admin_feature_flags").select("flag_value").eq("flag_name", "api_game_controls_enabled").maybeSingle(),
    ]);
    setProviders((prov as Provider[]) || []);
    setGames((gm as Game[]) || []);
    setFlagOn(Boolean(flag?.flag_value));
  };
  const loadVersions = async (type: "provider" | "game", id: string) => {
    const { data } = await supabase.from("api_game_control_versions")
      .select("id, version_number, note, created_at")
      .eq("target_type", type).eq("target_id", id).order("version_number", { ascending: false });
    setVersions(data || []);
  };
  const loadAudit = async () => {
    const { data } = await supabase.from("api_game_control_audit")
      .select("id,target_type,action,created_at,actor").order("created_at", { ascending: false }).limit(200);
    setAudit((data as Audit[]) || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedProviderId) loadVersions("provider", selectedProviderId); }, [selectedProviderId]);
  useEffect(() => { if (selectedGameId) loadVersions("game", selectedGameId); }, [selectedGameId]);
  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab]);

  const patchP = (id: string, p: Partial<Provider>) => setProviders((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const patchG = (id: string, p: Partial<Game>) => setGames((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const toggleFlag = async () => {
    const next = !flagOn;
    const { error } = await supabase.from("admin_feature_flags").update({ flag_value: next }).eq("flag_name", "api_game_controls_enabled");
    if (error) return toast.error(error.message);
    setFlagOn(next);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("api_game_control_audit").insert({
        target_type: "flag",
        target_id: null,
        action: next ? "flag_enabled" : "flag_disabled",
        actor: user?.id ?? null,
        after: { flag: "api_game_controls_enabled", value: next },
      } as any);
    } catch (e) {
      console.warn("audit log failed", e);
    }
    toast.success(next ? "Live games now respect these controls" : "Controls OFF — live games unaffected");
  };

  const saveProvider = async () => {
    if (!selectedProvider) return;
    const { id, last_sync_at, last_sync_status, last_sync_error, ...rest } = selectedProvider;
    const { error } = await supabase.from("api_game_providers").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Provider saved");
  };
  const saveGame = async () => {
    if (!selectedGame) return;
    const { id, ...rest } = selectedGame;
    const { error } = await supabase.from("api_games").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Game saved");
  };

  const addProvider = async () => {
    const name = prompt("Provider name:")?.trim(); if (!name) return;
    const code = prompt("Provider code (lowercase, e.g. pg, pp, am):")?.trim(); if (!code) return;
    const { error } = await supabase.from("api_game_providers").insert({
      provider_name: name, provider_code: code.toLowerCase(), api_url: "", is_enabled: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Provider created"); load();
  };
  const addGame = async () => {
    if (!selectedProviderId) return toast.error("Pick a provider first");
    const name = prompt("Game name:")?.trim(); if (!name) return;
    const code = prompt("Game code:")?.trim(); if (!code) return;
    const { error } = await supabase.from("api_games").insert({
      provider_id: selectedProviderId, game_name: name, game_code: code, is_enabled: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Game created"); load();
  };
  const deleteProvider = async () => {
    if (!selectedProvider) return;
    if (!confirm(`Delete provider "${selectedProvider.provider_name}" and all its games?`)) return;
    const { error } = await supabase.from("api_game_providers").delete().eq("id", selectedProvider.id);
    if (error) return toast.error(error.message);
    setSelectedProviderId(null); load();
  };
  const deleteGame = async () => {
    if (!selectedGame) return;
    if (!confirm(`Delete game "${selectedGame.game_name}"?`)) return;
    const { error } = await supabase.from("api_games").delete().eq("id", selectedGame.id);
    if (error) return toast.error(error.message);
    setSelectedGameId(null); load();
  };
  const snapshot = async (type: "provider" | "game", id: string) => {
    const note = prompt("Version note (optional):") || null;
    const { error } = await supabase.rpc("api_game_snapshot", { p_type: type, p_id: id, p_note: note });
    if (error) return toast.error(error.message);
    toast.success("Snapshot saved"); loadVersions(type, id);
  };
  const rollback = async (type: "provider" | "game", id: string, v: number) => {
    if (!confirm(`Rollback to v${v}?`)) return;
    const { error } = await supabase.rpc("api_game_rollback", { p_type: type, p_id: id, p_version: v });
    if (error) return toast.error(error.message);
    toast.success(`Rolled back to v${v}`); load();
  };

  const bulkSet = async (ids: string[], patch: Partial<Game>) => {
    const { error } = await supabase.from("api_games").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Updated ${ids.length} games`); load();
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => g.category && set.add(g.category));
    return Array.from(set).sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (providerFilter !== "all" && g.provider_id !== providerFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (search && !g.game_name.toLowerCase().includes(search.toLowerCase()) && !g.game_code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [games, providerFilter, categoryFilter, search]);

  return (
    <AdminShell
      title="API Provider Game Controls"
      description="Manage third-party game providers and their games. Live games apply these rules only when the master flag is ON."
    >
      <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-amber-300">Enforce on live games</p>
          <p className="text-xs text-amber-200/70">
            {flagOn ? "ON — live game listings respect provider/game maintenance & audience rules" : "OFF — live games unaffected by these controls"}
          </p>
        </div>
        <Switch checked={flagOn} onCheckedChange={toggleFlag} />
      </div>

      <div className="flex gap-2 mb-4">
        {(["providers", "games", "audit"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t === "providers" ? "Providers" : t === "games" ? "Games" : "Audit Log"}
          </Button>
        ))}
      </div>

      {tab === "providers" && (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-4 p-4 bg-slate-900/60 border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Providers ({providers.length})</h3>
              <Button size="sm" onClick={addProvider}><Plus className="h-4 w-4 mr-1" />New</Button>
            </div>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {providers.map((p) => (
                <button key={p.id} onClick={() => setSelectedProviderId(p.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-left ${
                    selectedProviderId === p.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/40 hover:bg-slate-800"
                  }`}>
                  <div className="flex items-center gap-2">
                    {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-6 rounded" /> :
                      <div className="h-6 w-6 rounded bg-slate-700 text-[10px] flex items-center justify-center">{p.provider_code.slice(0,2).toUpperCase()}</div>}
                    <div>
                      <div className="text-sm font-semibold text-white">{p.provider_name}</div>
                      <div className="text-[10px] text-slate-400">{p.provider_code}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.maintenance_mode && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px]">MAINT</Badge>}
                    {!p.is_enabled && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">OFF</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-8 p-6 bg-slate-900/60 border-slate-700">
            {!selectedProvider ? <div className="h-64 flex items-center justify-center text-slate-500">Select a provider</div> : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{selectedProvider.provider_name}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => snapshot("provider", selectedProvider.id)}>
                      <History className="h-4 w-4 mr-1" />Snapshot</Button>
                    <Button size="sm" onClick={saveProvider}><Save className="h-4 w-4 mr-1" />Save</Button>
                    <Button size="sm" variant="destructive" onClick={deleteProvider}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Provider Name" value={selectedProvider.provider_name} onChange={(v) => patchP(selectedProvider.id, { provider_name: v })} />
                  <TextField label="Logo URL" value={selectedProvider.logo_url || ""} onChange={(v) => patchP(selectedProvider.id, { logo_url: v || null })} />
                  <TextField label="Category" value={selectedProvider.category || ""} onChange={(v) => patchP(selectedProvider.id, { category: v || null })} />
                  <NumField label="Display Order" value={selectedProvider.display_order} onChange={(v) => patchP(selectedProvider.id, { display_order: v })} />
                  <NumField label="Commission %" value={selectedProvider.commission_rate ?? 0} onChange={(v) => patchP(selectedProvider.id, { commission_rate: v })} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                  <Toggle label="Enabled" checked={selectedProvider.is_enabled} onChange={(v) => patchP(selectedProvider.id, { is_enabled: v })} />
                  <Toggle label="Maintenance" checked={selectedProvider.maintenance_mode} onChange={(v) => patchP(selectedProvider.id, { maintenance_mode: v })} />
                </div>
                <div className="mt-6 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
                  <p className="text-xs text-slate-400">Sync Status</p>
                  <p className="text-sm text-white">
                    {selectedProvider.last_sync_status || "never"} — {selectedProvider.last_sync_at ? new Date(selectedProvider.last_sync_at).toLocaleString() : "no runs"}
                  </p>
                  {selectedProvider.last_sync_error && <p className="text-xs text-red-400 mt-1">{selectedProvider.last_sync_error}</p>}
                </div>
                <VersionList versions={versions} onRollback={(v) => rollback("provider", selectedProvider.id, v)} />
              </>
            )}
          </Card>
        </div>
      )}

      {tab === "games" && (
        <div className="space-y-3">
          <Card className="p-3 bg-slate-900/60 border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.provider_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button size="sm" onClick={addGame}><Plus className="h-4 w-4 mr-1" />New Game</Button>
              <Button size="sm" variant="outline" onClick={() => bulkSet(filteredGames.map((g) => g.id), { is_enabled: true })}>Enable all</Button>
              <Button size="sm" variant="outline" onClick={() => bulkSet(filteredGames.map((g) => g.id), { is_enabled: false })}>Disable all</Button>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-5 p-3 bg-slate-900/60 border-slate-700 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-400 mb-2">{filteredGames.length} games</p>
              <div className="space-y-1">
                {filteredGames.map((g) => (
                  <button key={g.id} onClick={() => setSelectedGameId(g.id)}
                    className={`w-full flex items-center justify-between p-2 rounded border text-left ${
                      selectedGameId === g.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/40 hover:bg-slate-800"
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {g.thumbnail_url ? <img src={g.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" /> :
                        <div className="h-8 w-8 rounded bg-slate-700" />}
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{g.game_name}</div>
                        <div className="text-[10px] text-slate-500">{g.game_code}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {g.is_featured && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">FEAT</Badge>}
                      {g.vip_only && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[9px]">VIP</Badge>}
                      {g.maintenance_mode && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px]">MAINT</Badge>}
                      {!g.is_enabled && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">OFF</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="col-span-12 lg:col-span-7 p-6 bg-slate-900/60 border-slate-700">
              {!selectedGame ? <div className="h-64 flex items-center justify-center text-slate-500">Select a game</div> : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{selectedGame.game_name}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => snapshot("game", selectedGame.id)}>
                        <History className="h-4 w-4 mr-1" />Snapshot</Button>
                      <Button size="sm" onClick={saveGame}><Save className="h-4 w-4 mr-1" />Save</Button>
                      <Button size="sm" variant="destructive" onClick={deleteGame}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Game Name" value={selectedGame.game_name} onChange={(v) => patchG(selectedGame.id, { game_name: v })} />
                    <TextField label="Thumbnail URL" value={selectedGame.thumbnail_url || ""} onChange={(v) => patchG(selectedGame.id, { thumbnail_url: v || null })} />
                    <TextField label="Category" value={selectedGame.category || ""} onChange={(v) => patchG(selectedGame.id, { category: v || null })} />
                    <NumField label="Sort Order" value={selectedGame.sort_order} onChange={(v) => patchG(selectedGame.id, { sort_order: v })} />
                    <NumField label="Min Bet" value={selectedGame.min_bet ?? 0} onChange={(v) => patchG(selectedGame.id, { min_bet: v })} />
                    <NumField label="Max Bet" value={selectedGame.max_bet ?? 0} onChange={(v) => patchG(selectedGame.id, { max_bet: v })} />
                    <NumField label="Commission Override %" value={selectedGame.commission_override ?? 0} onChange={(v) => patchG(selectedGame.id, { commission_override: v })} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    <Toggle label="Enabled" checked={selectedGame.is_enabled} onChange={(v) => patchG(selectedGame.id, { is_enabled: v })} />
                    <Toggle label="Featured" checked={selectedGame.is_featured} onChange={(v) => patchG(selectedGame.id, { is_featured: v })} />
                    <Toggle label="New" checked={selectedGame.is_new} onChange={(v) => patchG(selectedGame.id, { is_new: v })} />
                    <Toggle label="Maintenance" checked={selectedGame.maintenance_mode} onChange={(v) => patchG(selectedGame.id, { maintenance_mode: v })} />
                    <Toggle label="VIP Only" checked={selectedGame.vip_only} onChange={(v) => patchG(selectedGame.id, { vip_only: v })} />
                    <Toggle label="Agent Only" checked={selectedGame.agent_only} onChange={(v) => patchG(selectedGame.id, { agent_only: v })} />
                  </div>
                  <VersionList versions={versions} onRollback={(v) => rollback("game", selectedGame.id, v)} />
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <Card className="p-4 bg-slate-900/60 border-slate-700">
          <h3 className="text-sm font-bold text-white mb-3">Recent changes (last 200)</h3>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto text-xs">
            {audit.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700">
                <div>
                  <Badge className="mr-2 bg-slate-700 text-white border-slate-500 uppercase">{a.target_type}</Badge>
                  <span className="text-slate-300 font-medium">{a.action}</span>
                  {a.actor && <span className="text-slate-500 ml-2">by {a.actor.slice(0,8)}…</span>}
                </div>
                <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
            {audit.length === 0 && <p className="text-slate-500 p-3 text-center">No audit entries yet.</p>}
          </div>
        </Card>
      )}
    </AdminShell>
  );
};

const VersionList = ({ versions, onRollback }: { versions: Version[]; onRollback: (v: number) => void }) => (
  <div className="mt-6">
    <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
      <History className="h-4 w-4" /> Version History
    </h4>
    {versions.length === 0 ? <p className="text-xs text-slate-500">No snapshots yet.</p> : (
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700 text-xs">
            <div>
              <span className="text-white font-medium">v{v.version_number}</span>
              <span className="text-slate-400 ml-2">{new Date(v.created_at).toLocaleString()}</span>
              {v.note && <span className="text-slate-500 ml-2">— {v.note}</span>}
            </div>
            <Button size="sm" variant="outline" onClick={() => onRollback(v.version_number)}>
              <RotateCcw className="h-3 w-3 mr-1" />Rollback
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div><Label className="text-slate-300 text-xs">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-white" /></div>
);
const NumField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div><Label className="text-slate-300 text-xs">{label}</Label>
    <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 bg-slate-800 border-slate-700 text-white" /></div>
);
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700">
    <span className="text-xs text-slate-300">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default AdminApiGameControlsPage;
