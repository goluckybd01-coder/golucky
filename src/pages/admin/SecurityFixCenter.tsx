import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useState, useEffect, useCallback } from "react";
import { NewAdminShell } from "@/components/admin/NewAdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Lock,
  Database,
  Key,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Local storage key for persisting checklist state
const STORAGE_KEY = "security_fix_center_state";

interface ChecklistState {
  card1: {
    leakedPasswordEnabled: boolean;
    strongPasswordEnabled: boolean;
    minLengthSet: boolean;
    savedSettings: boolean;
  };
  card2: {
    extensionName: string;
    isRequired: boolean;
    reviewed: boolean;
  };
  card3: {
    reviewedPolicies: boolean;
    verifiedSystemTables: boolean;
    confirmedAuthenticatedOnly: boolean;
  };
}

const defaultState: ChecklistState = {
  card1: {
    leakedPasswordEnabled: false,
    strongPasswordEnabled: false,
    minLengthSet: false,
    savedSettings: false,
  },
  card2: {
    extensionName: "pg_graphql",
    isRequired: true,
    reviewed: false,
  },
  card3: {
    reviewedPolicies: false,
    verifiedSystemTables: false,
    confirmedAuthenticatedOnly: false,
  },
};

export default function SecurityFixCenter() {
  const [state, setState] = useState<ChecklistState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState;
    } catch {
      return defaultState;
    }
  });

  const [expandedCard, setExpandedCard] = useState<number | null>(1);
  type ScanRow = { date: string; scope: string; status: string; file: string; available?: boolean };
  const [scanHistory, setScanHistory] = useState<Array<ScanRow>>([]);
  const [scanHistoryLoading, setScanHistoryLoading] = useState(true);
  const [scanHistoryError, setScanHistoryError] = useState<string | null>(null);

  const loadScanHistory = useCallback(() => {
    let cancelled = false;
    setScanHistoryLoading(true);
    setScanHistoryError(null);
    fetch("/reports/manifest.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
        return r.json();
      })
      .then(async (data) => {
        if (cancelled) return;
        const scans: ScanRow[] = Array.isArray(data?.scans) ? data.scans : [];
        scans.sort((a, b) => (a.date < b.date ? 1 : -1));
        const checked = await Promise.all(
          scans.map(async (s) => {
            try {
              const head = await fetch(`/reports/${s.file}`, { method: "HEAD" });
              return { ...s, available: head.ok };
            } catch {
              return { ...s, available: false };
            }
          })
        );
        if (!cancelled) setScanHistory(checked);
      })
      .catch((e) => {
        if (!cancelled) {
          setScanHistory([]);
          setScanHistoryError(e?.message || "Failed to load scan history");
        }
      })
      .finally(() => !cancelled && setScanHistoryLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = loadScanHistory();
    return cleanup;
  }, [loadScanHistory]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`, {
      icon: <Copy className="w-4 h-4" />,
    });
  };

  const getCard1Status = () => {
    const { leakedPasswordEnabled, strongPasswordEnabled, minLengthSet, savedSettings } = state.card1;
    const completed = [leakedPasswordEnabled, strongPasswordEnabled, minLengthSet, savedSettings].filter(Boolean).length;
    if (completed === 4) return { status: "verified", color: "bg-emerald-500", text: "Verified" };
    if (completed > 0) return { status: "in-progress", color: "bg-amber-500", text: "In Progress" };
    return { status: "not-verified", color: "bg-red-500", text: "Not Verified" };
  };

  const getCard2Status = () => {
    if (state.card2.reviewed) return { status: "verified", color: "bg-emerald-500", text: "Reviewed" };
    return { status: "not-verified", color: "bg-amber-500", text: "Pending Review" };
  };

  const getCard3Status = () => {
    const { reviewedPolicies, verifiedSystemTables, confirmedAuthenticatedOnly } = state.card3;
    const completed = [reviewedPolicies, verifiedSystemTables, confirmedAuthenticatedOnly].filter(Boolean).length;
    if (completed === 3) return { status: "verified", color: "bg-emerald-500", text: "Verified" };
    if (completed > 0) return { status: "in-progress", color: "bg-amber-500", text: "In Progress" };
    return { status: "not-verified", color: "bg-red-500", text: "Not Verified" };
  };

  const getTotalStatus = () => {
    const card1Complete = getCard1Status().status === "verified";
    const card2Complete = getCard2Status().status === "verified";
    const card3Complete = getCard3Status().status === "verified";
    const total = [card1Complete, card2Complete, card3Complete].filter(Boolean).length;
    return { completed: total, total: 3 };
  };

  const scrollToSection = (cardNum: number) => {
    setExpandedCard(cardNum);
    const element = document.getElementById(`security-card-${cardNum}`);
    element?.scrollIntoView({ behavior: motionScrollBehavior(), block: "start" });
  };

  const resetChecklist = () => {
    setState(defaultState);
    toast.success("Checklist reset to default state");
  };

  // SQL Snippets
  const extensionCheckSQL = `-- Check installed extensions in public schema
SELECT extname, extnamespace::regnamespace as schema
FROM pg_extension
WHERE extnamespace = 'public'::regnamespace;

-- List all extensions
SELECT * FROM pg_extension;`;

  const moveExtensionSQL = `-- Move extension to dedicated schema (requires superuser)
-- Note: This may not be available on managed Supabase instances

-- Create extensions schema if needed
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move specific extension (example for pg_graphql)
-- ALTER EXTENSION pg_graphql SET SCHEMA extensions;

-- For Supabase managed instances, this is typically handled
-- by the platform and cannot be modified by users.`;

  const rlsPolicyCheckSQL = `-- Find all policies with USING (true) or WITH CHECK (true)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE qual = 'true' OR with_check = 'true'
ORDER BY schemaname, tablename;

-- Check which tables have these policies
SELECT DISTINCT tablename 
FROM pg_policies 
WHERE (qual = 'true' OR with_check = 'true')
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE');`;

  const restrictPolicySQL = `-- Example: Replace permissive policy with authenticated-only
-- Replace TABLE_NAME and POLICY_NAME with actual values

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "POLICY_NAME" ON public.TABLE_NAME;

-- Create new policy with authenticated role only
CREATE POLICY "TABLE_NAME_authenticated_insert" 
ON public.TABLE_NAME 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- For system tables that need logging, use:
CREATE POLICY "audit_logs_authenticated_insert"
ON public.admin_auth_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);`;

  const { completed, total } = getTotalStatus();
  const allComplete = completed === total;

  return (
    <NewAdminShell title="Security Fix Center" description="Fix Supabase Security Scan issues before production">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Shield className="w-7 h-7 text-orange-400" />
                Security Fix Center
                <span className="text-orange-400">(0-Warning Mode)</span>
              </h1>
              <p className="text-slate-400">
                Fix Supabase Security Scan issues before production deployment.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-slate-600 text-slate-300 px-3 py-1">
                Current Scan: Manual (User Verified)
              </Badge>
              <Badge 
                className={`px-3 py-1 ${allComplete ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}
              >
                {completed}/{total} Complete
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => scrollToSection(1)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              Run Checklist
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={resetChecklist}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
            >
              <a
                href="/reports/security-scan-report-2026-06-30.pdf"
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download latest security scan PDF report"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Download Latest Scan PDF
              </a>
            </Button>
          </div>
        </div>


        {/* Progress Overview */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Security Checklist Progress</span>
                  <span className="text-sm font-medium text-white">{Math.round((completed / total) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${allComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(completed / total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              {allComplete && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 text-emerald-400"
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span className="font-medium">All Clear!</span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-emerald-400" />
                Security Scan History
              </CardTitle>
              <CardDescription className="text-slate-400">
                Download previously generated security scan PDF reports.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadScanHistory}
              disabled={scanHistoryLoading}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
              aria-label="Refresh scan history"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${scanHistoryLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Date</th>
                    <th className="text-left font-medium px-4 py-2">Scope</th>
                    <th className="text-left font-medium px-4 py-2">Status</th>
                    <th className="text-right font-medium px-4 py-2">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {scanHistoryLoading && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <tr key={`sk-${i}`} className="animate-pulse">
                          <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-700/60 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-3 w-40 bg-slate-700/60 rounded" /></td>
                          <td className="px-4 py-3"><div className="h-5 w-16 bg-slate-700/60 rounded-full" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-3 w-24 bg-slate-700/60 rounded inline-block" /></td>
                        </tr>
                      ))}
                    </>
                  )}
                  {!scanHistoryLoading && scanHistoryError && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-red-400">
                        <div className="flex flex-col items-center gap-2">
                          <span>Failed to load scan history: {scanHistoryError}</span>
                          <button
                            onClick={loadScanHistory}
                            className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!scanHistoryLoading && !scanHistoryError && scanHistory.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No scan reports available yet.</td></tr>
                  )}
                  {!scanHistoryLoading && !scanHistoryError && scanHistory.map((s) => {
                    const href = `/reports/${s.file}`;
                    const available = s.available !== false;
                    return (
                      <tr key={href} className="hover:bg-slate-700/30">
                        <td className="px-4 py-2 font-mono text-xs">{s.date}</td>
                        <td className="px-4 py-2">{s.scope}</td>
                        <td className="px-4 py-2">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {available ? (
                            <a
                              href={href}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
                              aria-label={`Download security scan report ${s.date}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Download PDF
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400/80 text-xs" title="PDF unavailable">
                              Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>



        {/* Card 1 - Leaked Password Protection */}
        <motion.div id="security-card-1" layout>
          <Card className={`bg-slate-800/50 border-slate-700 overflow-hidden transition-all ${expandedCard === 1 ? 'ring-2 ring-orange-500/50' : ''}`}>
            <CardHeader 
              className="cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpandedCard(expandedCard === 1 ? null : 1)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCard1Status().color}/20`}>
                    <Key className={`w-5 h-5 ${getCard1Status().status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Leaked Password Protection Disabled
                      <Badge className={`${getCard1Status().color} text-white text-xs`}>
                        {getCard1Status().text}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Enable Supabase's built-in password security features
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCard === 1 ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedCard === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="border-t border-slate-700 pt-4 space-y-4">
                    {/* Explanation */}
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                          <p className="font-medium text-white mb-1">Why this matters:</p>
                          <p>Supabase can automatically check new passwords against known data breaches using the HaveIBeenPwned database. This prevents users from using compromised passwords.</p>
                          <p className="mt-2 text-slate-400">
                            <strong>Note:</strong> Your app already has application-level protection via <code className="text-orange-400">src/lib/passwordSecurity.ts</code>, but enabling this at the platform level adds defense-in-depth.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-orange-400" />
                        Manual Steps (Supabase Dashboard)
                      </h4>
                      
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step1-1"
                            checked={state.card1.leakedPasswordEnabled}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card1: { ...prev.card1, leakedPasswordEnabled: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step1-1" className="text-slate-300 cursor-pointer flex-1">
                            Go to <span className="text-orange-400">Supabase Dashboard → Authentication → Settings → Password Security</span>
                            <br />
                            <span className="text-sm text-slate-400">Turn ON "Leaked password protection"</span>
                          </Label>
                          <a 
                            href="https://supabase.com/dashboard/project/_/auth/settings" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step1-2"
                            checked={state.card1.strongPasswordEnabled}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card1: { ...prev.card1, strongPasswordEnabled: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step1-2" className="text-slate-300 cursor-pointer flex-1">
                            Turn ON <span className="text-orange-400">"Strong password"</span> or <span className="text-orange-400">"Password strength"</span> setting
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step1-3"
                            checked={state.card1.minLengthSet}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card1: { ...prev.card1, minLengthSet: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step1-3" className="text-slate-300 cursor-pointer flex-1">
                            Set minimum password length to <span className="text-orange-400">10-12 characters</span>
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step1-4"
                            checked={state.card1.savedSettings}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card1: { ...prev.card1, savedSettings: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step1-4" className="text-slate-300 cursor-pointer flex-1">
                            Click <span className="text-emerald-400 font-medium">Save</span> to apply changes
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-sm text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        No SQL required for this fix - it's a dashboard configuration.
                      </p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Card 2 - Extension in Public */}
        <motion.div id="security-card-2" layout>
          <Card className={`bg-slate-800/50 border-slate-700 overflow-hidden transition-all ${expandedCard === 2 ? 'ring-2 ring-orange-500/50' : ''}`}>
            <CardHeader 
              className="cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpandedCard(expandedCard === 2 ? null : 2)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCard2Status().color}/20`}>
                    <Database className={`w-5 h-5 ${getCard2Status().status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Extension in Public Schema
                      <Badge className={`${getCard2Status().color} text-white text-xs`}>
                        {getCard2Status().text}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Review extensions installed in the public schema
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCard === 2 ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedCard === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="border-t border-slate-700 pt-4 space-y-4">
                    {/* Explanation */}
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                          <p className="font-medium text-white mb-1">Why this matters:</p>
                          <p>Some extensions can expose functions in the public schema. While this is often necessary for functionality (like <code className="text-orange-400">pg_graphql</code>), it's important to review which extensions are installed and ensure only required ones are enabled.</p>
                          <p className="mt-2 text-slate-400">
                            <strong>Note:</strong> On Supabase managed instances, <code className="text-orange-400">pg_graphql</code> is installed by default and cannot be moved. This is a platform limitation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Extension Review Form */}
                    <div className="space-y-4 p-4 bg-slate-900/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white">Review Extension</h4>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ext-name" className="text-slate-300">Extension Name</Label>
                          <Input
                            id="ext-name"
                            value={state.card2.extensionName}
                            onChange={(e) => setState(prev => ({
                              ...prev,
                              card2: { ...prev.card2, extensionName: e.target.value }
                            }))}
                            placeholder="e.g., pg_graphql"
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-slate-300">Is this extension required?</Label>
                          <div className="flex items-center gap-3 pt-2">
                            <Switch
                              checked={state.card2.isRequired}
                              onCheckedChange={(checked) => setState(prev => ({
                                ...prev,
                                card2: { ...prev.card2, isRequired: checked }
                              }))}
                            />
                            <span className={`text-sm ${state.card2.isRequired ? 'text-emerald-400' : 'text-red-400'}`}>
                              {state.card2.isRequired ? 'Yes, keep enabled' : 'No, consider disabling'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conditional guidance */}
                      {state.card2.isRequired ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          <p className="text-sm text-emerald-300">
                            <strong>Recommendation:</strong> Keep the extension enabled. Ensure your RLS policies properly protect any exposed functions.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-300">
                            <strong>Recommendation:</strong> Disable the extension if not needed. Run the SQL below to check usage before disabling.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SQL Snippets */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-orange-400" />
                        SQL Helper - Check Extensions
                      </h4>
                      
                      <div className="relative">
                        <Textarea
                          value={extensionCheckSQL}
                          readOnly
                          className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm min-h-[120px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(extensionCheckSQL, "Extension check SQL")}
                          className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy SQL
                        </Button>
                      </div>

                      <div className="relative">
                        <Textarea
                          value={moveExtensionSQL}
                          readOnly
                          className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm min-h-[160px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(moveExtensionSQL, "Move extension SQL")}
                          className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy SQL
                        </Button>
                      </div>
                    </div>

                    {/* Confirmation */}
                    <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                      <Checkbox 
                        id="ext-reviewed"
                        checked={state.card2.reviewed}
                        onCheckedChange={(checked) => setState(prev => ({
                          ...prev,
                          card2: { ...prev.card2, reviewed: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="ext-reviewed" className="text-slate-300 cursor-pointer">
                        I have reviewed the extensions and confirmed this configuration is acceptable for production
                      </Label>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Card 3 - RLS Policy Always True */}
        <motion.div id="security-card-3" layout>
          <Card className={`bg-slate-800/50 border-slate-700 overflow-hidden transition-all ${expandedCard === 3 ? 'ring-2 ring-orange-500/50' : ''}`}>
            <CardHeader 
              className="cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpandedCard(expandedCard === 3 ? null : 3)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCard3Status().color}/20`}>
                    <Lock className={`w-5 h-5 ${getCard3Status().status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      RLS Policy Always True
                      <Badge className={`${getCard3Status().color} text-white text-xs`}>
                        {getCard3Status().text}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Review policies with permissive USING (true) or WITH CHECK (true)
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCard === 3 ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedCard === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="border-t border-slate-700 pt-4 space-y-4">
                    {/* Explanation */}
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-300">
                          <p className="font-medium text-white mb-1">Why this matters:</p>
                          <p>Policies with <code className="text-orange-400">USING (true)</code> or <code className="text-orange-400">WITH CHECK (true)</code> allow unrestricted access for that operation. While sometimes intentional (e.g., for audit logging), they can be a security risk if applied to sensitive data.</p>
                          <p className="mt-2 text-slate-400">
                            <strong>Your current state:</strong> The remaining permissive policies are on system tables (<code className="text-orange-400">admin_account_locks</code>, <code className="text-orange-400">admin_auth_audit_logs</code>) and are scoped to the <code className="text-emerald-400">authenticated</code> role only.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-orange-400" />
                        Verification Checklist
                      </h4>
                      
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step3-1"
                            checked={state.card3.reviewedPolicies}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card3: { ...prev.card3, reviewedPolicies: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step3-1" className="text-slate-300 cursor-pointer flex-1">
                            I have reviewed all policies with <code className="text-orange-400 text-xs">WITH CHECK (true)</code> expressions
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step3-2"
                            checked={state.card3.verifiedSystemTables}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card3: { ...prev.card3, verifiedSystemTables: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step3-2" className="text-slate-300 cursor-pointer flex-1">
                            I confirm these policies are only on <span className="text-emerald-400">system/audit tables</span> (not user data)
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg">
                          <Checkbox 
                            id="step3-3"
                            checked={state.card3.confirmedAuthenticatedOnly}
                            onCheckedChange={(checked) => setState(prev => ({
                              ...prev,
                              card3: { ...prev.card3, confirmedAuthenticatedOnly: checked as boolean }
                            }))}
                          />
                          <Label htmlFor="step3-3" className="text-slate-300 cursor-pointer flex-1">
                            I confirm these policies are scoped to <code className="text-emerald-400 text-xs">authenticated</code> role only (not <code className="text-red-400 text-xs">public</code>)
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* SQL Snippets */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-orange-400" />
                        SQL Helper - Find Permissive Policies
                      </h4>
                      
                      <div className="relative">
                        <Textarea
                          value={rlsPolicyCheckSQL}
                          readOnly
                          className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm min-h-[180px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(rlsPolicyCheckSQL, "RLS policy check SQL")}
                          className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy SQL
                        </Button>
                      </div>

                      <h4 className="text-sm font-medium text-white flex items-center gap-2 mt-4">
                        <Lock className="w-4 h-4 text-orange-400" />
                        SQL Helper - Restrict Policy (Template)
                      </h4>

                      <div className="relative">
                        <Textarea
                          value={restrictPolicySQL}
                          readOnly
                          className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm min-h-[200px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(restrictPolicySQL, "Restrict policy SQL template")}
                          className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy SQL
                        </Button>
                      </div>
                    </div>

                    {/* Current Status Info */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-sm text-emerald-300 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Current Status:</strong> Your remaining <code className="text-xs bg-slate-800 px-1 rounded">WITH CHECK (true)</code> policies are on <code className="text-xs bg-slate-800 px-1 rounded">admin_account_locks</code> and <code className="text-xs bg-slate-800 px-1 rounded">admin_auth_audit_logs</code> tables, scoped to authenticated users only. This is acceptable for audit/logging purposes.
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Completion Status */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400">Security Checklist Complete!</h3>
                    <p className="text-slate-300 text-sm">
                      All security warnings have been addressed. Your application is ready for production deployment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </NewAdminShell>
  );
}
