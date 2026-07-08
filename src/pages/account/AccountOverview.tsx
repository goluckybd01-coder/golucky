import { useEffect, useRef, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";

const ACCOUNT_TABS = ["overview", "referrals", "vip", "security", "settings"] as const;
import {
  Gift, Bell, Crown, BadgeCheck, Sparkles, Copy, Calendar, ShieldCheck,
  Wallet as WalletIcon, Coins, ArrowDownToLine, ArrowUpFromLine, ChevronRight,
  User as UserIcon, Shield, FileCheck, KeyRound, FileText, BellRing, Headphones,
  Settings as SettingsIcon, LogOut, ArrowLeftRight, Users as UsersIcon,
  BarChart3, Clock, Camera, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWalletDB } from "@/hooks/useWalletDB";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";
import vipShield from "@/assets/account/vip-shield-8.png";
import agentShield from "@/assets/account/agent-shield-g.png";
import { getMemberSince } from "@/lib/memberSince";
// AccountOverview removed — legacy profile UI replaced by ProfileCommandCenter
import ProfileCommandCenter from "@/pages/account/ProfileCommandCenter";
import AvatarCropModal from "@/pages/account/AvatarCropModal";
import BannerCropModal, { encodeBannerFraming } from "@/pages/account/BannerCropModal";

const bdt = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type ProfileData = {
  full_name: string;
  username: string;
  user_id_code: string;
  agent_id_code: string;
  referral_code: string;
  member_since: string;
  kyc_level: number;
  status: "Active" | "Pending" | "Banned";
  agent_status: "approved" | "pending" | "rejected" | null;
  avatar_url: string | null;
  hero_banner_url: string | null;
  vip_level: number;
  vip_exp: number;
  is_admin?: boolean;
  is_super_admin?: boolean;
};

export default function Account() {
  const nav = useNavigate();
  const { tab: tabParam = "settings" } = useParams<{ tab?: string }>();
  const isValidTab = (ACCOUNT_TABS as readonly string[]).includes(tabParam);
  const activeTab = isValidTab ? tabParam : "settings";
  const { balance } = useWalletDB();
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: "",
    user_id_code: "—",
    agent_id_code: "—",
    referral_code: "—",
    member_since: getMemberSince({ displayUserId: null, createdAt: null }),
    kyc_level: 0,
    status: "Active",
    agent_status: null,
    avatar_url: null,
    hero_banner_url: null,
    vip_level: 0,
    vip_exp: 0,
  });
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
    commissionRate: 20,
    teamMembers: 0,
    totalCommission: 0,
    giftCount: 0,
    bellCount: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [bannerCropFile, setBannerCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  type Referral = { id: string; display_user_id: string; username: string | null; created_at: string; total_deposit_volume: number; is_active: boolean };
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  // VIP thresholds (exp required to reach each level)
  const VIP_THRESHOLDS = [0, 1_000, 5_000, 20_000, 50_000, 150_000, 300_000, 600_000, 1_000_000, 2_000_000, 5_000_000];
  const VIP_NAMES = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Royal", "Master", "Legend", "Mythic"];
  const vipLevel = Math.max(0, Math.min(10, profile.vip_level || 0));
  const vipName = VIP_NAMES[vipLevel];
  const nextLevel = Math.min(10, vipLevel + 1);
  const curT = VIP_THRESHOLDS[vipLevel];
  const nextT = VIP_THRESHOLDS[nextLevel];
  const vipProgress = nextT > curT
    ? Math.max(0, Math.min(100, Math.round(((Number(profile.vip_exp) - curT) / (nextT - curT)) * 100)))
    : 100;

  const loadAccount = async (signal?: { cancelled: boolean }): Promise<boolean> => {
    const cancelled = () => signal?.cancelled === true;
    // Prevent duplicate concurrent fetches (e.g. Retry tapped repeatedly)
    if (loadingRef.current) return false;
    loadingRef.current = true;
    // Show full skeleton only on first load; subsequent loads keep last data visible
    if (hasLoadedOnceRef.current) setIsRefreshing(true);
    else setIsLoading(true);
    let ok = false;
    try {
        const { data: u, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw new Error("Unable to verify your session. Please sign in again.");
        if (!u?.user) {
          nav("/auth");
          return;
        }
        setUserId(u.user.id);
        const [{ data: p, error: pErr }, { data: w, error: wErr }, { data: roles }] = await Promise.all([
          supabase
            .from("profiles")
            .select("username,avatar_url,hero_banner_url,agent_status,created_at,vip_level,vip_exp,display_user_id,display_referral_id,agent_display_id,is_suspended,is_frozen")
            .eq("id", u.user.id)
            .maybeSingle(),
          supabase
            .from("wallets")
            .select("balance,total_deposit,total_withdraw,total_bet,total_win,total_commission_earned")
            .eq("user_id", u.user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", u.user.id),
        ]);
        if (pErr) throw new Error("Could not load your profile information.");
        if (wErr) throw new Error("Could not load your wallet information.");
        const rolesList = (roles as Array<{ role: string }> | null) || [];
        const isSuperAdmin = rolesList.some((r) => r.role === "super_admin");
        const isAdmin = isSuperAdmin || rolesList.some((r) => r.role === "admin");
        if (!cancelled()) {
          if (p) {
            const status: ProfileData["status"] =
              (p as any).is_suspended || (p as any).is_frozen ? "Banned" : "Active";
            setProfile((prev) => ({
              ...prev,
              full_name: (p as any).username || prev.full_name,
              username: (p as any).username || prev.username,
              avatar_url: (p as any).avatar_url ?? null,
              hero_banner_url: (p as any).hero_banner_url ?? null,
              agent_status: (p as any).agent_status ?? prev.agent_status,
              user_id_code: (p as any).display_user_id || prev.user_id_code,
              agent_id_code: (p as any).agent_display_id || "—",
              referral_code: (p as any).display_referral_id || "—",
              vip_level: Number((p as any).vip_level ?? 0),
              vip_exp: Number((p as any).vip_exp ?? 0),
              kyc_level: (p as any).agent_status === "approved" ? 2 : 0,
              status,
              is_admin: isAdmin,
              is_super_admin: isSuperAdmin,
              member_since: getMemberSince({
                displayUserId: (p as any).display_user_id,
                createdAt: (p as any).created_at,
              }),
            }));
          }
          if (w) {
            const dep = Number((w as any).total_deposit ?? 0);
            const wd = Number((w as any).total_withdraw ?? 0);
            const win = Number((w as any).total_win ?? 0);
            const bet = Number((w as any).total_bet ?? 0);
            const commission = Number((w as any).total_commission_earned ?? 0);
            setStats((prev) => ({
              ...prev,
              totalDeposit: dep,
              totalWithdraw: wd,
              totalEarnings: Math.max(0, win - bet) + commission,
              totalCommission: commission,
            }));
          }
        }
        ok = true;
        if (!cancelled()) setLoadError(null);
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err ?? "");
        const isNetwork = /Failed to fetch|NetworkError|network|ECONN|timeout/i.test(raw) || !navigator.onLine;
        const friendly = !navigator.onLine
          ? "You're offline. Check your internet connection and try again."
          : isNetwork
          ? "We couldn't reach our servers. Please check your connection and retry."
          : raw || "Something went wrong while loading your account.";
        if (!cancelled()) {
          setLoadError(friendly);
          toast.error("Failed to load account", {
            id: "account-load-error",
            description: friendly,
            action: {
              label: loadingRef.current ? "Retrying…" : "Retry",
              onClick: () => {
                if (loadingRef.current) return;
                toast.loading("Retrying…", {
                  id: "account-load-error",
                  description: "Fetching your profile and wallet.",
                });
                void loadAccount();
              },
            },
          });
        }
      } finally {
        loadingRef.current = false;
        if (!cancelled()) {
          setIsLoading(false);
          setIsRefreshing(false);
          if (ok) hasLoadedOnceRef.current = true;
          if (ok) toast.dismiss("account-load-error");
        }
      }
      return ok;
  };


  useEffect(() => {
    const signal = { cancelled: false };
    void loadAccount(signal);
    return () => { signal.cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  // Recover automatically when the browser comes back online
  useEffect(() => {
    const onOnline = () => {
      toast.success("Back online — refreshing your account.");
      void loadAccount();
    };
    const onOffline = () => {
      toast.error("You're offline", { description: "Some data may be out of date." });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const copy = async (val: string, label: string) => {
    try { await navigator.clipboard.writeText(val); toast.success(`${label} copied`); } catch {}
  };

  const logout = async () => { await supabase.auth.signOut(); nav("/auth"); };

  const isAgent = profile.agent_status === "approved";

  // --- Avatar upload (private bucket -> signed URL stored on profile) ---
  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setCropFile(file);
  };

  const uploadAvatarFile = async (file: File) => {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) throw sErr || new Error("Could not create signed URL");
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: signed.signedUrl } as any)
        .eq("id", userId);
      if (updErr) throw updErr;
      setProfile((p) => ({ ...p, avatar_url: signed.signedUrl }));
      toast.success("Profile photo updated");
      setCropFile(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Hero banner: pick → open crop modal → upload with per-device framing ---
  const handleBannerPick = () => bannerInputRef.current?.click();
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Banner must be under 8MB"); return; }
    setBannerCropFile(file);
  };
  const uploadBannerFile = async (
    file: File,
    mobile: { x: number; y: number },
    desktop: { x: number; y: number },
    zoom: number,
  ) => {
    if (!userId) return;
    setUploadingBanner(true);
    try {
      const path = `${userId}/banner-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) throw sErr || new Error("Could not create signed URL");
      const framedUrl = encodeBannerFraming(signed.signedUrl, mobile, desktop, zoom);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ hero_banner_url: framedUrl } as any)
        .eq("id", userId);
      if (updErr) throw updErr;
      setProfile((p) => ({ ...p, hero_banner_url: framedUrl }));
      toast.success("Banner photo updated");
      setBannerCropFile(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };


  // --- Agent referrals: load team list + count ---
  useEffect(() => {
    if (!userId || !isAgent) { setReferrals([]); return; }
    let cancelled = false;
    setReferralsLoading(true);
    (async () => {
      try {
        const { data, count } = await supabase
          .from("agent_referrals")
          .select("id, referred_user_id, created_at, total_deposit_volume, is_active", { count: "exact" })
          .eq("agent_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(8);
        const rows = (data || []) as Array<any>;
        const ids = rows.map((r) => r.referred_user_id).filter(Boolean);
        const nameMap = new Map<string, { display_user_id: string; username: string | null }>();
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, display_user_id, username")
            .in("id", ids);
          (profs || []).forEach((p: any) => nameMap.set(p.id, { display_user_id: p.display_user_id, username: p.username }));
        }
        if (cancelled) return;
        setReferrals(
          rows.map((r) => ({
            id: r.id,
            display_user_id: nameMap.get(r.referred_user_id)?.display_user_id || "—",
            username: nameMap.get(r.referred_user_id)?.username ?? null,
            created_at: r.created_at,
            total_deposit_volume: Number(r.total_deposit_volume || 0),
            is_active: !!r.is_active,
          }))
        );
        setStats((prev) => ({ ...prev, teamMembers: count ?? rows.length }));
      } catch {
        if (!cancelled) {
          setReferrals([]);
          toast.error("Couldn't load your team", {
            id: "referrals-load-error",
            description: "We'll retry the next time you visit this page.",
          });
        }

      } finally {
        if (!cancelled) setReferralsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, isAgent]);

  // ===== Pull-to-refresh (mobile) =====
  const PTR_THRESHOLD = 70;
  const PTR_MAX = 110;
  const ptrStartY = useRef<number | null>(null);
  const [ptrPull, setPtrPull] = useState(0);
  const onPtrStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || loadingRef.current) return;
    ptrStartY.current = e.touches[0].clientY;
  };
  const onPtrMove = (e: React.TouchEvent) => {
    if (ptrStartY.current == null) return;
    const dy = e.touches[0].clientY - ptrStartY.current;
    if (dy <= 0) { setPtrPull(0); return; }
    setPtrPull(Math.min(PTR_MAX, dy * 0.5));
  };
  const refreshingRef = useRef(false);
  const runRefresh = () => {
    if (refreshingRef.current || loadingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    toast.loading("Refreshing account…", {
      id: "ptr-refresh",
      description: "Reloading your latest data from the server.",
    });
    void (async () => {
      let timedOut = false;
      const TIMEOUT_MS = 12000;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        toast.error("Refresh timed out", {
          id: "ptr-refresh",
          description: "The server took too long to respond. Please try again.",
          duration: 6000,
          action: {
            label: "Retry",
            onClick: () => {
              if (refreshingRef.current) return;
              runRefresh();
            },
          },
        });
      }, TIMEOUT_MS);
      try {
        const ok = await loadAccount();
        if (timedOut) return;
        if (ok) {
          toast.success("Account refreshed", {
            id: "ptr-refresh",
            description: "Your latest account data is now loaded.",
            duration: 1800,
          });
          return;
        }
        toast.error("Refresh failed", {
          id: "ptr-refresh",
          description: navigator.onLine
            ? "Could not reload account data. Please try again."
            : "You appear to be offline. Reconnect and try again.",
          duration: 6000,
          action: {
            label: "Retry",
            onClick: () => {
              if (refreshingRef.current) return;
              runRefresh();
            },
          },
        });
      } finally {
        window.clearTimeout(timeoutId);
        refreshingRef.current = false;
        setIsRefreshing(false);
      }
    })();
  };
  const onPtrEnd = () => {
    if (ptrStartY.current == null) return;
    const triggered = ptrPull >= PTR_THRESHOLD;
    ptrStartY.current = null;
    setPtrPull(0);
    if (triggered) runRefresh();
  };

  if (!isValidTab) return <Navigate to="/account/settings" replace />;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden pb-28"
      style={{ background: "#000" }}
      onTouchStart={onPtrStart}
      onTouchMove={onPtrMove}
      onTouchEnd={onPtrEnd}
      onTouchCancel={onPtrEnd}
    >
      {(ptrPull > 0 || isRefreshing) && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-2 z-40 -translate-x-1/2"
          style={{ transform: `translate(-50%, ${Math.max(0, ptrPull - 24)}px)` }}
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/70 px-3 py-1.5 text-xs font-bold text-amber-200 backdrop-blur">
            <Loader2 className={`h-3.5 w-3.5 ${isRefreshing || ptrPull >= PTR_THRESHOLD ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing…" : ptrPull >= PTR_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      )}
      {/* Floating premium particles removed — performance cleanup (Profile Ultra Premium Pro Max Phase 1).
          Keep only VIP ring rotation, progress ring, button hover glow, card hover, page transitions. */}

      <div className="relative z-10">

      {/* ===== Tab Navigation ===== */}
      <nav aria-label="Account sections" className="mx-auto w-full max-w-[1280px] px-3 pt-3">
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex gap-1.5 overflow-x-auto rounded-2xl border border-amber-300/20 bg-black/50 p-1.5 backdrop-blur no-scrollbar"
        >
          {(() => {
            const tabs = [
              { id: "overview", label: "Overview" },
              { id: "referrals", label: "Referrals" },
              { id: "vip", label: "VIP" },
              { id: "security", label: "Security" },
              { id: "settings", label: "Settings" },
            ] as const;
            const toHref = (id: string) => (id === "overview" ? "/account" : `/account/${id}`);
            const onKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, idx: number) => {
              let next = idx;
              if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
              else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = tabs.length - 1;
              else return;
              e.preventDefault();
              nav(toHref(tabs[next].id));
              const el = document.getElementById(`account-tab-${tabs[next].id}`);
              el?.focus();
            };
            return tabs.map((t, idx) => {
              const isActive = activeTab === t.id;
              return (
                <NavLink
                  key={t.id}
                  id={`account-tab-${t.id}`}
                  to={toHref(t.id)}
                  end={t.id === "overview"}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`account-panel-mobile-${t.id} account-panel-desktop-${t.id}`}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => onKeyDown(e, idx)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isActive
                      ? "bg-gradient-to-b from-amber-300 to-amber-500 text-black shadow-[0_4px_16px_rgba(255,193,7,0.35)]"
                      : "text-amber-100/70 hover:text-amber-100 hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </NavLink>
              );
            });
          })()}
        </div>
      </nav>


      {loadError && (
        <div className="mx-auto w-full max-w-[1280px] px-3 pt-3">
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100 backdrop-blur"
          >
            <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-300">!</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">Connection problem</div>
              <div className="mt-0.5 text-rose-200/80">{loadError}</div>
            </div>
            <button
              type="button"
              onClick={() => { if (!loadingRef.current) void loadAccount(); }}
              disabled={isRefreshing}
              className="rounded-full border border-rose-300/40 bg-rose-500/20 px-3 py-1 text-xs font-extrabold text-rose-50 hover:bg-rose-500/30 disabled:opacity-60"
            >
              {isRefreshing ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      )}


      {/* ===================== MOBILE / TABLET (<lg) ===================== */}
      <div
        id={`account-panel-mobile-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`account-tab-${activeTab}`}
        tabIndex={0}
        className="mx-auto w-full max-w-[430px] px-3 pt-3 space-y-3 lg:hidden focus-visible:outline-none"
      >
        {isLoading ? (
          <MobileSkeleton />
        ) : (
          <ProfileCommandCenter profile={profile} onCopy={copy} />
        )}
      </div>

      {/* ===================== DESKTOP (lg+) ===================== */}
      <div
        id={`account-panel-desktop-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`account-tab-${activeTab}`}
        tabIndex={0}
        className="hidden lg:block focus-visible:outline-none"
      >
        <div className="mx-auto w-full max-w-[560px] px-4 py-6 space-y-6">
          {isLoading ? (
            <DesktopSkeleton />
          ) : (
            <ProfileCommandCenter profile={profile} onCopy={copy} />
          )}
        </div>
      </div>
      </div>
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          uploading={uploadingAvatar}
          onCancel={() => setCropFile(null)}
          onConfirm={uploadAvatarFile}
        />
      )}
      {bannerCropFile && (
        <BannerCropModal
          file={bannerCropFile}
          uploading={uploadingBanner}
          onCancel={() => setBannerCropFile(null)}
          onConfirm={({ file, mobile, desktop, zoom }) => uploadBannerFile(file, mobile, desktop, zoom)}
        />
      )}
    </div>
  );

}

/* ============ Referred users card ============ */

function ReferralsCard({
  referrals,
  loading,
  total,
  onViewAll,
}: {
  referrals: Array<{ id: string; display_user_id: string; username: string | null; created_at: string; total_deposit_volume: number; is_active: boolean }>;
  loading: boolean;
  total: number;
  onViewAll: () => void;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-amber-400/25 p-3 lg:p-5"
      style={{ background: "radial-gradient(120% 80% at 100% 0%, rgba(245,197,66,.18), transparent 60%), linear-gradient(180deg,#120A02 0%,#000 100%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 lg:h-8 lg:w-8 place-items-center rounded-lg bg-amber-400/15 text-amber-300">
            <UsersIcon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[14px] lg:text-base font-extrabold text-amber-300">Your Referred Users</div>
            <div className="text-[10px] lg:text-[11px] text-amber-100/60">{total} total members</div>
          </div>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-0.5 text-[11px] lg:text-xs font-bold text-amber-300 hover:text-amber-200">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/5">
        <div className="grid grid-cols-[1fr_90px_90px_60px] gap-2 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white/55">
          <span>User</span>
          <span className="text-right">Joined</span>
          <span className="text-right">Deposits</span>
          <span className="text-right">Status</span>
        </div>
        {loading ? (
          <div className="space-y-1 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-white/55">
            No referred users yet. Share your referral code to build your team.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {referrals.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_90px_90px_60px] items-center gap-2 px-3 py-2 text-[12px]">
                <div className="min-w-0">
                  <div className="truncate font-bold text-white">{r.username || r.display_user_id}</div>
                  <div className="truncate text-[10px] text-white/45">{r.display_user_id}</div>
                </div>
                <div className="text-right text-[11px] text-white/70 tabular-nums">
                  {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
                <div className="text-right font-extrabold text-amber-300 tabular-nums">৳ {fmt(r.total_deposit_volume)}</div>
                <div className="text-right">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[9px] font-extrabold ${
                      r.is_active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-white/40"
                    }`}
                  >
                    {r.is_active ? "Active" : "Idle"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ skeleton components ============ */

function SkeletonBlock({ width = "100%", height = "16px", rounded = "rounded-lg" }: { width?: string; height?: string; rounded?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/10 ${rounded}`}
      style={{ width, height }}
    />
  );
}

function SkeletonCircle({ size = 48 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-white/10"
      style={{ width: size, height: size }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] p-3">
      <div className="flex items-start justify-between">
        <SkeletonCircle size={36} />
        <SkeletonBlock width="16px" height="16px" rounded="rounded-full" />
      </div>
      <SkeletonBlock width="55%" height="12px" />
      <SkeletonBlock width="75%" height="20px" />
    </div>
  );
}

function SkeletonFeatureCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
      <div className="flex items-start justify-between">
        <SkeletonCircle size={44} />
        <SkeletonBlock width="16px" height="16px" rounded="rounded-full" />
      </div>
      <SkeletonBlock width="45%" height="18px" />
      <SkeletonBlock width="70%" height="14px" />
      <SkeletonBlock width="80px" height="24px" rounded="rounded-full" />
    </div>
  );
}

function SkeletonMenuItem() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0B1220] p-2.5">
      <SkeletonCircle size={36} />
      <div className="min-w-0 flex-1 space-y-1">
        <SkeletonBlock width="70%" height="12px" />
        <SkeletonBlock width="50%" height="10px" />
      </div>
      <SkeletonBlock width="16px" height="16px" rounded="rounded-full" />
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonBlock width="96px" height="48px" rounded="rounded-xl" />
        <div className="ml-auto flex items-center gap-2">
          <SkeletonCircle size={48} />
          <SkeletonCircle size={48} />
          <SkeletonBlock width="88px" height="48px" rounded="rounded-2xl" />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-3 space-y-3">
        <div className="grid grid-cols-[96px_1fr_110px] items-start gap-2">
          <div className="relative">
            <SkeletonCircle size={96} />
          </div>
          <div className="min-w-0 space-y-2">
            <SkeletonBlock width="78%" height="18px" />
            <SkeletonBlock width="55%" height="12px" />
            <div className="flex flex-wrap gap-1.5">
              <SkeletonBlock width="88px" height="20px" rounded="rounded-full" />
              <SkeletonBlock width="72px" height="20px" rounded="rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBlock width="100%" height="36px" rounded="rounded-xl" />
              <SkeletonBlock width="100%" height="36px" rounded="rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <SkeletonCircle size={88} />
            <SkeletonBlock width="64px" height="12px" rounded="rounded-md" />
            <SkeletonBlock width="48px" height="14px" />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr_140px] gap-2">
          <SkeletonBlock width="100%" height="48px" rounded="rounded-xl" />
          <SkeletonBlock width="100%" height="48px" rounded="rounded-xl" />
          <SkeletonBlock width="100%" height="48px" rounded="rounded-xl" />
          <SkeletonBlock width="100%" height="48px" rounded="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-3 space-y-3">
        <SkeletonBlock width="50%" height="18px" />
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_90px] items-center gap-2">
          <div className="space-y-1 text-center">
            <SkeletonBlock width="80%" height="10px" />
            <SkeletonCircle size={40} />
          </div>
          <div className="space-y-1 text-center">
            <SkeletonBlock width="80%" height="10px" />
            <SkeletonBlock width="60%" height="16px" />
            <SkeletonBlock width="50%" height="10px" />
          </div>
          <div className="space-y-1 text-center">
            <SkeletonBlock width="80%" height="10px" />
            <SkeletonBlock width="70%" height="16px" />
            <SkeletonBlock width="50%" height="10px" />
          </div>
          <div className="space-y-1 text-center">
            <SkeletonBlock width="80%" height="10px" />
            <SkeletonBlock width="70%" height="16px" />
            <SkeletonBlock width="50%" height="10px" />
          </div>
          <SkeletonCircle size={78} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonMenuItem key={i} />
        ))}
      </div>
    </div>
  );
}

function DesktopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <SkeletonBlock width="120px" height="32px" rounded="rounded-xl" />
          <SkeletonBlock width="320px" height="16px" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock width="90px" height="36px" rounded="rounded-xl" />
          <SkeletonBlock width="90px" height="36px" rounded="rounded-xl" />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-6">
        <div className="flex items-start gap-6">
          <SkeletonCircle size={120} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonBlock width="200px" height="32px" rounded="rounded-xl" />
              <SkeletonBlock width="120px" height="24px" rounded="rounded-full" />
            </div>
            <SkeletonBlock width="260px" height="16px" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock width="120px" height="24px" rounded="rounded-full" />
              <SkeletonBlock width="90px" height="24px" rounded="rounded-full" />
              <SkeletonBlock width="110px" height="24px" rounded="rounded-full" />
              <SkeletonBlock width="80px" height="24px" rounded="rounded-full" />
              <SkeletonBlock width="130px" height="24px" rounded="rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <SkeletonBlock width="100%" height="56px" rounded="rounded-xl" />
              <SkeletonBlock width="100%" height="56px" rounded="rounded-xl" />
              <SkeletonBlock width="100%" height="56px" rounded="rounded-xl" />
              <SkeletonBlock width="100%" height="56px" rounded="rounded-xl" />
            </div>
          </div>
          <div className="hidden xl:flex flex-col items-center gap-2">
            <SkeletonCircle size={120} />
            <SkeletonBlock width="80px" height="16px" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-3xl border border-white/10 bg-[#0B1220] p-5 space-y-5">
          <SkeletonBlock width="160px" height="24px" />
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1 text-center">
              <SkeletonBlock width="80%" height="12px" />
              <SkeletonCircle size={48} />
            </div>
            <div className="space-y-1 text-center">
              <SkeletonBlock width="80%" height="12px" />
              <SkeletonBlock width="60%" height="20px" />
              <SkeletonBlock width="50%" height="12px" />
            </div>
            <div className="space-y-1 text-center">
              <SkeletonBlock width="80%" height="12px" />
              <SkeletonBlock width="70%" height="20px" />
              <SkeletonBlock width="50%" height="12px" />
            </div>
            <div className="space-y-1 text-center">
              <SkeletonBlock width="80%" height="12px" />
              <SkeletonBlock width="80%" height="20px" />
              <SkeletonBlock width="50%" height="12px" />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <SkeletonCircle size={40} />
                <SkeletonBlock width="70%" height="12px" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-4 rounded-3xl border border-white/10 bg-[#0B1220] p-5 space-y-4">
          <SkeletonBlock width="120px" height="24px" />
          <div className="flex items-center gap-3">
            <SkeletonCircle size={64} />
            <div className="space-y-1">
              <SkeletonBlock width="120px" height="14px" />
              <SkeletonBlock width="180px" height="22px" />
            </div>
          </div>
          <SkeletonBlock width="100%" height="8px" rounded="rounded-full" />
          <SkeletonBlock width="100%" height="36px" rounded="rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SkeletonFeatureCard />
        <SkeletonFeatureCard />
        <SkeletonFeatureCard />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SkeletonFeatureCard />
        <SkeletonFeatureCard />
        <SkeletonFeatureCard />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBlock width="140px" height="24px" />
          <SkeletonBlock width="50px" height="16px" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <SkeletonCircle size={36} />
            <div className="min-w-0 flex-1 space-y-1">
              <SkeletonBlock width="40%" height="16px" />
              <SkeletonBlock width="60%" height="12px" />
            </div>
            <SkeletonBlock width="80px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ sub-components ============ */

function IconChip({ children, count, onClick, accent, ariaLabel }: { children: React.ReactNode; count?: number; onClick: () => void; accent: string; ariaLabel?: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#0B1220] text-white/90" style={{ color: accent }}>
      {children}
      {count != null && count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{count}</span>
      )}
    </button>
  );
}


function Pill({ icon, text, tint }: { icon: React.ReactNode; text: string; tint: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-bold"
          style={{ background: `${tint}22`, borderColor: `${tint}55`, color: tint }}>
      {icon} {text}
    </span>
  );
}

function IdBox({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5">
      <div className="text-[9px] font-semibold text-white/55">{label}</div>
      <div className="mt-0.5 flex items-center justify-between gap-1">
        <span className="truncate text-[11px] font-extrabold text-white">{value}</span>
        <button onClick={onCopy} aria-label={`Copy ${label}`} className="text-white/60 hover:text-emerald-400"><Copy className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-2">
      <div className="flex items-center gap-1 text-[9px] font-semibold text-white/55">
        <span style={{ color: tint }}>{icon}</span> {label}
      </div>
      <div className="mt-0.5 text-[11px] font-extrabold text-white">{value}</div>
    </div>
  );
}

function StatCard({ icon, label, value, tint, onClick }: { icon: React.ReactNode; label: string; value: string; tint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] p-3 text-left">
      <div className="flex items-start justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tint}22`, color: tint }}>
          {icon}
        </span>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </div>
      <div className="mt-2 text-[11px] font-semibold text-white/65">{label}</div>
      <div className="mt-0.5 text-[15px] font-extrabold tabular-nums" style={{ color: tint }}>{value}</div>
    </button>
  );
}

