import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  LogOut, Plus, Trash2, ChevronUp, ChevronDown, Save, Image, Home, Activity, 
  Sparkles, LayoutDashboard, Eye, EyeOff, TrendingUp, Clock, ExternalLink, 
  Link2, Calendar, Copy, GripVertical, Search, Filter, MoreVertical, 
  CheckCircle2, AlertCircle, Loader2, Upload, RefreshCw, MousePointer,
  BarChart3, Zap, Star
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { INTERNAL_ROUTES } from "@/lib/bannerConfig";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type BannerType = "home_slider" | "activity" | "welcome" | "popup";
type LinkType = "internal" | "external";

interface Banner {
  id: string;
  banner_type: BannerType;
  title: string;
  image_url: string;
  link: string;
  link_type: LinkType;
  is_enabled: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface WelcomeSettings {
  id: string;
  is_enabled: boolean;
  image_url: string;
  duration_seconds: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [banners, setBanners] = useState<Banner[]>([]);
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Dialog states
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<BannerType>("home_slider");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // New banner form
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    title: "",
    image_url: "",
    link: "/promotion",
    link_type: "internal",
    is_enabled: true,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      // Check if staff
      const { data: staffAccount } = await supabase
        .from("staff_accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .single();

      if (!staffAccount) {
        navigate("/admin/login");
        return;
      }

      // Fetch banners
      const { data: bannersData, error: bannersError } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (bannersError) throw bannersError;
      setBanners((bannersData || []) as Banner[]);

      // Fetch welcome settings
      const { data: welcomeData, error: welcomeError } = await supabase
        .from("welcome_banner_settings")
        .select("*")
        .single();

      if (!welcomeError && welcomeData) {
        setWelcomeSettings(welcomeData);
      }

      // Fetch pending requests
      const { count } = await supabase
        .from("transaction_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingRequestsCount(count || 0);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load banners", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("banners_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("admin_staff_role");
    localStorage.removeItem("admin_staff_name");
    navigate("/admin/login");
  };

  // Banner operations
  const addBanner = async () => {
    if (!newBanner.title || !newBanner.image_url) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const maxOrder = Math.max(0, ...banners.filter(b => b.banner_type === currentTab).map(b => b.display_order));
      
      const { error } = await supabase.from("banners").insert({
        banner_type: currentTab,
        title: newBanner.title,
        image_url: newBanner.image_url,
        link: newBanner.link || "/promotion",
        link_type: newBanner.link_type || "internal",
        is_enabled: newBanner.is_enabled ?? true,
        display_order: maxOrder + 1,
        start_date: newBanner.start_date,
        end_date: newBanner.end_date,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Banner added successfully" });
      setNewBanner({ title: "", image_url: "", link: "/promotion", link_type: "internal", is_enabled: true });
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding banner:", error);
      toast({ title: "Error", description: "Failed to add banner", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBanner = async (banner: Banner) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("banners")
        .update({
          title: banner.title,
          image_url: banner.image_url,
          link: banner.link,
          link_type: banner.link_type,
          is_enabled: banner.is_enabled,
          start_date: banner.start_date,
          end_date: banner.end_date,
        })
        .eq("id", banner.id);

      if (error) throw error;

      toast({ title: "Success", description: "Banner updated" });
      setEditingBanner(null);
      fetchData();
    } catch (error) {
      console.error("Error updating banner:", error);
      toast({ title: "Error", description: "Failed to update banner", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Banner removed" });
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast({ title: "Error", description: "Failed to delete banner", variant: "destructive" });
    }
  };

  const duplicateBanner = async (banner: Banner) => {
    try {
      const maxOrder = Math.max(0, ...banners.filter(b => b.banner_type === banner.banner_type).map(b => b.display_order));
      const { error } = await supabase.from("banners").insert({
        ...banner,
        id: undefined,
        title: `${banner.title} (Copy)`,
        display_order: maxOrder + 1,
        created_at: undefined,
        updated_at: undefined,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Banner duplicated" });
      fetchData();
    } catch (error) {
      console.error("Error duplicating banner:", error);
      toast({ title: "Error", description: "Failed to duplicate banner", variant: "destructive" });
    }
  };

  const toggleBannerEnabled = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error toggling banner:", error);
    }
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const typeBanners = [...banners.filter(b => b.banner_type === currentTab)].sort((a, b) => a.display_order - b.display_order);
    const idx = typeBanners.findIndex(b => b.id === id);
    if (idx === -1) return;
    
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= typeBanners.length) return;

    try {
      const updates = [
        supabase.from("banners").update({ display_order: typeBanners[swapIdx].display_order }).eq("id", typeBanners[idx].id),
        supabase.from("banners").update({ display_order: typeBanners[idx].display_order }).eq("id", typeBanners[swapIdx].id),
      ];
      await Promise.all(updates);
      fetchData();
    } catch (error) {
      console.error("Error reordering:", error);
    }
  };

  const updateWelcomeSettings = async (updates: Partial<WelcomeSettings>) => {
    if (!welcomeSettings) return;
    try {
      const { error } = await supabase
        .from("welcome_banner_settings")
        .update(updates)
        .eq("id", welcomeSettings.id);
      if (error) throw error;
      setWelcomeSettings({ ...welcomeSettings, ...updates });
      toast({ title: "Updated", description: "Welcome settings saved" });
    } catch (error) {
      console.error("Error updating welcome settings:", error);
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  };

  // Get banner status
  const getBannerStatus = (banner: Banner): "active" | "upcoming" | "expired" | "disabled" => {
    if (!banner.is_enabled) return "disabled";
    const now = new Date();
    if (banner.start_date && new Date(banner.start_date) > now) return "upcoming";
    if (banner.end_date && new Date(banner.end_date) < now) return "expired";
    return "active";
  };

  // Filter banners
  const filteredBanners = banners
    .filter(b => b.banner_type === currentTab)
    .filter(b => searchQuery ? b.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    .sort((a, b) => a.display_order - b.display_order);

  // Stats
  const stats = {
    total: banners.length,
    enabled: banners.filter(b => b.is_enabled).length,
    homeSlider: banners.filter(b => b.banner_type === "home_slider").length,
    activity: banners.filter(b => b.banner_type === "activity").length,
    totalClicks: banners.reduce((sum, b) => sum + (b.click_count || 0), 0),
    totalViews: banners.reduce((sum, b) => sum + (b.view_count || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="p-4 max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-16 w-full bg-gray-800" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 bg-gray-800" />)}
          </div>
          <Skeleton className="h-96 bg-gray-800" />
        </div>
      </div>
    );
  }

  // Banner form component
  const BannerForm = ({ 
    banner, 
    onUpdate 
  }: { 
    banner: Partial<Banner>; 
    onUpdate: (updates: Partial<Banner>) => void;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-gray-300">Title *</Label>
        <Input
          value={banner.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="bg-gray-700/50 border-gray-600 text-white mt-1"
          placeholder="Enter banner title"
        />
      </div>
      
      <div>
        <Label className="text-gray-300">Image URL *</Label>
        <Input
          value={banner.image_url || ""}
          onChange={(e) => onUpdate({ image_url: e.target.value })}
          className="bg-gray-700/50 border-gray-600 text-white mt-1"
          placeholder="/assets/images/banners/..."
        />
        {banner.image_url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-700">
            <img 
              src={banner.image_url} 
              alt="Preview" 
              className="w-full h-32 object-cover"
              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Link Type</Label>
          <Select
            value={banner.link_type || "internal"}
            onValueChange={(value: LinkType) => onUpdate({ 
              link_type: value,
              link: value === "internal" ? "/promotion" : ""
            })}
          >
            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="internal">Internal Page</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Link</Label>
          {banner.link_type === "external" ? (
            <Input
              value={banner.link || ""}
              onChange={(e) => onUpdate({ link: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white mt-1"
              placeholder="https://..."
            />
          ) : (
            <Select
              value={banner.link || "/promotion"}
              onValueChange={(value) => onUpdate({ link: value })}
            >
              <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {INTERNAL_ROUTES.map(route => (
                  <SelectItem key={route.value} value={route.value}>{route.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 mt-1",
                  !banner.start_date && "text-gray-400"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {banner.start_date ? format(new Date(banner.start_date), "PP") : "Not set"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <CalendarComponent
                mode="single"
                selected={banner.start_date ? new Date(banner.start_date) : undefined}
                onSelect={(date) => onUpdate({ start_date: date?.toISOString() || null })}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-gray-300">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 mt-1",
                  !banner.end_date && "text-gray-400"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {banner.end_date ? format(new Date(banner.end_date), "PP") : "Not set"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <CalendarComponent
                mode="single"
                selected={banner.end_date ? new Date(banner.end_date) : undefined}
                onSelect={(date) => onUpdate({ end_date: date?.toISOString() || null })}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Switch
          checked={banner.is_enabled ?? true}
          onCheckedChange={(checked) => onUpdate({ is_enabled: checked })}
        />
        <Label className="text-gray-300">Enable Banner</Label>
      </div>
    </div>
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: ReturnType<typeof getBannerStatus> }) => {
    const config = {
      active: { class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
      upcoming: { class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      expired: { class: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
      disabled: { class: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: EyeOff },
    };
    const Icon = config[status].icon;
    return (
      <Badge variant="outline" className={cn("gap-1 text-xs", config[status].class)}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3 flex items-center justify-between sticky top-0 z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold">Banner Manager</h1>
            <p className="text-gray-400 text-xs">GoLucky Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="relative bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400"
          >
            <LayoutDashboard size={16} className="mr-2" />
            Dashboard
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full animate-pulse">
                {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
              </span>
            )}
          </Button>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            <LogOut size={16} />
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-4 max-w-6xl mx-auto">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-gray-800/50 backdrop-blur mb-6 p-1 rounded-xl">
            {[
              { value: "dashboard", icon: BarChart3, label: "Overview" },
              { value: "home_slider", icon: Home, label: "Home" },
              { value: "activity", icon: Activity, label: "Activity" },
              { value: "welcome", icon: Sparkles, label: "Welcome" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => tab.value !== "dashboard" && tab.value !== "welcome" && setCurrentTab(tab.value as BannerType)}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Banners", value: stats.total, icon: Image, gradient: "from-blue-600 to-blue-500" },
                  { label: "Active", value: stats.enabled, icon: Eye, gradient: "from-emerald-600 to-emerald-500" },
                  { label: "Home Slider", value: stats.homeSlider, icon: Home, gradient: "from-orange-600 to-orange-500" },
                  { label: "Activity", value: stats.activity, icon: Activity, gradient: "from-purple-600 to-purple-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon size={20} className="text-white/80" />
                      <Zap size={14} className="text-white/60" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/70 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Analytics Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <MousePointer className="text-orange-500" size={18} />
                    <h3 className="text-white font-semibold">Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Total Views</p>
                      <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Total Clicks</p>
                      <p className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-orange-500" size={18} />
                    <h3 className="text-white font-semibold">Welcome Screen</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Status</p>
                      <Badge variant={welcomeSettings?.is_enabled ? "default" : "secondary"}>
                        {welcomeSettings?.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Duration</p>
                      <p className="text-xl font-bold text-white">{welcomeSettings?.duration_seconds || 3}s</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Banners */}
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-white font-semibold mb-4">Banner Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {banners.slice(0, 6).map((banner, i) => (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative rounded-xl overflow-hidden aspect-video bg-gray-700 group"
                    >
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                      {!banner.is_enabled && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <EyeOff size={20} className="text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-xs truncate">{banner.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Home Slider & Activity Tabs */}
          {(["home_slider", "activity"] as BannerType[]).map(bannerType => (
            <TabsContent key={bannerType} value={bannerType}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      placeholder="Search banners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                  <Dialog open={isAddDialogOpen && currentTab === bannerType} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20">
                        <Plus size={18} className="mr-2" />
                        Add Banner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Banner</DialogTitle>
                      </DialogHeader>
                      <BannerForm 
                        banner={newBanner} 
                        onUpdate={(updates) => setNewBanner({ ...newBanner, ...updates })} 
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={addBanner} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                          {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
                          Add Banner
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Banner List */}
                <AnimatePresence mode="popLayout">
                  {filteredBanners.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700"
                    >
                      <Image size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No banners found</p>
                      <p className="text-gray-500 text-sm">Click "Add Banner" to create one</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBanners.map((banner, idx) => {
                        const status = getBannerStatus(banner);
                        return (
                          <motion.div
                            key={banner.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50 flex items-center gap-4 group",
                              status === "expired" && "opacity-60"
                            )}
                          >
                            {/* Drag Handle */}
                            <div className="text-gray-600 cursor-grab active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>

                            {/* Thumbnail */}
                            <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 shadow-inner">
                              <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white font-medium truncate">{banner.title}</p>
                                <StatusBadge status={status} />
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 text-xs">
                                <span className="flex items-center gap-1">
                                  <Link2 size={12} />
                                  {banner.link_type === "external" ? banner.link.substring(0, 30) : INTERNAL_ROUTES.find(r => r.value === banner.link)?.label || banner.link}
                                </span>
                                {(banner.start_date || banner.end_date) && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {banner.start_date ? format(new Date(banner.start_date), "MMM d") : "Now"}
                                    {" → "}
                                    {banner.end_date ? format(new Date(banner.end_date), "MMM d") : "Forever"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Toggle */}
                            <Switch
                              checked={banner.is_enabled}
                              onCheckedChange={(checked) => toggleBannerEnabled(banner.id, checked)}
                            />

                            {/* Order buttons */}
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => moveOrder(banner.id, "up")}
                                disabled={idx === 0}
                                className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp size={14} className="text-white" />
                              </button>
                              <button
                                onClick={() => moveOrder(banner.id, "down")}
                                disabled={idx === filteredBanners.length - 1}
                                className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown size={14} className="text-white" />
                              </button>
                            </div>

                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                  <MoreVertical size={18} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem onClick={() => setEditingBanner(banner)} className="text-white cursor-pointer">
                                  <Star size={14} className="mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateBanner(banner)} className="text-white cursor-pointer">
                                  <Copy size={14} className="mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-700" />
                                <DropdownMenuItem onClick={() => setShowDeleteConfirm(banner.id)} className="text-red-400 cursor-pointer">
                                  <Trash2 size={14} className="mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </TabsContent>
          ))}

          {/* Welcome Tab */}
          <TabsContent value="welcome">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50"
            >
              <h2 className="text-white text-xl font-semibold mb-6">Welcome Screen Settings</h2>
              
              {/* Preview */}
              <div className="rounded-xl overflow-hidden bg-gray-700 mb-6 aspect-video max-w-md mx-auto shadow-2xl">
                <img
                  src={welcomeSettings?.image_url || "/placeholder.svg"}
                  alt="Welcome preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />
              </div>

              {/* Settings */}
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                  <div>
                    <Label className="text-white font-medium">Show Welcome Screen</Label>
                    <p className="text-gray-400 text-sm">Display on first visit</p>
                  </div>
                  <Switch
                    checked={welcomeSettings?.is_enabled ?? true}
                    onCheckedChange={(checked) => updateWelcomeSettings({ is_enabled: checked })}
                  />
                </div>

                <div className="p-4 bg-gray-700/30 rounded-xl">
                  <Label className="text-white font-medium">Display Duration</Label>
                  <p className="text-gray-400 text-sm mb-3">How long to show the welcome screen</p>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={welcomeSettings?.duration_seconds || 3}
                      onChange={(e) => updateWelcomeSettings({ duration_seconds: parseInt(e.target.value) || 3 })}
                      className="w-24 bg-gray-600 border-gray-500 text-white"
                    />
                    <span className="text-gray-400">seconds</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-700/30 rounded-xl">
                  <Label className="text-white font-medium">Image URL</Label>
                  <Input
                    value={welcomeSettings?.image_url || ""}
                    onChange={(e) => updateWelcomeSettings({ image_url: e.target.value })}
                    className="mt-2 bg-gray-600 border-gray-500 text-white"
                    placeholder="/assets/images/welcome/..."
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingBanner} onOpenChange={() => setEditingBanner(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Banner</DialogTitle>
          </DialogHeader>
          {editingBanner && (
            <BannerForm 
              banner={editingBanner} 
              onUpdate={(updates) => setEditingBanner({ ...editingBanner, ...updates })} 
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBanner(null)}>Cancel</Button>
            <Button 
              onClick={() => editingBanner && updateBanner(editingBanner)} 
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Banner?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">This action cannot be undone. Are you sure you want to delete this banner?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && deleteBanner(showDeleteConfirm)}>
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
