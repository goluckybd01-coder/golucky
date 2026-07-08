import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, Users, Send, ArrowLeft, RefreshCw, 
  Trash2, CheckCircle, Search, Filter, Rocket
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated } from "@/lib/bannerConfig";
import { mapSignupsWithProfiles } from "./gameLaunchNotificationsMapper";


interface NotificationSignup {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  
  created_at: string;
  notified_at: string | null;
  profile?: {
    username: string | null;
    phone: string | null;
  };
}

interface CategoryStats {
  category_id: string;
  category_name: string;
  count: number;
  notified_count: number;
}

const GAME_CATEGORIES = [
  { id: "mini", name: "Mini games", icon: "🎮" },
  { id: "slots", name: "Slots", icon: "🎰" },
  { id: "casino", name: "Casino", icon: "🃏" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "fishing", name: "Fishing", icon: "🎣" },
  { id: "pvc", name: "PVC", icon: "🥊" },
];

const GameLaunchNotifications = () => {
  const navigate = useNavigate();
  const [signups, setSignups] = useState<NotificationSignup[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all signups
      const { data: signupsData, error: signupsError } = await supabase
        .from("game_launch_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (signupsError) {
        console.error("Error loading signups:", signupsError);
        toast.error("Failed to load notification signups");
        setIsLoading(false);
        return;
      }

      // Get user profiles for the signups
      const userIds = [...new Set((signupsData || []).map(s => s.user_id))];
      let profilesMap: Record<string, { username: string | null; phone: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, phone")
          .in("user_id", userIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = { username: p.username, phone: p.phone };
            return acc;
          }, {} as Record<string, { username: string | null; phone: string | null }>);
        }
      }

      // Combine signups with profiles
      const signupsWithProfiles: NotificationSignup[] = mapSignupsWithProfiles(
        signupsData || [],
        userIds.length > 0 ? Object.entries(profilesMap).map(([user_id, p]) => ({ user_id, ...p })) : [],
      );


      setSignups(signupsWithProfiles);

      // Calculate category stats
      const stats: Record<string, CategoryStats> = {};
      signupsWithProfiles.forEach((signup) => {
        if (!stats[signup.category_id]) {
          stats[signup.category_id] = {
            category_id: signup.category_id,
            category_name: signup.category_name,
            count: 0,
            notified_count: 0,
          };
        }
        stats[signup.category_id].count++;
        if (signup.notified_at) {
          stats[signup.category_id].notified_count++;
        }
      });
      setCategoryStats(Object.values(stats));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load notification signups");
    }
    setIsLoading(false);
  };

  const handleSendNotifications = async () => {
    if (!selectedCategory || !notifyMessage.trim()) {
      toast.error("Please select a category and enter a message");
      return;
    }

    setIsSending(true);
    try {
      // Get all signups for this category that haven't been notified
      const { data: pendingSignups, error: fetchError } = await supabase
        .from("game_launch_notifications")
        .select("id, user_id")
        .eq("category_id", selectedCategory)
        .is("notified_at", null);

      if (fetchError) throw fetchError;

      if (!pendingSignups || pendingSignups.length === 0) {
        toast.info("No pending signups to notify for this category");
        setIsSending(false);
        return;
      }

      // Mark all as notified
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("game_launch_notifications")
        .update({ notified_at: now })
        .eq("category_id", selectedCategory)
        .is("notified_at", null);

      if (updateError) throw updateError;

      // Create admin notification history entry
      const categoryInfo = GAME_CATEGORIES.find(c => c.id === selectedCategory);
      await supabase
        .from("admin_notification_history")
        .insert({
          notification_type: "game_launch",
          title: `${categoryInfo?.name || selectedCategory} Launch Notification`,
          message: notifyMessage,
          priority: "high",
          recipients: pendingSignups.map(s => s.user_id),
          metadata: {
            category_id: selectedCategory,
            category_name: categoryInfo?.name,
            notified_count: pendingSignups.length,
          },
        });

      toast.success(`Successfully notified ${pendingSignups.length} users!`);
      setNotifyDialogOpen(false);
      setNotifyMessage("");
      setSelectedCategory(null);
      loadData();
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    }
    setIsSending(false);
  };

  const handleDeleteSignup = async (id: string) => {
    const { error } = await supabase
      .from("game_launch_notifications")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete signup");
      return;
    }

    setSignups(prev => prev.filter(s => s.id !== id));
    toast.success("Signup deleted");
  };

  const filteredSignups = signups.filter(signup => {
    const matchesSearch = 
      signup.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signup.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signup.profile?.phone?.includes(searchQuery);
    
    const matchesCategory = categoryFilter === "all" || signup.category_id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoryId: string) => {
    return GAME_CATEGORIES.find(c => c.id === categoryId)?.icon || "🎮";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold">Game Launch Notifications</h1>
            <p className="text-gray-400 text-xs">Manage subscriber notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Category Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {GAME_CATEGORIES.map(category => {
            const stats = categoryStats.find(s => s.category_id === category.id);
            const pendingCount = (stats?.count || 0) - (stats?.notified_count || 0);
            
            return (
              <div
                key={category.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setNotifyDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-white font-medium text-sm">{category.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.count || 0}</p>
                    <p className="text-gray-400 text-xs">subscribers</p>
                  </div>
                  {pendingCount > 0 && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {pendingCount} pending
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Stats */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Subscribers</p>
                <p className="text-2xl font-bold text-white">{signups.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg">
                  {signups.filter(s => s.notified_at).length}
                </p>
                <p className="text-gray-400 text-xs">Notified</p>
              </div>
              <div className="text-center">
                <p className="text-orange-400 font-bold text-lg">
                  {signups.filter(s => !s.notified_at).length}
                </p>
                <p className="text-gray-400 text-xs">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by username or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {GAME_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-white">
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Signups Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Signed Up</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSignups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No notification signups found
                    </td>
                  </tr>
                ) : (
                  filteredSignups.map(signup => (
                    <tr key={signup.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">
                            {signup.profile?.username || "Anonymous"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {signup.profile?.phone || signup.user_id.slice(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(signup.category_id)}</span>
                          <span className="text-white">{signup.category_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {format(new Date(signup.created_at), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-4 py-3">
                        {signup.notified_at ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Notified
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSignup(signup.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Send Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-400" />
              Send Launch Notification
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Notify all pending subscribers for this category
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {GAME_CATEGORIES.map(cat => {
                    const stats = categoryStats.find(s => s.category_id === cat.id);
                    const pendingCount = (stats?.count || 0) - (stats?.notified_count || 0);
                    return (
                      <SelectItem key={cat.id} value={cat.id} className="text-white">
                        {cat.icon} {cat.name} ({pendingCount} pending)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Notification Message</label>
              <Textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Great news! The games you've been waiting for are now LIVE! 🎉"
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            {selectedCategory && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <p className="text-purple-300 text-sm">
                  <strong>
                    {(categoryStats.find(s => s.category_id === selectedCategory)?.count || 0) - 
                     (categoryStats.find(s => s.category_id === selectedCategory)?.notified_count || 0)}
                  </strong> users will be notified
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotifyDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotifications}
              disabled={isSending || !selectedCategory || !notifyMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notifications
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameLaunchNotifications;
