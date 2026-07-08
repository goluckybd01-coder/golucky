import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Wallet, Check, Trash2, Plus, Sparkles, Shield, CreditCard, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GlassCard from "@/components/auth/GlassCard";
import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";

const PremiumHolographicShine = () => (
  <motion.div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" initial={{ x: "-200%" }} animate={{ x: "200%" }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }} />
  </motion.div>
);

const FloatingParticle = (_props: any) => null;

const GlowingOrb = ({ className, color, delay = 0 }: { className?: string; color: string; delay?: number }) => (
  <motion.div className={`absolute rounded-full blur-3xl ${className}`} style={{ background: color }} animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }} transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }} />
);

interface WithdrawalAccount {
  id: string; account_type: string; account_name: string; account_number: string;
  is_verified: boolean; is_default: boolean; is_locked?: boolean; created_at?: string; updated_at?: string;
}

const METHOD_OPTIONS = ["all", "bkash", "nagad", "rocket", "upay"] as const;
const STATUS_OPTIONS = [
  { value: "all", label: "All" }, { value: "locked", label: "Locked" },
  { value: "verified", label: "Verified" }, { value: "default", label: "Default" },
] as const;
const SORT_OPTIONS = [
  { value: "locked_desc", label: "Locked ↓ (newest)" }, { value: "locked_asc", label: "Locked ↑ (oldest)" },
  { value: "updated_desc", label: "Updated ↓ (newest)" }, { value: "updated_asc", label: "Updated ↑ (oldest)" },
  { value: "address_asc", label: "Address A–Z" }, { value: "address_desc", label: "Address Z–A" },
] as const;
type SortKey = typeof SORT_OPTIONS[number]["value"];
const DEFAULT_SORT: SortKey = "locked_desc";
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value) as readonly SortKey[];
const parseSort = (v: string | null): SortKey => v && (SORT_VALUES as readonly string[]).includes(v) ? (v as SortKey) : DEFAULT_SORT;