function AgentMetric({ label, value, sub, icon, valueClass = "" }: { label: string; value?: string; sub?: string; icon?: React.ReactNode; valueClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-semibold text-white/60">{label}</div>
      {icon ? <div className="mt-0.5 flex justify-center">{icon}</div> : <div className={`mt-0.5 text-[14px] font-extrabold ${valueClass}`}>{value}</div>}
      {sub && <div className="mt-0.5 text-[9px] text-white/50">{sub}</div>}
    </div>
  );
}

function AgentAction({ icon, label, tint, onClick }: { icon: React.ReactNode; label: string; tint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl border" style={{ background: `${tint}1a`, borderColor: `${tint}55`, color: tint }}>
        {icon}
      </span>
      <span className="text-[9px] font-semibold leading-tight text-white/80">{label}</span>
    </button>
  );
}

function MenuItem({ icon, tint, title, sub, onClick, danger = false }: { icon: React.ReactNode; tint: string; title: string; sub: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl border p-2.5 text-left"
            style={{ background: danger ? "rgba(239,68,68,.06)" : "#0B1220", borderColor: danger ? "rgba(239,68,68,.35)" : "rgba(255,255,255,.08)" }}>
      <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${tint}22`, color: tint }}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12px] font-extrabold ${danger ? "text-rose-400" : "text-white"}`}>{title}</span>
        <span className="block truncate text-[10px] text-white/55">{sub}</span>
      </span>
      <ChevronRight className={`h-4 w-4 ${danger ? "text-rose-400" : "text-white/40"}`} />
    </button>
  );
}

function FeatureCard({ icon, tint, title, desc, action, onClick }: { icon: React.ReactNode; tint: string; title: string; desc: string; action: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-3xl border border-white/10 bg-[#0B1220] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${tint}22`, color: tint }}>{icon}</span>
        <ChevronRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
      </div>
      <div className="mt-4 text-base font-extrabold text-white">{title}</div>
      <div className="mt-1 text-xs text-white/55">{desc}</div>
      <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold" style={{ color: tint }}>
        {action} <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}
