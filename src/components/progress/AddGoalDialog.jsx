
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Repeat } from "lucide-react";

export default function AddGoalDialog({ open, onClose, onSave, goal = null }) {
  const [formData, setFormData] = useState({
    goal: "",
    category: "",
    priority: "medium",
    target_date: "",
    notes: "",
    next_steps: [""],
    is_recurring: false,
    repeat_rule: {
      freq: "WEEKLY",
      interval: 1,
      byweekday: [],
      bymonthday: null,
      until: null,
      count: null
    }
  });
  const [repeatEnds, setRepeatEnds] = useState("never"); // never, on_date, after_count

  // Initialize form with goal data when editing or reset for new goal
  useEffect(() => {
    if (goal && open) { // Only set if goal exists and dialog is open (to avoid setting old data when dialog closes)
      setFormData({
        goal: goal.goal || "",
        category: goal.category || "",
        priority: goal.priority || "medium",
        target_date: goal.target_date?.split('T')[0] || "", // Format date for input type="date"
        notes: goal.notes || "",
        next_steps: goal.next_steps?.length > 0 ? goal.next_steps : [""],
        is_recurring: goal.is_recurring || false,
        repeat_rule: goal.repeat_rule ? {
          freq: goal.repeat_rule.freq || "WEEKLY",
          interval: goal.repeat_rule.interval || 1,
          byweekday: goal.repeat_rule.byweekday || [],
          bymonthday: goal.repeat_rule.bymonthday || null,
          until: goal.repeat_rule.until || null,
          count: goal.repeat_rule.count || null
        } : {
          freq: "WEEKLY",
          interval: 1,
          byweekday: [],
          bymonthday: null,
          until: null,
          count: null
        }
      });

      // Set repeat ends state based on existing goal's repeat rule
      if (goal.repeat_rule?.until) {
        setRepeatEnds("on_date");
      } else if (goal.repeat_rule?.count) {
        setRepeatEnds("after_count");
      } else {
        setRepeatEnds("never");
      }
    } else if (!goal && open) { // Reset form for new goal when dialog opens without a goal
      setFormData({
        goal: "",
        category: "",
        priority: "medium",
        target_date: "",
        notes: "",
        next_steps: [""],
        is_recurring: false,
        repeat_rule: {
          freq: "WEEKLY",
          interval: 1,
          byweekday: [],
          bymonthday: null,
          until: null,
          count: null
        }
      });
      setRepeatEnds("never");
    }
  }, [goal, open]);


  const handleSubmit = (e) => {
    e.preventDefault();

    const goalData = {
      ...formData,
      next_steps: formData.next_steps.filter(step => step.trim() !== ""),
      repeat_rule: formData.is_recurring ? formData.repeat_rule : null,
      // `anchor_date` is the effective start date for recurrence, if target_date is not set, use today
      anchor_date: formData.is_recurring ? (formData.target_date ? new Date(formData.target_date).toISOString() : new Date().toISOString()) : null
    };

    // If editing, include the goal ID in the onSave call
    if (goal) {
      onSave(goal.id, goalData);
    } else {
      onSave(goalData);
    }

    // Do not reset form here, let the parent component handle closing the dialog
    // which, in turn, will trigger the useEffect to reset if `goal` becomes null for the next open.
  };

  const updateNextStep = (index, value) => {
    const newSteps = [...formData.next_steps];
    newSteps[index] = value;
    setFormData({ ...formData, next_steps: newSteps });
  };

  const addNextStep = () => {
    setFormData({
      ...formData,
      next_steps: [...formData.next_steps, ""]
    });
  };

  const updateRepeatRule = (key, value) => {
    setFormData({
      ...formData,
      repeat_rule: {
        ...formData.repeat_rule,
        [key]: value
      }
    });
  };

  const toggleWeekday = (day) => {
    const byweekday = formData.repeat_rule.byweekday || [];
    const newWeekdays = byweekday.includes(day)
      ? byweekday.filter(d => d !== day)
      : [...byweekday, day];
    updateRepeatRule('byweekday', newWeekdays);
  };

  const getRepeatPreview = () => {
    if (!formData.is_recurring) return "";

    const { freq, interval, byweekday, bymonthday } = formData.repeat_rule;
    let preview = "Repeats ";

    if (freq === "DAILY") {
      preview += interval === 1 ? "daily" : `every ${interval} days`;
    } else if (freq === "WEEKLY") {
      const days = byweekday.length > 0
        ? `on ${byweekday.map(d => weekdays.find(w => w.short === d)?.label || d).join(", ")}`
        : "weekly";
      preview += interval === 1 ? `weekly ${days}` : `every ${interval} weeks ${days}`;
    } else if (freq === "MONTHLY") {
      preview += bymonthday
        ? `monthly on day ${bymonthday}`
        : interval === 1 ? "monthly" : `every ${interval} months`;
    } else if (freq === "YEARLY") {
      preview += interval === 1 ? "yearly" : `every ${interval} years`;
    } else if (freq === "CUSTOM") {
      // CUSTOM freq in formData indicates a custom interval for DAILY, WEEKLY, MONTHLY, YEARLY
      // The select for CUSTOM freq is actually selecting the unit (Day(s), Week(s), etc.)
      // so this logic needs to be aligned with the actual `freq` used in the repeat rule,
      // which is set by the nested select in the UI.
      const actualFreq = formData.repeat_rule.freq; // This will be DAILY, WEEKLY, etc.
      if (actualFreq === "DAILY") {
        preview += `every ${interval} day${interval > 1 ? 's' : ''}`;
      } else if (actualFreq === "WEEKLY") {
        const days = byweekday.length > 0
          ? `on ${byweekday.map(d => weekdays.find(w => w.short === d)?.label || d).join(", ")}`
          : "weekly";
        preview += `every ${interval} week${interval > 1 ? 's' : ''} ${days}`;
      } else if (actualFreq === "MONTHLY") {
        preview += bymonthday
          ? `monthly on day ${bymonthday}`
          : `every ${interval} month${interval > 1 ? 's' : ''}`;
      } else if (actualFreq === "YEARLY") {
        preview += `every ${interval} year${interval > 1 ? 's' : ''}`;
      }
    }

    if (repeatEnds === "on_date" && formData.repeat_rule.until) {
      preview += ` — until ${new Date(formData.repeat_rule.until).toLocaleDateString()}`;
    } else if (repeatEnds === "after_count" && formData.repeat_rule.count) {
      preview += ` — for ${formData.repeat_rule.count} times`;
    } else {
      preview += " — forever";
    }

    return preview;
  };

  const weekdays = [
    { short: "MO", label: "Mon" },
    { short: "TU", label: "Tue" },
    { short: "WE", label: "Wed" },
    { short: "TH", label: "Thu" },
    { short: "FR", label: "Fri" },
    { short: "SA", label: "Sat" },
    { short: "SU", label: "Sun" }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glassmorphism border-white/30 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {goal ? "Edit Goal" : "Add New Goal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white/80">Goal</Label>
            <Input
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="What do you want to achieve?"
              className="glassmorphism border-white/30 text-white placeholder:text-white/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/80">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger className="glassmorphism border-white/30 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                  <SelectItem value="wellbeing">Wellbeing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/80">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="glassmorphism border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white/80">Target Date (Optional)</Label>
            <Input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="glassmorphism border-white/30 text-white"
            />
          </div>

          {/* Repeat Section */}
          <div className="glassmorphism rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                className="border-white/30"
              />
              <Label htmlFor="is_recurring" className="text-white/80 flex items-center gap-2 cursor-pointer">
                <Repeat className="w-4 h-4" />
                Repeat
              </Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-3 mt-3">
                {/* Frequency */}
                <div>
                  <Label className="text-white/70 text-sm">Frequency</Label>
                  <Select
                    value={formData.repeat_rule.freq}
                    onValueChange={(value) => {
                      updateRepeatRule('freq', value);
                      // Reset byweekday/bymonthday if freq changes to something not requiring them
                      if (value !== "WEEKLY") updateRepeatRule('byweekday', []);
                      if (value !== "MONTHLY") updateRepeatRule('bymonthday', null);
                    }}
                  >
                    <SelectTrigger className="glassmorphism border-white/30 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                      {/* <SelectItem value="CUSTOM">Custom</SelectItem> // Removed, simplified to just interval for current freq */}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interval */}
                {formData.repeat_rule.freq !== "DAILY" && ( // Always show for Daily, but not with text "Every 1 Day(s)"
                  <div>
                    <Label className="text-white/70 text-sm">Every</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={formData.repeat_rule.interval}
                        onChange={(e) => updateRepeatRule('interval', parseInt(e.target.value))}
                        className="glassmorphism border-white/30 text-white text-sm w-20"
                      />
                      <span className="text-white/70 text-sm flex items-center">
                        {formData.repeat_rule.freq.toLowerCase()}{formData.repeat_rule.interval > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}


                {/* Weekday picker (for weekly) */}
                {formData.repeat_rule.freq === "WEEKLY" && (
                  <div>
                    <Label className="text-white/70 text-sm mb-2 block">On days</Label>
                    <div className="flex gap-1">
                      {weekdays.map((day) => (
                        <button
                          key={day.short}
                          type="button"
                          onClick={() => toggleWeekday(day.short)}
                          className={`w-9 h-9 rounded-full text-xs transition-all ${
                            formData.repeat_rule.byweekday?.includes(day.short)
                              ? 'glassmorphism text-white glow'
                              : 'text-white/50 hover:text-white/80 border border-white/20'
                          }`}
                        >
                          {day.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Month day (for monthly) */}
                {formData.repeat_rule.freq === "MONTHLY" && (
                  <div>
                    <Label className="text-white/70 text-sm">On day of month</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.repeat_rule.bymonthday || ""}
                      onChange={(e) => updateRepeatRule('bymonthday', parseInt(e.target.value))}
                      placeholder="15"
                      className="glassmorphism border-white/30 text-white text-sm"
                    />
                  </div>
                )}

                {/* Ends */}
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Ends</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ends_never"
                        checked={repeatEnds === "never"}
                        onCheckedChange={() => {
                          setRepeatEnds("never");
                          updateRepeatRule('until', null);
                          updateRepeatRule('count', null);
                        }}
                        className="border-white/30"
                      />
                      <Label htmlFor="ends_never" className="text-white/70 text-sm cursor-pointer">
                        Never
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ends_on_date"
                        checked={repeatEnds === "on_date"}
                        onCheckedChange={(checked) => {
                          setRepeatEnds(checked ? "on_date" : "never");
                          if (!checked) {
                            updateRepeatRule('until', null);
                          } else {
                            // Automatically set a default date if previously not set
                            if (!formData.repeat_rule.until) {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              updateRepeatRule('until', tomorrow.toISOString());
                            }
                            updateRepeatRule('count', null);
                          }
                        }}
                        className="border-white/30"
                      />
                      <Label htmlFor="ends_on_date" className="text-white/70 text-sm cursor-pointer">
                        On
                      </Label>
                      {repeatEnds === "on_date" && (
                        <Input
                          type="date"
                          value={formData.repeat_rule.until ? formData.repeat_rule.until.split('T')[0] : ""}
                          onChange={(e) => {
                            updateRepeatRule('until', e.target.value ? new Date(e.target.value).toISOString() : null);
                            updateRepeatRule('count', null);
                          }}
                          className="glassmorphism border-white/30 text-white text-sm flex-1"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ends_after"
                        checked={repeatEnds === "after_count"}
                        onCheckedChange={(checked) => {
                          setRepeatEnds(checked ? "after_count" : "never");
                          if (!checked) {
                            updateRepeatRule('count', null);
                          } else {
                            // Automatically set a default count if previously not set
                            if (!formData.repeat_rule.count) {
                              updateRepeatRule('count', 10);
                            }
                            updateRepeatRule('until', null);
                          }
                        }}
                        className="border-white/30"
                      />
                      <Label htmlFor="ends_after" className="text-white/70 text-sm cursor-pointer">
                        After
                      </Label>
                      {repeatEnds === "after_count" && (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={formData.repeat_rule.count || ""}
                            onChange={(e) => {
                              updateRepeatRule('count', parseInt(e.target.value));
                              updateRepeatRule('until', null);
                            }}
                            placeholder="10"
                            className="glassmorphism border-white/30 text-white text-sm w-20"
                          />
                          <span className="text-white/70 text-sm">times</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="text-xs text-white/60 italic mt-2">
                  {getRepeatPreview()}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-white/80">Next Steps</Label>
            {formData.next_steps.map((step, index) => (
              <Input
                key={index}
                value={step}
                onChange={(e) => updateNextStep(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                className="glassmorphism border-white/30 text-white placeholder:text-white/50 mb-2"
              />
            ))}
            <Button
              type="button"
              onClick={addNextStep}
              variant="outline"
              size="sm"
              className="glassmorphism border-white/30 text-white hover:glow"
            >
              Add Step
            </Button>
          </div>

          <div>
            <Label className="text-white/80">Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional context or motivation"
              className="glassmorphism border-white/30 text-white placeholder:text-white/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 glassmorphism border-white/30 text-white hover:glow"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 glassmorphism border-white/30 text-white hover:glow"
            >
              {goal ? "Save Changes" : "Add Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
