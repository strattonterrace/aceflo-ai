
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  Repeat,
  Pencil,
  Flame,
  MessageCircle, // Added MessageCircle import
  Loader2 // Added Loader2 import
} from "lucide-react";
import { format } from "date-fns";
import { computeNextOccurrence, getRecurrenceSummary, getEndSummary, getNotificationData } from "../utils/recurrence";
import StreakTrackingModal from "./StreakTrackingModal";

export default function ProgressCard({ goal, onUpdate, onEdit }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [error, setError] = useState(null);

  const getCategoryColor = (category) => {
    const colors = {
      career: "bg-blue-100 text-blue-800 border-blue-200",
      relationships: "bg-pink-100 text-pink-800 border-pink-200",
      health: "bg-green-100 text-green-800 border-green-200",
      personal: "bg-purple-100 text-purple-800 border-purple-200",
      creative: "bg-orange-100 text-orange-800 border-orange-200",
      financial: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      planning: Target,
      active: Play,
      blocked: Pause,
      completed: CheckCircle2
    };
    return icons[status] || Target;
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: "text-blue-400",
      active: "text-green-400",
      blocked: "text-red-400",
      completed: "text-emerald-400"
    };
    return colors[status] || "text-gray-400";
  };

  const updateProgress = async (increment) => {
    setIsUpdating(true);
    setError(null);
    try {
      const newProgress = Math.max(0, Math.min(100, goal.progress_percentage + increment));
      const newStatus = newProgress === 100 ? "completed" : goal.status === "planning" ? "active" : goal.status;

      await onUpdate(goal.id, {
        progress_percentage: newProgress,
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      setError("Failed to update progress");
    }
    setIsUpdating(false);
  };

  const markComplete = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate(goal.id, {
        progress_percentage: 100,
        status: "completed"
      });
    } catch (error) {
      console.error("Error marking complete:", error);
      setError("Failed to mark as complete");
    }
    setIsUpdating(false);
  };

  const toggleStatus = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      let newStatus;
      switch (goal.status) {
        case "planning":
          newStatus = "active";
          break;
        case "active":
          newStatus = "blocked";
          break;
        case "blocked":
          newStatus = "active";
          break;
        default:
          newStatus = "active";
      }

      await onUpdate(goal.id, { status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Failed to update status");
    }
    setIsUpdating(false);
  };

  const handleTrackStreak = async (updates) => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate(goal.id, updates);
      setShowStreakModal(false);
    } catch (error) {
      console.error("Error tracking streak:", error);
      setError("Failed to track streak");
    }
    setIsUpdating(false);
  };

  // New function for deep linking
  const handleViewChatContext = () => {
    if (goal.source === "chat" && goal.source_session_id && goal.last_ref_message_id) {
      // Analytics
      console.log('Analytics: deep_link_view_chat', {
        goalId: goal.id,
        sessionId: goal.source_session_id,
        messageId: goal.last_ref_message_id
      });

      // Navigate to chat with params (include goalId so Chat can show the banner)
      window.location.href = `/Chat?sessionId=${goal.source_session_id}&messageId=${goal.last_ref_message_id}&goalId=${goal.id}`;
    }
  };

  const StatusIcon = getStatusIcon(goal.status);

  const nextOccurrence = goal.is_recurring && goal.anchor_date
    ? computeNextOccurrence(goal.anchor_date, goal.repeat_rule)
    : null;

  const isEnded = goal.is_recurring && !nextOccurrence;

  const notificationData = goal.is_recurring ? getNotificationData(goal) : null;

  React.useEffect(() => {
    if (notificationData) {
      // Data available for notifications
    }
  }, [notificationData]);

  // Format recurrence for display
  const recurrenceDisplay = goal.is_recurring && goal.repeat_rule
    ? getRecurrenceSummary(goal.repeat_rule)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className="glassmorphism rounded-xl overflow-hidden hover:glow transition-all duration-300"
    >
      <CardContent className="p-6">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 glassmorphism rounded-lg border border-red-400/30"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2">
              {goal.goal}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getCategoryColor(goal.category)} text-xs`}>
                {goal.category}
              </Badge>
              <button
                onClick={toggleStatus}
                disabled={isUpdating || goal.status === "completed"}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full glassmorphism ${getStatusColor(goal.status)} hover:glow disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <StatusIcon className="w-3 h-3" />
                )}
                {goal.status}
              </button>
              {goal.is_recurring && recurrenceDisplay && (
                <Badge variant="outline" className="text-xs border-white/30 text-secondary flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  {recurrenceDisplay}
                </Badge>
              )}
              {goal.source === "chat" && (
                <Badge variant="outline" className="text-xs border-white/30 text-secondary">
                  From Chat
                </Badge>
              )}
            </div>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              disabled={isUpdating}
              className="text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-secondary">Progress</span>
            <span className="text-sm font-medium text-primary">
              {goal.progress_percentage}%
            </span>
          </div>
          <Progress
            value={goal.progress_percentage}
            className="h-2 bg-white/10"
          />
        </div>

        {/* Recurrence Info */}
        {goal.is_recurring && (
          <div className="text-xs text-secondary mb-4">
            {isEnded ? (
              <span className="text-red-400">Ended</span>
            ) : nextOccurrence ? (
              <>
                Next: {nextOccurrence.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {" • "}
                Ends: {getEndSummary(goal.repeat_rule)}
              </>
            ) : null}
          </div>
        )}

        {/* Target Date */}
        {goal.target_date && !goal.is_recurring && (
          <div className="flex items-center gap-2 text-xs text-secondary mb-4">
            <Calendar className="w-3 h-3" />
            <span>Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Next Steps */}
        {goal.next_steps && goal.next_steps.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-secondary mb-2">Next Steps:</p>
            <ul className="text-xs text-secondary space-y-1">
              {goal.next_steps.slice(0, 2).map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-tertiary">•</span>
                  <span className="line-clamp-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Blockers */}
        {goal.blockers && goal.status === "blocked" && (
          <div className="mb-4 p-3 glassmorphism rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-red-400">Blocked</span>
            </div>
            <p className="text-xs text-secondary line-clamp-2">{goal.blockers}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* View Chat Context Button */}
          {goal.source === "chat" && goal.source_session_id && goal.last_ref_message_id && (
            <Button
              onClick={handleViewChatContext}
              variant="outline"
              size="sm"
              disabled={isUpdating}
              className="w-full glassmorphism border-white/30 text-primary text-xs hover:glow flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3 h-3" />
              View Chat Context
            </Button>
          )}

          {/* Mark Complete Button */}
          {goal.status !== "completed" && (
            <Button
              onClick={markComplete}
              disabled={isUpdating}
              className="w-full glassmorphism border-white/30 text-primary text-sm hover:glow flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </>
              )}
            </Button>
          )}

          {/* Progress Adjustment Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => updateProgress(-10)}
              disabled={isUpdating || goal.progress_percentage <= 0}
              variant="outline"
              size="sm"
              className="glassmorphism border-white/30 text-primary text-xs hover:glow flex-1"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "-10%"}
            </Button>
            <Button
              onClick={() => updateProgress(10)}
              disabled={isUpdating || goal.progress_percentage >= 100}
              size="sm"
              className="glassmorphism border-white/30 text-primary text-xs hover:glow flex-1"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "+10%"}
            </Button>
          </div>
        </div>

        {/* Streak Tracking Button */}
        {goal.is_recurring && (
          <div className="mt-2">
            <Button
              onClick={() => setShowStreakModal(true)}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              className="w-full glassmorphism border-white/30 text-primary text-xs hover:glow flex items-center justify-center gap-2"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              {goal.streak_count > 0 ? `Streak: ${goal.streak_count} days` : 'Track Progress'}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Streak Modal */}
      {goal.is_recurring && (
        <StreakTrackingModal
          goal={goal}
          open={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          onTrack={handleTrackStreak}
        />
      )}
    </motion.div>
  );
}
