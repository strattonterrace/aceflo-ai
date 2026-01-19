import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Calendar, Zap } from "lucide-react";

export default function ProgressStats({ goals, sessions }) {
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const activeGoals = goals.filter(g => g.status === "active").length;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length)
    : 0;
  const recentSessions = sessions.length;

  const stats = [
    {
      title: "Completed Goals",
      value: completedGoals,
      icon: Target,
      color: "text-green-400"
    },
    {
      title: "Active Goals", 
      value: activeGoals,
      icon: TrendingUp,
      color: "text-blue-400"
    },
    {
      title: "Average Progress",
      value: `${avgProgress}%`,
      icon: Calendar,
      color: "text-purple-400"
    },
    {
      title: "Recent Sessions",
      value: recentSessions,
      icon: Zap,
      color: "text-orange-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glassmorphism rounded-xl p-4 hover:glow transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 glassmorphism rounded-lg ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-secondary">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}