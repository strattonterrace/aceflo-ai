import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress as ProgressEntity } from "@/entities/Progress";
import { Target, CheckCircle2, X, AlertCircle, Loader2, Repeat } from "lucide-react";
import { getRecurrenceSummary } from "../utils/recurrence";

// Smart defaults for weekly recurrence based on times per week
const getSmartWeeklyDefaults = (timesPerWeek) => {
  const defaults = {
    1: { freq: "WEEKLY", interval: 1, byweekday: ["WE"] }, // Wednesday
    2: { freq: "WEEKLY", interval: 1, byweekday: ["TU", "TH"] }, // Tue/Thu
    3: { freq: "WEEKLY", interval: 1, byweekday: ["MO", "WE", "FR"] }, // Mon/Wed/Fri
    4: { freq: "WEEKLY", interval: 1, byweekday: ["MO", "TU", "WE", "TH"] }, // Mon-Thu
    5: { freq: "WEEKLY", interval: 1, byweekday: ["MO", "TU", "WE", "TH", "FR"] }, // Mon-Fri
    6: { freq: "WEEKLY", interval: 1, byweekday: ["MO", "TU", "WE", "TH", "FR", "SA"] }, // Mon-Sat
    7: { freq: "DAILY", interval: 1, byweekday: [] } // Daily
  };
  
  return defaults[timesPerWeek] || defaults[3]; // Default to 3x/week if unknown
};

