
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Progress as ProgressEntity } from "@/entities/Progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Repeat,
  Pencil,
  Flame,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { computeNextOccurrence, getRecurrenceSummary, getEndSummary, getNotificationData } from "../components/utils/recurrence";
import AddGoalDialog from "../components/progress/AddGoalDialog";
import StreakTrackingModal from "../components/progress/StreakTrackingModal";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_date");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [trackingGoal, setTrackingGoal] = useState(null);
  const [highlightedGoalId, setHighlightedGoalId] = useState(null);
  const goalRefs = useRef({});

  const loadGoals = useCallback(async () => {
    const data = await ProgressEntity.list(`-${sortBy}`);
    setGoals(data);
  }, [sortBy]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Handle deep link from Chat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const goalId = urlParams.get('goalId');
    
    if (goalId && goals.length > 0) {
      const goal = goals.find(g => g.id === goalId);
      
      if (goal) {
        // Scroll to goal
        setTimeout(() => {
          const element = goalRefs.current[goalId];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight for 1.2s
            setHighlightedGoalId(goalId);
            setTimeout(() => setHighlightedGoalId(null), 1200);
            
            // Analytics
            console.log('Analytics: deep_link_view_goal', { goalId, from: 'chat' });
          }
        }, 100);
      } else {
        // Goal not found - show toast
        showToast("Goal no longer exists", "error");
      }
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [goals]);

  const showToast = (message, type = "success") => {
    // Simple toast implementation (you can enhance with a library like sonner later)
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 glassmorphism rounded-lg px-6 py-3 z-50 ${
      type === "error" ? "border-2 border-red-400/30" : "border-2 border-green-400/30"
    }`;
    toast.innerHTML = `<p class="text-primary text-sm">${message}</p>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.goal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || goal.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      career: "bg-blue-100 text-blue-800",
      relationships: "bg-pink-100 text-pink-800",
      health: "bg-green-100 text-green-800",
      personal: "bg-purple-100 text-purple-800",
      creative: "bg-orange-100 text-orange-800",
      financial: "bg-yellow-100 text-yellow-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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

  const updateGoal = async (goalId, updates) => {
    await ProgressEntity.update(goalId, updates);
    loadGoals();
  };

  const handleEditGoal = async (goalId, goalData) => {
    await ProgressEntity.update(goalId, goalData);
    loadGoals();
    setShowEditDialog(false);
    setEditingGoal(null);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setShowEditDialog(true);
  };

  const handleTrackStreak = async (goalId, updates) => {
    await ProgressEntity.update(goalId, updates);
    loadGoals();
    setShowStreakModal(false);
    setTrackingGoal(null);
  };

  const handleOpenStreakModal = (goal) => {
    setTrackingGoal(goal);
    setShowStreakModal(true);
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">Goals Overview</h1>
              <p className="text-secondary">Manage and track all your objectives</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Target className="w-4 h-4" />
              {goals.length} total goals
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glassmorphism rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search goals..."
                className="pl-10 glassmorphism border-white/30 text-primary placeholder:text-tertiary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glassmorphism border border-white/30 rounded-md px-3 py-2 text-primary bg-transparent"
            >
              <option value="all" className="bg-gray-800">All Statuses</option>
              <option value="planning" className="bg-gray-800">Planning</option>
              <option value="active" className="bg-gray-800">Active</option>
              <option value="blocked" className="bg-gray-800">Blocked</option>
              <option value="completed" className="bg-gray-800">Completed</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glassmorphism border border-white/30 rounded-md px-3 py-2 text-primary bg-transparent"
            >
              <option value="all" className="bg-gray-800">All Categories</option>
              <option value="career" className="bg-gray-800">Career</option>
              <option value="relationships" className="bg-gray-800">Relationships</option>
              <option value="health" className="bg-gray-800">Health</option>
              <option value="personal" className="bg-gray-800">Personal</option>
              <option value="creative" className="bg-gray-800">Creative</option>
              <option value="financial" className="bg-gray-800">Financial</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glassmorphism border border-white/30 rounded-md px-3 py-2 text-primary bg-transparent"
            >
              <option value="created_date" className="bg-gray-800">Created Date</option>
              <option value="progress_percentage" className="bg-gray-800">Progress</option>
              <option value="target_date" className="bg-gray-800">Target Date</option>
              <option value="priority" className="bg-gray-800">Priority</option>
            </select>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredGoals.map((goal) => {
              const nextOccurrence = goal.is_recurring && goal.anchor_date
                ? computeNextOccurrence(goal.anchor_date, goal.repeat_rule)
                : null;
              const isEnded = goal.is_recurring && !nextOccurrence;
              
              // Notification-ready data (available for future notification system)
              const notificationData = goal.is_recurring ? getNotificationData(goal) : null;

              const isHighlighted = highlightedGoalId === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  ref={el => goalRefs.current[goal.id] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`glassmorphism rounded-xl p-6 transition-all duration-300 ${
                    isHighlighted ? 'ring-2 ring-white/50 glow shadow-2xl' : 'hover:glow'
                  }`}
                  data-notification-ready={notificationData ? JSON.stringify(notificationData) : null}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {goal.goal}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                        <Badge variant="outline" className={`border-white/30 ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </Badge>
                        <Badge variant="outline" className="border-white/30 text-secondary">
                          {goal.priority} priority
                        </Badge>
                        {goal.is_recurring && (
                          <Badge variant="outline" className="border-white/30 text-secondary flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            {getRecurrenceSummary(goal.repeat_rule)}
                          </Badge>
                        )}
                        {goal.streak_count > 0 && (
                          <Badge variant="outline" className="border-white/30 text-secondary flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {goal.streak_count} day streak
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {goal.progress_percentage}%
                        </div>
                        {goal.target_date && !goal.is_recurring && (
                          <div className="flex items-center gap-1 text-xs text-secondary">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="text-secondary hover:text-primary transition-colors"
                        aria-label="Edit Goal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Progress value={goal.progress_percentage} className="h-2 bg-white/10" />
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

                  {/* Next Steps */}
                  {goal.next_steps && goal.next_steps.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-secondary mb-2">Next Steps:</h4>
                      <ul className="space-y-1">
                        {goal.next_steps.slice(0, 3).map((step, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                            <span className="text-tertiary mt-1">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Blockers */}
                  {goal.blockers && goal.status === "blocked" && (
                    <div className="mb-4 p-3 glassmorphism rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Current Blocker</span>
                      </div>
                      <p className="text-sm text-secondary">{goal.blockers}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {goal.notes && (
                    <div className="text-sm text-secondary italic">
                      "{goal.notes}"
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-2 mt-4">
                    {/* Mark Complete Button */}
                    {goal.status !== "completed" && (
                      <Button
                        onClick={() => updateGoal(goal.id, { progress_percentage: 100, status: "completed" })}
                        className="w-full glassmorphism border-white/30 text-primary text-sm hover:glow flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </Button>
                    )}

                    {/* Other Actions Row */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateGoal(goal.id, { progress_percentage: Math.min(100, goal.progress_percentage + 10) })}
                        size="sm"
                        className="glassmorphism border-white/30 text-primary text-xs hover:glow flex-1"
                        disabled={goal.progress_percentage >= 100}
                      >
                        +10% Progress
                      </Button>
                      {goal.status !== "completed" && (
                        <Button
                          onClick={() => updateGoal(goal.id, {
                            status: goal.status === "active" ? "blocked" : "active"
                          })}
                          variant="outline"
                          size="sm"
                          className="glassmorphism border-white/30 text-primary text-xs hover:glow flex-1"
                        >
                          {goal.status === "active" ? "Mark Blocked" : "Activate"}
                        </Button>
                      )}
                      {goal.is_recurring && (
                        <Button
                          onClick={() => handleOpenStreakModal(goal)}
                          variant="outline"
                          size="sm"
                          className="glassmorphism border-white/30 text-primary text-xs hover:glow flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3 text-orange-400" />
                          {goal.streak_count > 0 ? `${goal.streak_count}` : 'Track'}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredGoals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="glassmorphism rounded-2xl p-8 max-w-md mx-auto">
              <Filter className="w-12 h-12 text-primary mx-auto mb-4 opacity-70" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Goals Found</h3>
              <p className="text-secondary">
                Try adjusting your filters or search terms
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <AddGoalDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingGoal(null);
        }}
        onSave={handleEditGoal}
        goal={editingGoal}
      />

      {/* Streak Tracking Modal */}
      {trackingGoal && (
        <StreakTrackingModal
          goal={trackingGoal}
          open={showStreakModal}
          onClose={() => {
            setShowStreakModal(false);
            setTrackingGoal(null);
          }}
          onTrack={(updates) => handleTrackStreak(trackingGoal.id, updates)}
        />
      )}
    </div>
  );
}
