
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Zap, Target, Settings, Sparkles } from "lucide-react";

export default function ModeSelector({ mode, onModeChange }) {
  const [userModeOverride, setUserModeOverride] = useState(null);

  useEffect(() => {
    loadUserMode();
  }, []);

  const loadUserMode = async () => {
    try {
      const user = await User.me();
      setUserModeOverride(user.mode_override || "auto");
    } catch (error) {
      console.error("Error loading user mode:", error);
    }
  };

  const modes = [
    { id: "coach", label: "Coach", icon: Target, desc: "Navigate & reframe" },
    { id: "task", label: "Task", icon: Settings, desc: "Drop-in ready assets" },
    { id: "ace", label: "ACE", icon: Zap, desc: "Wit & edge" }
  ];

  return (
    <div className="flex gap-2 items-center" data-tour="mode-selector">
      {userModeOverride && userModeOverride !== "auto" && (
        <Badge variant="outline" className="text-xs border-white/30 text-secondary flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Default: {userModeOverride}
        </Badge>
      )}
      {modes.map((modeOption) => {
        const Icon = modeOption.icon;
        const isActive = mode === modeOption.id;
        
        return (
          <button
            key={modeOption.id}
            onClick={() => onModeChange(modeOption.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'glassmorphism text-primary glow' 
                : 'text-secondary hover:text-primary hover:glassmorphism'
            }`}
            title={modeOption.desc}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{modeOption.label}</span>
          </button>
        );
      })}
    </div>
  );
}