export default function GoalActionCard({ goalData, messageId, sessionId, onDismiss, onCreated }) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdGoalId, setCreatedGoalId] = useState(null);
  
  // Initialize form data with smart recurrence defaults if cadence is present
  const initializeFormData = useCallback(() => {
    const hasTimesPerWeek = goalData.cadence?.times_per_week;
    const timesPerWeek = hasTimesPerWeek ? parseInt(goalData.cadence.times_per_week) : null;
    
    let initialRepeatRule = null;
    let isRecurring = false;
    
    // If times per week is specified, auto-suggest recurrence
    if (timesPerWeek && timesPerWeek >= 1 && timesPerWeek <= 7) {
      isRecurring = true;
      initialRepeatRule = getSmartWeeklyDefaults(timesPerWeek);
    }
    
    return {
      title: goalData.suggested_goal || "",
      category: goalData.category || "personal",
      cadence: timesPerWeek || "",
      priority: goalData.priority || "medium",
      is_recurring: isRecurring,
      repeat_rule: initialRepeatRule
    };
  }, [goalData]);

  const [formData, setFormData] = useState(initializeFormData);
  const [duplicateGoal, setDuplicateGoal] = useState(null);
  const [linkToExisting, setLinkToExisting] = useState(true);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const checkForDuplicates = useCallback(async () => {
    if (!formData.title || formData.title.length < 3) {
      setDuplicateGoal(null);
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      const existingGoals = await ProgressEntity.filter({
        status: ["planning", "active", "blocked"]
      });

      const similar = existingGoals.find(goal => {
        const titleLower = formData.title.toLowerCase();
        const goalLower = goal.goal.toLowerCase();
        return goalLower.includes(titleLower) || titleLower.includes(goalLower);
      });

      setDuplicateGoal(similar || null);
    } catch (error) {
      console.error("Error checking duplicates:", error);
      setDuplicateGoal(null);
    }
    setIsCheckingDuplicates(false);
  }, [formData.title]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForDuplicates();
    }, 500);

    return () => clearTimeout(timer);
  }, [checkForDuplicates]);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a goal title");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let goalId;
      
      if (duplicateGoal && linkToExisting) {
        await ProgressEntity.update(duplicateGoal.id, {
          source: "chat",
          source_session_id: sessionId,
          last_ref_message_id: messageId
        });

        goalId = duplicateGoal.id;
      } else {
        const goalPayload = {
          goal: formData.title,
          category: formData.category,
          priority: formData.priority,
          cadence_times_per_week: formData.cadence ? parseInt(formData.cadence) : null,
          source: "chat",
          source_session_id: sessionId,
          confidence: goalData.confidence,
          last_ref_message_id: messageId,
          status: "active",
          is_recurring: formData.is_recurring,
          repeat_rule: formData.is_recurring ? formData.repeat_rule : null,
          anchor_date: formData.is_recurring ? new Date().toISOString() : null
        };

        const newGoal = await ProgressEntity.create(goalPayload);
        goalId = newGoal.id;
      }

      setSuccess(true);
      setCreatedGoalId(goalId);
      setIsCreating(false);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      onCreated(goalId);
      
    } catch (error) {
      console.error("Error creating/linking goal:", error);
      setError("Failed to save goal. Please try again.");
      setIsCreating(false);
    }
  };

  if (success || createdGoalId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism rounded-xl p-4 mt-2 border-2 border-green-400/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-primary font-medium">
                {success ? "Goal created successfully!" : "Goal tracked"}
              </p>
              <a
                href={`/Goals?goalId=${createdGoalId}`}
                className="text-sm text-primary hover:text-secondary underline flex items-center gap-1 mt-1"
                onClick={() => console.log('Analytics: goal_action_card_view_goal', { goalId: createdGoalId, from: 'chat' })}
              >
                View Goal →
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="text-secondary hover:text-primary h-6 w-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Get recurrence preview if recurring
  const recurrencePreview = formData.is_recurring && formData.repeat_rule 
    ? getRecurrenceSummary(formData.repeat_rule)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphism rounded-xl p-4 mt-2"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h4 className="text-primary font-medium">Track this goal?</h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          disabled={isCreating}
          className="text-secondary hover:text-primary h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

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

      {/* Duplicate Detection */}
      {isCheckingDuplicates && (
        <div className="mb-4 p-3 glassmorphism rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <p className="text-xs text-secondary">Checking for similar goals...</p>
        </div>
      )}

      {duplicateGoal && !isCheckingDuplicates && (
        <div className="mb-4 p-3 glassmorphism rounded-lg border border-yellow-400/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-primary mb-2">
                Similar goal exists: <span className="font-medium">"{duplicateGoal.goal}"</span>
              </p>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                  <input
                    type="radio"
                    checked={linkToExisting}
                    onChange={() => setLinkToExisting(true)}
                    className="accent-white"
                    disabled={isCreating}
                  />
                  Link to existing goal
                </label>
                <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                  <input
                    type="radio"
                    checked={!linkToExisting}
                    onChange={() => setLinkToExisting(false)}
                    className="accent-white"
                    disabled={isCreating}
                  />
                  Create as new
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-primary text-xs mb-1 block">Goal</Label>
          <Input
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setError(null);
            }}
            placeholder="What do you want to achieve?"
            className="glassmorphism border-white/30 text-primary placeholder:text-tertiary"
            disabled={isCreating}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-primary text-xs mb-1 block">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isCreating}
            >
              <SelectTrigger className="glassmorphism border-white/30 text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="relationships">Relationships</SelectItem>
                <SelectItem value="habit">Habit</SelectItem>
                <SelectItem value="wellbeing">Wellbeing</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-primary text-xs mb-1 block">Times/Week</Label>
            <Input
              type="number"
              value={formData.cadence}
              onChange={(e) => setFormData({ ...formData, cadence: e.target.value })}
              placeholder="Optional"
              className="glassmorphism border-white/30 text-primary placeholder:text-tertiary"
              disabled={isCreating}
              min="1"
              max="7"
            />
          </div>
        </div>

        <div>
          <Label className="text-primary text-xs mb-2 block">Priority</Label>
          <div className="flex gap-2">
            {["low", "medium", "high"].map((priority) => (
              <button
                key={priority}
                onClick={() => setFormData({ ...formData, priority })}
                disabled={isCreating}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  formData.priority === priority
                    ? 'glassmorphism text-primary glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence Preview */}
        {formData.is_recurring && recurrencePreview && (
          <div className="p-3 glassmorphism rounded-lg border border-white/20">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <Repeat className="w-3 h-3" />
              <span className="font-medium">Auto-suggested:</span>
              <span>{recurrencePreview}</span>
            </div>
            <p className="text-xs text-tertiary mt-1">
              You can edit this after creating the goal
            </p>
          </div>
        )}

        <p className="text-xs text-tertiary italic">
          We'll keep you in Chat. You can view this in Goals anytime.
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={onDismiss}
          disabled={isCreating}
          variant="ghost"
          className="flex-1 glassmorphism border-white/30 text-primary hover:glow"
        >
          Not now
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isCreating || !formData.title.trim()}
          className="flex-1 glassmorphism border-white/30 text-primary hover:glow"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {duplicateGoal && linkToExisting ? "Linking..." : "Creating..."}
            </>
          ) : duplicateGoal && linkToExisting ? (
            "Link to Goal"
          ) : (
            "Create Goal"
          )}
        </Button>
      </div>
    </motion.div>
  );
}