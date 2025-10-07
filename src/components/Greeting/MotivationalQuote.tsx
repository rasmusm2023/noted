import { useState } from "react";

interface MotivationalQuoteProps {
  className?: string;
}

// Original quotes preserved for future use
const originalQuotes = [
  "Every day is a new beginning.",
  "Make today count.",
  "Small steps lead to big changes.",
  "You've got this!",
  "Stay focused, stay strong.",
  "Believe in yourself.",
  "Progress over perfection.",
  "Keep pushing forward.",
  "Your potential is limitless.",
  "Make it happen.",
  "Stay positive, stay productive.",
  "You're capable of amazing things.",
  "Focus on progress, not perfection.",
  "Every moment is a fresh start.",
  "Keep going, keep growing.",
  "You're stronger than you think.",
  "Make today amazing.",
  "Stay committed to your goals.",
  "You're making progress every day.",
  "Keep your eyes on the prize.",
  "Stay motivated, stay inspired.",
  "You're doing great!",
  "Keep moving forward.",
  "Stay focused on your goals.",
  "You're capable of great things.",
  "Make today count.",
  "Stay positive, stay productive.",
  "You're making progress every day.",
  "Keep pushing forward.",
  "Stay committed to your goals.",
];

// New quotes to be used
const quotes = [
  "What will you accomplish today?",
  "Let's make an impact.",
  "One step at a time. You've got this.",
  "Progress starts with a small action.",
  "Today is a fresh start.",
  "Keep going. You're building something great.",
  "What matters most right now?",
  "Set your focus. Make it count.",
  "Little by little becomes a lot.",
  "Consistency beats intensity.",
  "A small task done is a win.",
  "One goal. One intention. One win.",
  "You're closer than you think.",
  "Let's keep the momentum going.",
  "Take a breath, then take a step.",
  "Even small progress is real progress.",
  "Today's work shapes tomorrow's success.",
  "You've done hard things before.",
  "It's okay to start small.",
  "Every ticked box builds confidence.",
  "Let's focus on what you can control.",
  "Make space for progress today.",
  "Steady effort creates real change.",
  "Small goals. Big growth.",
  "A calm mind gets things done.",
  "Start where you are.",
  "What would make today feel meaningful?",
  "You're showing up — and that matters.",
  "Make today count. Gently.",
  "Where do you want to go? Start here.",
  "Keep it simple. Keep it moving.",
  "Momentum begins with a click.",
  "Choose one thing to move forward.",
  "Clarity comes from action.",
  "Let's build something steady.",
  "Start small. Stay kind. Show up.",
  "Done is better than perfect.",
  "Let's move your goals forward.",
  "Quiet effort makes loud results.",
  "Focus on progress, not pressure.",
  "Your future self will thank you.",
  "Less rush. More purpose.",
  "One goal at a time.",
  "You're doing better than you think.",
  "Your time. Your pace. Your plan.",
  "Tiny steps. Big picture.",
  "What's one thing you want to feel proud of today?",
  "Give your focus a direction.",
  "Build the habit. Watch it grow.",
  "Show up for yourself today.",
];

export function MotivationalQuote({ className = "" }: MotivationalQuoteProps) {
  const [quote] = useState(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  return (
    <div
      className={`text-base sm:text-lg lg:text-lg text-pri-pur-800 dark:text-neu-gre-300 font-inter font-regular ${className}`}
    >
      {quote}
    </div>
  );
}
