import { motion } from "framer-motion";
import { Power, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SupportAgentStatus as AgentStatusType } from "@/hooks/useAdminSupportChat";

interface SupportAgentStatusProps {
  agentStatus: AgentStatusType | null;
  onToggle: () => void;
}

export const SupportAgentStatus = ({ agentStatus, onToggle }: SupportAgentStatusProps) => {
  const isOnline = agentStatus?.is_online ?? false;
  const activeChats = agentStatus?.active_chats ?? 0;
  const maxChats = agentStatus?.max_active_chats ?? 5;

  return (
    <div className="p-4 border-b border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: isOnline ? [1, 1.2, 1] : 1,
              opacity: isOnline ? 1 : 0.5,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isOnline
                ? "bg-green-500/20 border border-green-500/30"
                : "bg-gray-800 border border-gray-700"
            )}
          >
            <Power className={cn("h-5 w-5", isOnline ? "text-green-400" : "text-gray-500")} />
          </motion.div>
          <div>
            <p className={cn("font-medium", isOnline ? "text-green-400" : "text-gray-400")}>
              {isOnline ? "Online" : "Offline"}
            </p>
            <p className="text-xs text-gray-500">
              {isOnline ? "Receiving new chats" : "Not receiving chats"}
            </p>
          </div>
        </div>
        <Switch checked={isOnline} onCheckedChange={onToggle} />
      </div>

      <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg">
        <Users className="h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Active Chats</span>
            <span className="text-sm font-medium text-white">
              {activeChats} / {maxChats}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(activeChats / maxChats) * 100}%` }}
              className={cn(
                "h-full rounded-full",
                activeChats >= maxChats
                  ? "bg-red-500"
                  : activeChats >= maxChats * 0.7
                  ? "bg-yellow-500"
                  : "bg-green-500"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
