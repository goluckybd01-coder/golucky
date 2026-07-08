import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { KeyRound, Shield, Loader2 } from 'lucide-react';

interface Provider {
  id: string;
  provider_code: string;
  provider_name: string;
  category: string | null;
  is_enabled: boolean;
  is_test_mode: boolean;
  api_url?: string | null;
  callback_url?: string | null;
}

const CATEGORIES = ['live_casino', 'fishing'] as const;

export const ProvidersModule = () => {
  const [rows, setRows] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_game_providers')
      .select('id,provider_code,provider_name,category,is_enabled,is_test_mode')
      .in('category', CATEGORIES as unknown as string[])
      .order('category')
      .order('provider_name');
    if (error) toast.error('Failed to load providers');
    else setRows((data ?? []) as Provider[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleEnabled = async (p: Provider, next: boolean) => {
    const { error } = await supabase.from('api_game_providers').update({ is_enabled: next }).eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(`${p.provider_name} ${next ? 'enabled' : 'disabled'}`);
    setRows(rs => rs.map(r => r.id === p.id ? { ...r, is_enabled: next } : r));
  };

  const toggleTest = async (p: Provider, next: boolean) => {
    const { error } = await supabase.from('api_game_providers').update({ is_test_mode: next }).eq('id', p.id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.map(r => r.id === p.id ? { ...r, is_test_mode: next } : r));
  };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setApiKey('');
    setSecretKey('');
    setApiUrl(p.api_url ?? '');
    setCallbackUrl(p.callback_url ?? '');
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload: TablesUpdate<'api_game_providers'> = {
      api_url: apiUrl || null,
      callback_url: callbackUrl || null,
    };
    if (apiKey.trim()) payload.api_key_encrypted = apiKey.trim();
    if (secretKey.trim()) payload.secret_key_encrypted = secretKey.trim();
    const { error } = await supabase.from('api_game_providers').update(payload).eq('id', editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Credentials updated');
    setEditing(null);
    load();
  };

  const grouped = CATEGORIES.map(c => ({ cat: c, items: rows.filter(r => r.category === c) }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" /> Third-Party Providers
        </h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
      ) : grouped.map(group => (
        <div key={group.cat} className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-300 uppercase tracking-wide">{group.cat.replace('_', ' ')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map(p => (
              <Card key={p.id} className="p-4 bg-gray-900/60 border-amber-500/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{p.provider_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{p.provider_code}</div>
                  </div>
                  <Badge className={p.is_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-300'}>
                    {p.is_enabled ? 'Live' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <Switch checked={p.is_enabled} onCheckedChange={(v) => toggleEnabled(p, v)} />
                  <Switch checked={p.is_test_mode} onCheckedChange={(v) => toggleTest(p, v)} />
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <KeyRound className="w-3 h-3 mr-1" /> Credentials
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-gray-950 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{editing?.provider_name} — Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-gray-300">API URL</Label><Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} /></div>
            <div><Label className="text-gray-300">Callback URL</Label><Input value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)} /></div>
            <div><Label className="text-gray-300">API Key</Label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} /></div>
            <div><Label className="text-gray-300">Secret Key</Label><Input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProvidersModule;
