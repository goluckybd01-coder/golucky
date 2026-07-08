import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

type Row = Record<string, any>;

const TABLES = {
  features: "lucky_hub_features",
  plans: "fixed_deposit_plans",
  jackpots: "jackpot_campaigns",
  rounds: "lucky_draw_rounds",
  events: "hub_events",
  tournaments: "hub_tournaments",
  challenges: "hub_challenges",
} as const;

function useTable(table: string) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from(table).select("*").order("created_at", { ascending: false });
    if (error) toast.error(`${table}: ${error.message}`);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load();   }, [table]);
  return { rows, loading, reload: load };
}

async function upsertRow(table: string, row: Row) {
  const { error } = await (supabase as any).from(table).upsert(row);
  if (error) throw error;
}
async function deleteRow(table: string, id: string) {
  const { error } = await (supabase as any).from(table).delete().eq("id", id);
  if (error) throw error;
}

function FeaturesTab() {
  const { rows, reload } = useTable(TABLES.features);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} data-testid={`lucky-hub-admin-row-${r.feature_key}`} data-feature-key={r.feature_key}>
          <CardContent className="pt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <code className="text-xs text-muted-foreground">{r.feature_key}</code>
                <Switch
                  data-testid={`lucky-hub-admin-switch-${r.feature_key}`}
                  checked={r.is_enabled}
                  onCheckedChange={async (v) => {
                    try { await upsertRow(TABLES.features, { id: r.id, feature_key: r.feature_key, title: r.title, description: r.description, is_enabled: v }); toast.success("Updated"); reload(); }
                    catch (e: any) { toast.error(e.message); }
                  }}
                />
              </div>
              <Input defaultValue={r.title} onBlur={async (e) => { await upsertRow(TABLES.features, { id: r.id, feature_key: r.feature_key, title: e.target.value, description: r.description, is_enabled: r.is_enabled }); reload(); }} />
              <Textarea defaultValue={r.description} onBlur={async (e) => { await upsertRow(TABLES.features, { id: r.id, feature_key: r.feature_key, title: r.title, description: e.target.value, is_enabled: r.is_enabled }); reload(); }} />
              <Input placeholder="Banner URL (optional)" defaultValue={r.banner_url || ""} onBlur={async (e) => { await upsertRow(TABLES.features, { id: r.id, feature_key: r.feature_key, title: r.title, description: r.description, is_enabled: r.is_enabled, banner_url: e.target.value || null }); reload(); }} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GenericCrud({
  table, fields, defaults,
}: { table: string; fields: { key: string; label: string; type?: "text" | "number" | "datetime" | "textarea" | "switch" }[]; defaults: Row }) {
  const { rows, reload } = useTable(table);
  const [draft, setDraft] = useState<Row>(defaults);

  const save = async (row: Row) => {
    try { await upsertRow(table, row); toast.success("Saved"); reload(); }
    catch (e: any) { toast.error(e.message); }
  };

  const renderField = (f: (typeof fields)[number], row: Row, onChange: (v: any) => void) => {
    const v = row[f.key] ?? "";
    if (f.type === "textarea") return <Textarea value={v} onChange={(e) => onChange(e.target.value)} />;
    if (f.type === "switch") return <Switch checked={!!v} onCheckedChange={onChange} />;
    if (f.type === "number") return <Input type="number" value={v} onChange={(e) => onChange(Number(e.target.value))} />;
    if (f.type === "datetime") return <Input type="datetime-local" value={v ? String(v).slice(0, 16) : ""} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />;
    return <Input value={v ?? ""} onChange={(e) => onChange(e.target.value)} />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Create new</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              {renderField(f, draft, (v) => setDraft({ ...draft, [f.key]: v }))}
            </div>
          ))}
          <div className="md:col-span-2">
            <Button onClick={async () => { await save(draft); setDraft(defaults); }}>Create</Button>
          </div>
        </CardContent>
      </Card>

      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="pt-4 grid gap-3 md:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {renderField(f, r, (v) => save({ ...r, [f.key]: v }))}
              </div>
            ))}
            <div className="md:col-span-2 flex justify-end">
              <Button size="sm" variant="destructive" onClick={async () => { try { await deleteRow(table, r.id); toast.success("Deleted"); reload(); } catch (e: any) { toast.error(e.message); } }}>
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LuckyHubAdmin() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Lucky Hub Control</h1>
        <p className="text-sm text-muted-foreground">Enable features and manage all premium promotional content.</p>
      </div>

      <Tabs defaultValue="features">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="plans">Fixed Deposit</TabsTrigger>
          <TabsTrigger value="jackpots">Jackpots</TabsTrigger>
          <TabsTrigger value="rounds">Lucky Draw</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="features"><FeaturesTab /></TabsContent>

        <TabsContent value="plans">
          <GenericCrud
            table={TABLES.plans}
            defaults={{ name: "Starter Plan", min_amount: 1000, daily_rate_bps: 50, duration_days: 30, is_active: true }}
            fields={[
              { key: "name", label: "Plan Name" },
              { key: "min_amount", label: "Min Amount (৳)", type: "number" },
              { key: "max_amount", label: "Max Amount (৳)", type: "number" },
              { key: "daily_rate_bps", label: "Daily Rate (bps, 100=1%)", type: "number" },
              { key: "duration_days", label: "Duration (days)", type: "number" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>

        <TabsContent value="jackpots">
          <GenericCrud
            table={TABLES.jackpots}
            defaults={{ title: "Mega Jackpot", description: "", prize_pool: 0, entry_fee: 0, ends_at: new Date(Date.now() + 7 * 86400000).toISOString(), is_active: true, status: "active" }}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "banner_url", label: "Banner URL" },
              { key: "prize_pool", label: "Prize Pool (৳)", type: "number" },
              { key: "entry_fee", label: "Entry Fee (৳)", type: "number" },
              { key: "ends_at", label: "Ends At", type: "datetime" },
              { key: "status", label: "Status" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>

        <TabsContent value="rounds">
          <GenericCrud
            table={TABLES.rounds}
            defaults={{ ticket_price: 50, max_prize: 10000000, total_tickets: 200000, draw_at: new Date(Date.now() + 7 * 86400000).toISOString(), status: "open", is_active: true }}
            fields={[
              { key: "ticket_price", label: "Ticket Price (৳)", type: "number" },
              { key: "max_prize", label: "Max Prize (৳)", type: "number" },
              { key: "total_tickets", label: "Total Tickets", type: "number" },
              { key: "draw_at", label: "Draw Date/Time", type: "datetime" },
              { key: "status", label: "Status (open/closed/settled)" },
              { key: "winner_ticket_no", label: "Winner Ticket #", type: "number" },
              { key: "winner_prize", label: "Winner Prize (৳)", type: "number" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>

        <TabsContent value="events">
          <GenericCrud
            table={TABLES.events}
            defaults={{ title: "New Campaign", description: "", is_active: true, sort_order: 0 }}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "banner_url", label: "Banner URL" },
              { key: "cta_url", label: "CTA Link" },
              { key: "starts_at", label: "Starts", type: "datetime" },
              { key: "ends_at", label: "Ends", type: "datetime" },
              { key: "sort_order", label: "Sort Order", type: "number" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>

        <TabsContent value="tournaments">
          <GenericCrud
            table={TABLES.tournaments}
            defaults={{ title: "Weekly Tournament", description: "", prize_pool: 0, entry_fee: 0, is_active: true }}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "banner_url", label: "Banner URL" },
              { key: "prize_pool", label: "Prize Pool (৳)", type: "number" },
              { key: "entry_fee", label: "Entry Fee (৳)", type: "number" },
              { key: "starts_at", label: "Starts", type: "datetime" },
              { key: "ends_at", label: "Ends", type: "datetime" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>

        <TabsContent value="challenges">
          <GenericCrud
            table={TABLES.challenges}
            defaults={{ title: "New Challenge", description: "", reward_amount: 0, is_active: true }}
            fields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "banner_url", label: "Banner URL" },
              { key: "reward_amount", label: "Reward (৳)", type: "number" },
              { key: "starts_at", label: "Starts", type: "datetime" },
              { key: "ends_at", label: "Ends", type: "datetime" },
              { key: "is_active", label: "Active", type: "switch" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