const WithdrawAccounts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<WithdrawalAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [methodFilter, setMethodFilter] = useState<string>(searchParams.get("method") ?? "all");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all");
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get("from") ?? "");
  const [dateTo, setDateTo] = useState<string>(searchParams.get("to") ?? "");
  const [sort, setSort] = useState<SortKey>(parseSort(searchParams.get("sort")));
  const parsePage = (v: string | null) => { const n = parseInt(v ?? "1", 10); return Number.isFinite(n) && n > 0 ? n : 1; };
  const [page, setPage] = useState<number>(parsePage(searchParams.get("page")));
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const isInitialPageRef = useRef(true);

  useEffect(() => {
    if (isInitialPageRef.current) { isInitialPageRef.current = false; return; }
    const el = resultsRef.current; if (!el) return;
    el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (search) next.set("q", search);
      if (methodFilter !== "all") next.set("method", methodFilter);
      if (statusFilter !== "all") next.set("status", statusFilter);
      if (dateFrom) next.set("from", dateFrom);
      if (dateTo) next.set("to", dateTo);
      if (sort !== DEFAULT_SORT) next.set("sort", sort);
      if (page > 1) next.set("page", String(page));
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, methodFilter, statusFilter, dateFrom, dateTo, sort, page, setSearchParams]);

  useEffect(() => {
    setSort((prev) => (prev === parseSort(searchParams.get("sort")) ? prev : parseSort(searchParams.get("sort"))));
    setPage((prev) => (prev === parsePage(searchParams.get("page")) ? prev : parsePage(searchParams.get("page"))));
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [search, methodFilter, statusFilter, dateFrom, dateTo, sort]);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("user_withdrawal_accounts").select("*").eq("user_id", user.id).neq("account_type", "usdt").order("is_default", { ascending: false });
      if (error) throw error;
      setAccounts(data || []);
      const defaultAccount = data?.find(a => a.is_default);
      if (defaultAccount) setSelectedId(defaultAccount.id);
      else if (data && data.length > 0) setSelectedId(data[0].id);
    } catch (error) { console.error("Error fetching accounts:", error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSelect = async (accountId: string) => {
    setSelectedId(accountId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_withdrawal_accounts").update({ is_default: false }).eq("user_id", user.id);
      await supabase.from("user_withdrawal_accounts").update({ is_default: true }).eq("id", accountId);
      toast.success("Account selected successfully!");
      navigate(-1);
    } catch (error) { console.error("Error selecting account:", error); }
  };

  const handleDelete = async (accountId: string) => {
    setDeletingId(accountId);
    try {
      const { error } = await supabase.from("user_withdrawal_accounts").delete().eq("id", accountId);
      if (error) throw error;
      toast.success("Account deleted");
      fetchAccounts();
    } catch (error) { console.error("Error deleting account:", error); toast.error("Failed to delete account"); }
    finally { setDeletingId(null); }
  };

  const getAccountGradient = (type: string) => ({ nagad: "from-orange-500/30 to-red-500/30", bkash: "from-pink-500/30 to-rose-500/30", rocket: "from-purple-500/30 to-violet-500/30", upay: "from-green-500/30 to-emerald-500/30" }[type] || "from-gray-500/30 to-slate-500/30");
  const getAccountColor = (type: string) => ({ nagad: "text-orange-400", bkash: "text-pink-400", rocket: "text-purple-400", upay: "text-green-400" }[type] || "text-gray-400");
  const getAccountLogo = (type: string) => ({ nagad: nagadLogo, bkash: bkashLogo }[type.toLowerCase()] || null);
  const getAccountBorderColor = (type: string) => ({ nagad: "border-orange-500/50", bkash: "border-pink-500/50", rocket: "border-purple-500/50", upay: "border-green-500/50" }[type] || "border-gray-500/50");
  const maskNumber = (number: string) => number.length <= 4 ? number : number.slice(0, 3) + "****" + number.slice(-3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">{[...Array(12)].map((_, i) => <FloatingParticle key={i} delay={i * 0.5} size={Math.random() * 12 + 6} left={`${Math.random() * 100}%`} duration={Math.random() * 8 + 12} />)}</div>
      <GlowingOrb className="w-[400px] h-[400px] -top-48 -right-48" color="radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)" delay={0} />
      <GlowingOrb className="w-64 h-64 top-1/3 -left-32" color="radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" delay={1} />
      <GlowingOrb className="w-80 h-80 bottom-32 right-0" color="radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)" delay={2} />
      <motion.div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center justify-between px-4 py-4">
          <motion.button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ChevronLeft size={22} className="text-white" /></motion.button>
          <motion.span className="font-bold text-lg text-white flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CreditCard className="text-cyan-400" size={20} />Payment Methods</motion.span>
          <motion.button onClick={() => navigate("/withdraw")} className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Plus size={20} className="text-white" /></motion.button>
        </div>
      </motion.div>
      <div className="p-4">
        {isLoading ? (
          <GlassCard className="p-8"><div className="flex flex-col items-center"><motion.div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /><p className="text-white/50 mt-4">Loading accounts...</p></div></GlassCard>
        ) : accounts.length === 0 ? (
          <GlassCard className="p-8"><div className="text-center"><motion.div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}><Wallet className="text-cyan-400" size={40} /></motion.div><h3 className="text-white font-bold text-lg mb-2">No Accounts Yet</h3><p className="text-white/50 mb-6">Add a withdrawal account to get started</p><motion.button onClick={() => navigate("/withdraw")} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus size={18} className="inline mr-2" />Add Account</motion.button></div></GlassCard>
        ) : (
          <div className="space-y-3">
            <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Sparkles size={16} className="text-cyan-400" /><span className="text-white/70 text-sm">Select your preferred withdrawal account</span></motion.div>
            <GlassCard className="p-3 space-y-3">
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number" className="w-full pl-9 pr-9 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50" />{search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white" aria-label="Clear search"><X size={14} /></button>}</div>
              <div className="grid grid-cols-2 gap-2">
                <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" aria-label="Filter by method">{METHOD_OPTIONS.map((m) => <option key={m} value={m} className="bg-slate-900">{m === "all" ? "All methods" : m.toUpperCase()}</option>)}</select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" aria-label="Filter by status">{STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value} className="bg-slate-900">{s.label}</option>)}</select>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" aria-label="From date" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" aria-label="To date" />
                <select value={sort} onChange={(e) => setSort(parseSort(e.target.value))} className="col-span-2 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" aria-label="Sort by">{SORT_OPTIONS.map((s) => <option key={s.value} value={s.value} className="bg-slate-900">Sort: {s.label}</option>)}</select>
                {sort !== DEFAULT_SORT && <button type="button" onClick={() => setSort(DEFAULT_SORT)} className="col-span-2 px-2 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40" aria-label="Reset sort to default">Reset sort</button>}
              </div>
              {(search || methodFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo || sort !== DEFAULT_SORT) && <button onClick={() => { setSearch(""); setMethodFilter("all"); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setSort(DEFAULT_SORT); }} className="text-xs text-cyan-400 hover:text-cyan-300">Clear filters</button>}
            </GlassCard>
            <div ref={resultsRef} tabIndex={-1} aria-label="Withdrawal accounts results" className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded-2xl">
            {(() => {
              const q = search.trim().toLowerCase();
              const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
              const toTs = dateTo ? new Date(dateTo).getTime() + 86400000 : null;
              const filtered = accounts.filter((a) => {
                if (methodFilter !== "all" && a.account_type?.toLowerCase() !== methodFilter) return false;
                if (statusFilter === "locked" && !a.is_locked) return false;
                if (statusFilter === "verified" && !a.is_verified) return false;
                if (statusFilter === "default" && !a.is_default) return false;
                if (q && !(`${a.account_name ?? ""} ${a.account_number ?? ""}`.toLowerCase().includes(q))) return false;
                if (a.created_at) { const t = new Date(a.created_at).getTime(); if (fromTs !== null && t < fromTs) return false; if (toTs !== null && t >= toTs) return false; }
                return true;
              });
              const ts = (v?: string | null) => { if (!v) return null; const n = new Date(v).getTime(); return Number.isFinite(n) ? n : null; };
              const addr = (a: WithdrawalAccount) => (a.account_number ?? "");
              const tie = (a: WithdrawalAccount, b: WithdrawalAccount) => addr(a).localeCompare(addr(b)) || a.id.localeCompare(b.id);
              const cmpTs = (a: WithdrawalAccount, b: WithdrawalAccount, key: "created_at" | "updated_at", dir: 1 | -1) => {
                const av = ts(a[key]); const bv = ts(b[key]);
                if (av === null && bv === null) return tie(a, b); if (av === null) return 1; if (bv === null) return -1;
                return (dir === 1 ? av - bv : bv - av) || tie(a, b);
              };
              filtered.sort((a, b) => {
                switch (sort) {
                  case "locked_asc": return cmpTs(a, b, "created_at", 1);
                  case "locked_desc": return cmpTs(a, b, "created_at", -1);
                  case "updated_asc": return cmpTs(a, b, "updated_at", 1);
                  case "updated_desc": return cmpTs(a, b, "updated_at", -1);
                  case "address_asc": return addr(a).localeCompare(addr(b)) || a.id.localeCompare(b.id);
                  case "address_desc": return addr(b).localeCompare(addr(a)) || a.id.localeCompare(b.id);
                  default: return 0;
                }
              });
              if (filtered.length === 0) return <GlassCard className="p-6 text-center text-white/60 text-sm">No accounts match your filters.</GlassCard>;
              const PAGE_SIZE = 10; const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const pageSafe = Math.min(Math.max(1, page), totalPages);
              const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
              return (<><AnimatePresence>{pageItems.map((account, index) => (
                <motion.div key={account.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -100, scale: 0.9 }} transition={{ delay: index * 0.05, type: "spring" }} layout>
                  <GlassCard className="p-0 overflow-hidden">
                    <motion.div className={`relative p-4 cursor-pointer transition-all ${selectedId === account.id ? `bg-gradient-to-br ${getAccountGradient(account.account_type)} border-2 ${getAccountBorderColor(account.account_type)}` : "hover:bg-white/5"}`} onClick={() => handleSelect(account.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      {selectedId === account.id && <PremiumHolographicShine />}
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <motion.div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-white/20 shadow-lg overflow-hidden p-2" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }} transition={{ duration: 0.4 }}>
                            {getAccountLogo(account.account_type) ? <img src={getAccountLogo(account.account_type)!} alt={account.account_type} className="w-full h-full object-contain" /> : <Wallet className={getAccountColor(account.account_type)} size={32} />}
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2"><p className="font-bold text-white uppercase text-lg">{account.account_type}</p>{account.is_verified && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Shield size={10} className="text-emerald-400" /></motion.div>}</div>
                            <p className="text-white/70 text-sm">{account.account_name}</p>
                            <p className="text-white/50 text-sm font-mono">{maskNumber(account.account_number)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <AnimatePresence>{selectedId === account.id && <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"><Check className="text-white" size={20} /></motion.div>}</AnimatePresence>
                          <motion.button onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={deletingId === account.id}>
                            {deletingId === account.id ? <motion.div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} /> : <Trash2 size={18} />}
                          </motion.button>
                        </div>
                      </div>
                      <motion.div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${account.is_default ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-white/30"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{account.is_default ? "Default" : "Saved"}</motion.div>
                    </motion.div>
                  </GlassCard>
                </motion.div>
              ))}</AnimatePresence>
              {totalPages > 1 && <nav className="flex items-center justify-between gap-3 pt-2" role="navigation" aria-label="Withdrawal accounts pagination">
                <button type="button" onClick={() => setPage(Math.max(1, pageSafe - 1))} disabled={pageSafe <= 1} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                <span className="text-xs text-white/60" aria-live="polite" aria-atomic="true">Page {pageSafe} of {totalPages} · {filtered.length} results</span>
                <button type="button" onClick={() => setPage(Math.min(totalPages, pageSafe + 1))} disabled={pageSafe >= totalPages} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </nav>}</>);
            })()}
            </div>
          </div>
        )}
      </div>
      {accounts.length > 0 && (
        <motion.div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-slate-900/90 border-t border-white/10 p-4" initial={{ y: 100 }} animate={{ y: 0 }}>
          <motion.button onClick={() => navigate("/withdraw")} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Plus size={20} />Add New Account</motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default WithdrawAccounts;
