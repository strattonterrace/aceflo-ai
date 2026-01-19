import React, { useState, useEffect } from "react";
import { Progress as ProgressEntity } from "@/entities/Progress";
import { Session } from "@/entities/Session";
import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ProgressCard from "../components/progress/ProgressCard";
import AddGoalDialog from "../components/progress/AddGoalDialog";
import ProgressStats from "../components/progress/ProgressStats";

export default function ProgressPage() {
  const [goals, setGoals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [goalsData, sessionsData] = await Promise.all([
      ProgressEntity.list("-created_date"),
      Session.list("-created_date", 10)
    ]);
    setGoals(goalsData);
    setSessions(sessionsData);
  };

  const handleAddGoal = async (goalData) => {
    await ProgressEntity.create(goalData);
    loadData();
    setShowAddGoal(false);
  };

  const handleUpdateProgress = async (goalId, updates) => {
    await ProgressEntity.update(goalId, updates);
    loadData();
  };

  const handleEditGoal = async (goalId, goalData) => {
    await ProgressEntity.update(goalId, goalData);
    loadData();
    setEditingGoal(null);
    setShowAddGoal(false);
  };

  const handleSaveGoal = async (goalIdOrData, goalData) => {
    if (typeof goalIdOrData === 'string') {
      await handleEditGoal(goalIdOrData, goalData);
    } else {
      await handleAddGoal(goalIdOrData);
    }
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setShowAddGoal(true);
  };

  const handleCloseDialog = () => {
    setShowAddGoal(false);
    setEditingGoal(null);
  };

  const categories = ["all", "career", "relationships", "health", "personal", "creative", "financial"];
  
  const filteredGoals = selectedCategory === "all" 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">Progress Tracking</h1>
              <p className="text-secondary">Monitor your goals and celebrate wins</p>
            </div>
            <Button
              onClick={() => setShowAddGoal(true)}
              className="glassmorphism border-white/30 text-primary hover:glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <ProgressStats goals={goals} sessions={sessions} />

        {/* Category Filters */}
        <div className="glassmorphism rounded-xl p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'glassmorphism text-primary glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredGoals.map((goal) => (
              <ProgressCard
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdateProgress}
                onEdit={handleOpenEdit}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredGoals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="glassmorphism rounded-2xl p-8 max-w-md mx-auto">
              <Target className="w-12 h-12 text-primary mx-auto mb-4 opacity-70" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Goals Yet</h3>
              <p className="text-secondary mb-4">
                Start tracking your progress by adding your first goal
              </p>
              <Button
                onClick={() => setShowAddGoal(true)}
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Goal
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <AddGoalDialog
        open={showAddGoal}
        onClose={handleCloseDialog}
        onSave={handleSaveGoal}
        goal={editingGoal}
      />
    </div>
  );
}