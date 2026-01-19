/**
 * Compute the next occurrence of a recurring goal based on repeat_rule and anchor_date
 */
export function computeNextOccurrence(anchorDate, repeatRule, now = new Date()) {
  if (!anchorDate || !repeatRule) return null;

  const anchor = new Date(anchorDate);
  const { freq, interval = 1, byweekday = [], bymonthday, until, count } = repeatRule;

  // If ended by date
  if (until && new Date(until) < now) return null;

  let next = new Date(anchor);
  let occurrences = 0;

  // Find the next occurrence after now
  while (next <= now && (!count || occurrences < count)) {
    occurrences++;
    
    if (freq === "DAILY" || freq === "CUSTOM") {
      next.setDate(next.getDate() + interval);
    } else if (freq === "WEEKLY") {
      next.setDate(next.getDate() + (interval * 7));
    } else if (freq === "MONTHLY") {
      next.setMonth(next.getMonth() + interval);
      if (bymonthday) {
        next.setDate(bymonthday);
      }
    } else if (freq === "YEARLY") {
      next.setFullYear(next.getFullYear() + interval);
    }

    // Check if we've exceeded count
    if (count && occurrences >= count) return null;
  }

  // Check if next occurrence is past until date
  if (until && next > new Date(until)) return null;

  return next;
}

/**
 * Get a human-readable recurrence summary
 */
export function getRecurrenceSummary(repeatRule) {
  if (!repeatRule) return "";

  const { freq, interval = 1, byweekday = [], bymonthday } = repeatRule;

  if (freq === "DAILY") {
    return interval === 1 ? "Daily" : `Every ${interval} days`;
  }

  if (freq === "WEEKLY") {
    const days = byweekday.length > 0 ? ` (${byweekday.join(", ")})` : "";
    return interval === 1 ? `Weekly${days}` : `Every ${interval} weeks${days}`;
  }

  if (freq === "MONTHLY") {
    const day = bymonthday ? ` (day ${bymonthday})` : "";
    return interval === 1 ? `Monthly${day}` : `Every ${interval} months${day}`;
  }

  if (freq === "YEARLY") {
    return interval === 1 ? "Yearly" : `Every ${interval} years`;
  }

  if (freq === "CUSTOM") {
    return `Every ${interval} ${interval === 1 ? 'day' : 'days'}`;
  }

  return "";
}

/**
 * Get end summary text
 */
export function getEndSummary(repeatRule) {
  if (!repeatRule) return "";

  const { until, count } = repeatRule;

  if (until) {
    const endDate = new Date(until);
    return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (count) {
    return `after ${count} times`;
  }

  return "never";
}

/**
 * Get notification-ready data for a recurring goal
 * Returns structured data for email/SMS notifications
 */
export function getNotificationData(goal) {
  if (!goal.is_recurring || !goal.anchor_date || !goal.repeat_rule) {
    return null;
  }

  const nextOccurrence = computeNextOccurrence(goal.anchor_date, goal.repeat_rule);
  
  return {
    next_occurrence_iso: nextOccurrence ? nextOccurrence.toISOString() : null,
    next_occurrence_friendly: nextOccurrence ? nextOccurrence.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }) : null,
    repeat_human_summary: getRecurrenceSummary(goal.repeat_rule),
    ends_summary: getEndSummary(goal.repeat_rule),
    streak_count: goal.streak_count || 0,
    is_ended: !nextOccurrence,
    goal_title: goal.goal,
    category: goal.category,
    priority: goal.priority
  };
}