import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { format, isToday } from "date-fns";

export default function StreakTrackingModal({ goal, open, onClose, onTrack }) {
  const streakCount = goal.streak_count || 0;
  const lastCompleted = goal.last_completed_occurrence 
    ? new Date(goal.last_completed_occurrence)
    : null;
  const completionHistory = goal.completion_history || [];
  
  const canTrackToday = !lastCompleted || !isToday(lastCompleted);

  const handleTrack = async () => {
    const today = new Date();
    const newHistory = [...completionHistory, today.toISOString()];
    
    // Check if we're continuing a streak or starting fresh
    let newStreak = streakCount;
    if (lastCompleted) {
      const daysSinceLastCompletion = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
      if (daysSinceLastCompletion === 1) {
        // Consecutive day - increment streak
        newStreak = streakCount + 1;
      } else if (daysSinceLastCompletion > 1) {
        // Missed days - reset streak
        newStreak = 1;
      } else {
        // Same day - don't change streak
        newStreak = streakCount;
      }
    } else {
      // First completion
      newStreak = 1;
    }

    await onTrack({
      streak_count: newStreak,
      last_completed_occurrence: today.toISOString(),
      completion_history: newHistory
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glassmorphism border-white/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Streak Tracking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Streak */}
          <div className="glassmorphism rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-orange-400" />
              <div className="text-4xl font-bold text-white">
                {streakCount}
              </div>
            </div>
            <p className="text-white/70 text-sm">
              {streakCount === 0 ? "Start your streak!" : 
               streakCount === 1 ? "day streak" : 
               "days streak"}
            </p>
          </div>

          {/* Last Completed */}
          {lastCompleted && (
            <div className="glassmorphism rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/60">Last completed</span>
              </div>
              <p className="text-white font-medium">
                {format(lastCompleted, 'MMMM d, yyyy')}
                {isToday(lastCompleted) && (
                  <Badge variant="outline" className="ml-2 border-green-400/30 text-green-400 text-xs">
                    Today
                  </Badge>
                )}
              </p>
            </div>
          )}

          {/* Track Today Button */}
          <Button
            onClick={handleTrack}
            disabled={!canTrackToday}
            className="w-full glassmorphism border-white/30 text-white hover:glow"
          >
            {!canTrackToday ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                Already tracked today
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Today's Occurrence
              </>
            )}
          </Button>

          {/* Recent History */}
          {completionHistory.length > 0 && (
            <div className="glassmorphism rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">Recent Activity</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {completionHistory
                  .slice(-10)
                  .reverse()
                  .map((dateStr, index) => {
                    const date = new Date(dateStr);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white/70">
                          {format(date, 'MMM d, yyyy')}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-white/50 text-center">
            Complete each occurrence on time to maintain your streak. 
            Missing a day resets your count.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}