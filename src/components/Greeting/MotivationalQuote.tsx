import { useState } from "react";

const productivityQuotes = [
  "You don't need to be perfect — just a little better than yesterday.",
  "Today's chaos is tomorrow's progress in disguise.",
  "Focus mode: activated. World: please hold.",
  "You've got this. No really, you actually do.",
  "One small task for you, one giant leap for your routine.",
  "Being overwhelmed is a sign you care. Let's organize that energy.",
  "Don't wait for motivation. Create momentum.",
  "Forget the big picture — pixels matter too.",
  "Progress is messy. So is creativity.",
  "Your future self is already high-fiving you.",
  "You're not behind — you're just getting ready to launch.",
  "Breathe. Plan. Conquer.",
  "The to-do list doesn't stand a chance today.",
  "Good things take time. Great things take coffee.",
  "Every ticked-off task is a small revolution.",
  "It's okay to go slow. Forward is forward.",
  "Show up. That's the hardest part anyway.",
  "One click closer to greatness.",
  "Less overwhelm, more 'heck yes.'",
  "Some days are made for checkmarks. This is one of them.",
  "A little progress each day adds up to real magic.",
  "Hey, look at you — logging in like a boss.",
  "You're not procrastinating — you're power charging.",
  "Chaos is just creativity waiting to be sorted.",
  "You're doing better than your inner critic says.",
  "This brain? A powerhouse. This moment? Yours.",
  "Small steps are how mountains move.",
  "You don't need motivation — you need systems. And snacks.",
  "Today's focus is tomorrow's freedom.",
  "Done is beautiful.",
  "Mistakes mean you're learning. Keep glitching forward.",
  "Let's make your future self proud.",
  "One task, one breath, one breakthrough.",
  "Give yourself some credit — and maybe a cookie.",
  "Be the kind of person your to-do list fears.",
  "Overthinking? Try under-doing just one thing.",
  "Keep calm and check it off.",
  "Success looks a lot like showing up.",
  "You don't need to hustle — just nudge.",
  "Big dreams need small routines.",
  "You're not stuck. You're buffering.",
  "You're the boss of your brain — not the other way around.",
  "There's no right way — only your way.",
  "Planning is just self-care in spreadsheet form.",
  "Look at you, turning chaos into clarity.",
  "Even 10% effort moves the needle.",
  "You don't have to finish it all — just start.",
  "Think of this as a low-stakes quest with high XP rewards.",
  "Done is better than perfect. Especially on a Tuesday.",
  "Your focus is your superpower.",
  "Your attention is currency. Spend it wisely.",
  "Make progress, not pressure.",
  "Show up scrappy. Show up tired. Just show up.",
  "Energy low? Pick one small thing. Do it slowly.",
  "Tiny wins > big intentions.",
  "You're not lazy — your brain is just sorting priorities.",
  "Today's vibe: progress without panic.",
  "Start messy, finish proud.",
  "You're allowed to pause. Just don't unplug.",
  "Half-finished is still halfway there.",
  "Think of this as your brain's stretching session.",
  "One checkbox to rule them all.",
  "You're not your distractions.",
  "A little structure makes a lot of difference.",
  "Great things start with five focused minutes.",
  "Breaks are productive too.",
  "Welcome back, legend-in-progress.",
  "Life's a marathon. But hey, we've got a calendar.",
  "Every organized day is a small act of rebellion.",
  "Focus is a skill. And you're leveling up.",
  "You're here. You're trying. That matters.",
  "Overwhelm is not a to-do — it's a signal.",
  "Let's turn 'ugh' into 'done.'",
  "Mood: let's figure it out as we go.",
  "This dashboard believes in you.",
  "One task at a time — the rest can wait.",
  "Don't underestimate what you just did.",
  "You're not late. You're just arriving with flair.",
  "You've got a head full of ideas — now let's park a few.",
  "Brain fog? Let's clear the path.",
  "The finish line isn't far. Start walking.",
  "Sometimes, starting is the real victory.",
  "Think less, start more.",
  "You don't need a reset — just a breath.",
  "Less scrolling, more doing (just for a bit).",
  "You're not failing — you're figuring it out.",
  "Routine doesn't have to be boring. Let's make it yours.",
  "This isn't about pressure. It's about possibility.",
  "Good ideas love clean dashboards.",
  "One click, one shift, one win.",
  "Your brain called. It wants a little order.",
  "Don't aim for a perfect day — aim for a present one.",
  "Hello again, productivity paladin.",
  "There's magic in momentum.",
  "Doing the thing is often easier than avoiding the thing.",
  "Keep going. You're building something real.",
  "No pressure — just progress.",
  "Your effort matters. Even when it's quiet.",
  "You're not falling behind. You're gathering steam.",
  "Focused. Flexible. Unstoppable.",
];

interface MotivationalQuoteProps {
  className?: string;
}

export function MotivationalQuote({ className = "" }: MotivationalQuoteProps) {
  const [quote] = useState(() => {
    return productivityQuotes[
      Math.floor(Math.random() * productivityQuotes.length)
    ];
  });

  return (
    <div
      className={`text-xl text-pri-tea-800 font-outfit font-semibold ${className}`}
    >
      {quote}
    </div>
  );
}
