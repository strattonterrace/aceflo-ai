import React, { useState, useEffect } from "react";
import { Progress as ProgressEntity } from "@/entities/Progress";
import { WeeklyReflection } from "@/entities/WeeklyReflection";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  Flame, 
  Calendar,
  Sparkles,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, eachDayOfInterval } from "date-fns";

const REFLECTION_PROMPTS = [
  "What felt easiest this week?",
  "What drained you most?",
  "What surprised you about your progress?",
  "What would you do differently next week?",
  "What are you most proud of this week?",
  "Where did you show up for yourself?",
  "What habit is starting to stick?",
  "What do you need more of next week?"
];

export default function DashboardPage() {
  const [goals, setGoals] = useState([]);
  const [weeklyReflection, setWeeklyReflection] = useState(null);
  const [reflectionText, setReflectionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const goalsData = await ProgressEntity.list("-created_date");
    setGoals(goalsData);

    // Get current week's reflection
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const reflections = await WeeklyReflection.filter({
      week_start_date: format(weekStart, 'yyyy-MM-dd')
    });

    if (reflections.length > 0) {
      setWeeklyReflection(reflections[0]);
      setReflectionText(reflections[0].text);
      setCurrentPrompt(reflections[0].prompt);
    } else {
      // Pick a random prompt for this week
      const prompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
      setCurrentPrompt(prompt);
    }
  };

  const saveReflection = async () => {
    if (!reflectionText.trim()) return;
    
    setIsSaving(true);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    if (weeklyReflection) {
      await WeeklyReflection.update(weeklyReflection.id, { text: reflectionText });
    } else {
      await WeeklyReflection.create({
        text: reflectionText,
        prompt: currentPrompt,
        week_start_date: format(weekStart, 'yyyy-MM-dd')
      });
    }
    
    setIsSaving(false);
    loadData();
  };

  // Calculate week stats
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const goalsThisWeek = goals.filter(goal => {
    if (!goal.target_date) return false;
    const targetDate = new Date(goal.target_date);
    return isWithinInterval(targetDate, { start: weekStart, end: weekEnd });
  });

  const completedThisWeek = goals.filter(goal => {
    if (goal.status !== "completed") return false;
    const completedDate = new Date(goal.updated_date);
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
  });

  const recurringGoals = goals.filter(g => g.is_recurring);
  const totalStreak = recurringGoals.reduce((sum, g) => sum + (g.streak_count || 0), 0);

  // Calculate completion history for chart
  const last7Days = eachDayOfInterval({
    start: subDays(now, 6),
    end: now
  });

  const chartData = last7Days.map(day => {
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day.setHours(23, 59, 59, 999));
    
    const completedOnDay = goals.filter(goal => {
      if (goal.status !== "completed") return false;
      const completedDate = new Date(goal.updated_date);
      return completedDate >= dayStart && completedDate <= dayEnd;
    }).length;

    return {
      day: format(day, 'EEE'),
      completed: completedOnDay
    };
  });

  // Get wins
  const wins = completedThisWeek.slice(0, 5);
  const streakMilestones = recurringGoals.filter(g => 
    g.streak_count > 0 && g.streak_count % 7 === 0
  );

  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 glassmorphism rounded-xl flex items-center justify-center glow">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Your Week in Focus</h1>
              <p className="text-secondary text-lg">
                See where you're winning, what's waiting, and where to push forward.
              </p>
            </div>
          </div>
        </div>

        {/* Week at a Glance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-xl p-6 hover:glow transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 glassmorphism rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-primary font-medium">Goals This Week</h3>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">
              {goalsThisWeek.length}
            </div>
            <p className="text-sm text-tertiary">
              {goalsThisWeek.filter(g => g.status !== "completed").length} still open
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glassmorphism rounded-xl p-6 hover:glow transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 glassmorphism rounded-lg">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-primary font-medium">Active Streaks</h3>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">
              {totalStreak}
            </div>
            <p className="text-sm text-tertiary">
              {recurringGoals.filter(g => g.streak_count > 0).length} goals on fire
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glassmorphism rounded-xl p-6 hover:glow transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 glassmorphism rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-primary font-medium">Completed</h3>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">
              {completedThisWeek.length}
            </div>
            <p className="text-sm text-tertiary">
              goals finished this week
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* This Week's Wins */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-semibold text-primary">This Week's Wins</h3>
            </div>

            {wins.length > 0 ? (
              <div className="space-y-3">
                {wins.map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="glassmorphism rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-primary font-medium">{win.goal}</p>
                        <Badge className="mt-2 text-xs bg-green-100 text-green-800">
                          {win.category}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {streakMilestones.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="glassmorphism rounded-lg p-4 border-2 border-orange-400/30"
                  >
                    <div className="flex items-start gap-3">
                      <Flame className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-primary font-medium">Streak Milestone! 🎉</p>
                        <p className="text-sm text-secondary mt-1">
                          {streakMilestones[0].streak_count} days on "{streakMilestones[0].goal}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-tertiary mx-auto mb-3" />
                <p className="text-tertiary">Your wins will appear here as you complete goals</p>
              </div>
            )}
          </motion.div>

          {/* Reflection Prompt */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glassmorphism rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-semibold text-primary">Pause & Reflect</h3>
            </div>

            <p className="text-primary mb-4 text-lg font-medium">
              {currentPrompt}
            </p>

            <Textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Take a moment to reflect..."
              className="glassmorphism border-white/30 text-primary placeholder:text-tertiary min-h-[120px] mb-4"
            />

            <Button
              onClick={saveReflection}
              disabled={isSaving || !reflectionText.trim()}
              className="w-full glassmorphism border-white/30 text-primary hover:glow"
            >
              {isSaving ? "Saving..." : weeklyReflection ? "Update Reflection" : "Save Reflection"}
            </Button>

            {weeklyReflection && (
              <p className="text-xs text-tertiary mt-2 text-center">
                Last updated {format(new Date(weeklyReflection.updated_date), 'MMM d, h:mm a')}
              </p>
            )}
          </motion.div>
        </div>

        {/* Visual Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-primary">Completed Goals (Last 7 Days)</h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.2)" />
              <XAxis 
                dataKey="day" 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}