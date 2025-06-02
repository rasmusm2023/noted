import { useState } from "react";

const productivityQuotes = [
  "Better than yesterday. That's the vibe.",
  "Chaos? More like spicy progress.",
  "Focus mode: engaged. Interruptions: denied.",
  "You've absolutely got this. Seriously.",
  "Tiny task. Huge win.",
  "Overwhelmed? That's just passion in disguise.",
  "Motivation is overrated. Try snacks.",
  "Forget the big picture. Zoom in.",
  "Messy progress is still progress.",
  "Your future self is fist-bumping you.",
  "You're not behind. You're just charging up.",
  "Deep breath. Tiny step. Boom.",
  "Today's to-do list? Shaking in fear.",
  "Greatness runs on caffeine.",
  "One ticked box = personal triumph.",
  "Going slow still beats going nowhere.",
  "Showing up = winning already.",
  "Click. Done. Victory.",
  "Less chaos. More heck yeah.",
  "Checkmark vibes only.",
  "Magic = 1% effort x daily.",
  "Look who logged in like a legend.",
  "You're not procrastinating. You're incubating genius.",
  "Chaos is creativity's pre-party.",
  "Ignore your inner critic. You're crushing it.",
  "This brain = turbocharged.",
  "Small steps. Giant feels.",
  "You need systems. And maybe cheese.",
  "Today's focus = tomorrow's flex.",
  "Done? Gorgeous.",
  "Oops? More like progress with flair.",
  "Your future self says thanks.",
  "One breath. One step. Let's go.",
  "Treat yourself. You earned it. Cookie optional.",
  "Be a to-do list's worst nightmare.",
  "Overthinking? Under-do one thing.",
  "Panic less. Click more.",
  "Success = you, showing up.",
  "No hustle. Just gentle nudges.",
  "Big dreams love boring routines.",
  "You're buffering. Not broken.",
  "Boss brain status: confirmed.",
  "Your way > the right way.",
  "Planning: it's skincare for your time.",
  "From chaos to clarity. You did that.",
  "Even 10% effort counts. Especially today.",
  "Finish? Nah. Just start.",
  "Low-stakes quest. High XP.",
  "Perfection? Nah. Just Tuesday-level done.",
  "Focus: your actual superpower.",
  "Attention is precious. Spend it weirdly.",
  "Progress > panic. Always.",
  "Tired? Scrappy? Still here. Win.",
  "Energy low? Do one lazy thing.",
  "Tiny wins > big promises.",
  "You're not lazy. You're… prioritizing.",
  "Today = progress. Panic not invited.",
  "Messy start, glorious finish.",
  "Pause. Stretch. Resume.",
  "Half-done is halfway awesome.",
  "Brain stretch: complete.",
  "One box. One hero.",
  "You ≠ your browser tabs.",
  "Structure: boring name, big magic.",
  "Five focused minutes = sorcery.",
  "Breaks: the brain's secret weapon.",
  "Hey you. Still awesome.",
  "It's a marathon. Pack snacks.",
  "Organized? You rebel, you.",
  "Focus is a muscle. Lift daily.",
  "Trying counts. You count.",
  "Overwhelm = your brain asking nicely.",
  "Turn 'meh' into 'heck yeah'.",
  "Mood: winging it.",
  "Your dashboard loves you.",
  "One task. One legend.",
  "Don't downplay what you just nailed.",
  "You're not late. You're fashionably focused.",
  "Idea hurricane? Let's funnel that.",
  "Brain fog? Engage fog lights.",
  "Finish line: somewhere nearish. Start anyway.",
  "Starting > scrolling.",
  "Think less. Click more.",
  "Don't reboot. Just blink.",
  "Less doomscroll. More do-stuff.",
  "Failing? Nah. Just beta testing.",
  "Routine? Let's remix it.",
  "No pressure. Just play.",
  "Clean dashboard = fresh brain vibes.",
  "Click. Shift. Ta-da!",
  "Brain says: 'Please declutter me.'",
  "No perfection. Just presence.",
  "Welcome back, productivity wizard.",
  "Momentum: it's a mood.",
  "Doing it > dreading it.",
  "Keep building. It's working.",
  "Skip the pressure. Keep the progress.",
  "Quiet effort is still loud success.",
  "Not behind. Just dramatic timing.",
  "Focused. Flexible. Freakin' awesome.",
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
      className={`text-base sm:text-lg lg:text-lg text-pri-pur-900 dark:text-neu-gre-400 font-inter font-regular ${className}`}
    >
      {quote}
    </div>
  );
}
