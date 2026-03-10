import { useEffect, useState } from "react";

const GREETINGS_BY_PERIOD: Record<string, string[]> = {
  night: [
    "Still up, {name}? Tell me.",
    "What's on your mind, {name}?",
    "Night thoughts, {name}—what's up?",
  ],
  earlyMorning: [
    "Rise and shine, {name}. What's first?",
    "Early bird, {name}—what's brewing?",
    "{name}, morning's here. What's first?",
  ],
  morning: [
    "What's on your mind, {name}?",
    "{name}, ready for the day?",
    "Morning, {name}—what are we tackling?",
  ],
  midday: [
    "Lunch break, {name}—what's the question?",
    "Noon, {name}. What's up?",
    "Midday—what's on your mind, {name}?",
  ],
  afternoon: [
    "Afternoon, {name}—what's on your mind?",
    "{name}, how's it going?",
    "Second half, {name}. What's the thought?",
  ],
  evening: [
    "Unwind time, {name}. What's up?",
    "Evening, {name}—what's on your mind?",
    "Winding down, {name}—what's up?",
  ],
  lateEvening: [
    "Night owl, {name}. What's up?",
    "One more thought, {name}?",
    "Quiet hours, {name}—what's on your mind?",
  ],
};

function getPeriod(hour: number): keyof typeof GREETINGS_BY_PERIOD {
  if (hour >= 0 && hour < 5) return "night";
  if (hour >= 5 && hour < 9) return "earlyMorning";
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "lateEvening";
}

function pickGreeting(period: keyof typeof GREETINGS_BY_PERIOD): string {
  const options = GREETINGS_BY_PERIOD[period];
  return options[Math.floor(Math.random() * options.length)]!;
}

/**
 * Returns a time-based greeting template that updates with local time.
 * Templates include a {name} placeholder—replace with the user's display name in the UI.
 * Refreshes every hour.
 */
export function useTimeBasedGreeting(): string {
  const [greeting, setGreeting] = useState(() => {
    const hour = new Date().getHours();
    const period = getPeriod(hour);
    return pickGreeting(period);
  });

  useEffect(() => {
    const update = () => {
      const hour = new Date().getHours();
      const period = getPeriod(hour);
      setGreeting(pickGreeting(period));
    };

    update();

    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return greeting;
}
