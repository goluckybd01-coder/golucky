import { motion } from "framer-motion";
import { Clock, CheckCircle, MessageCircle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatStats } from "@/hooks/useAdminSupportChat";

interface SupportChatStatsProps {
  stats: ChatStats;
}

export const SupportChatStats = ({ stats }: SupportChatStatsProps) => {
  const statItems = [
    {
      label: "Open",
      value: stats.open,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: MessageCircle,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      label: "My Active",
      value: stats.myActive,
      icon: User,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    {
      label: "Closed Today",
      value: stats.closed,
      icon: CheckCircle,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`${item.bg} ${item.border} border`}>
            <CardContent className="p-3 flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
