import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import timerCompleteSound from "../../assets/sounds/timer-complete.mp3";

interface TimeInterval {
  label: string;
  minutes: number;
}

interface PomodoroTimerProps {
  onClose: () => void;
}

const timeIntervals: TimeInterval[] = [
  { label: "Pomodoro", minutes: 25 },
  { label: "Short Break", minutes: 5 },
  { label: "Long Break", minutes: 15 },
  { label: "1 Hour", minutes: 60 },
  { label: "2 Hours", minutes: 120 },
];

export const PomodoroTimer = ({ onClose }: PomodoroTimerProps) => {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(
    timeIntervals[0]
  );
  const [timeLeft, setTimeLeft] = useState<number>(
    selectedInterval.minutes * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstFocusableElement.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === "granted");
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (hasPermission) {
      new Notification("Pomodoro Timer", {
        body: `${selectedInterval.label} session completed!`,
        icon: "/favicon.ico", // Using the app's favicon
      });
    }
    // Play sound
    const audio = new Audio(timerCompleteSound);
    audio.play();
  }, [hasPermission, selectedInterval.label]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  // Reset timer when interval changes
  useEffect(() => {
    setTimeLeft(selectedInterval.minutes * 60);
    setIsRunning(false);
  }, [selectedInterval]);

  return (
    <div
      ref={containerRef}
      className="bg-pri-pur-500/25 rounded-5xl p-8 shadow-lg relative"
      role="dialog"
      aria-modal="true"
      aria-label="Pomodoro Timer"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200 transition-colors"
        aria-label="Close Timer"
      >
        <Icon icon="mingcute:close-fill" className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center gap-6">
        {/* Time Interval Selection */}
        <div className="flex gap-4">
          {timeIntervals.map((interval) => (
            <button
              key={interval.label}
              onClick={() => setSelectedInterval(interval)}
              className={`px-4 py-2 rounded-lg font-inter transition-all ${
                selectedInterval.label === interval.label
                  ? "bg-pink-test-500 text-neu-whi-100"
                  : "bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200"
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-6xl font-bold font-inter text-neu-gre-800">
          {formatTime(timeLeft)}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-4 rounded-full bg-orange-test-500 text-white hover:bg-orange-test-500/75 transition-colors"
          >
            <Icon
              icon={isRunning ? "mingcute:pause-fill" : "mingcute:play-fill"}
              width={24}
              height={24}
            />
          </button>
          <button
            onClick={() => {
              setTimeLeft(selectedInterval.minutes * 60);
              setIsRunning(false);
            }}
            className="p-2 rounded-full bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200 transition-colors"
            aria-label="Reset Timer"
          >
            <Icon icon="mingcute:back-2-fill" width={24} height={24} />
          </button>
        </div>

        {/* Notification Permission Button */}
        {!hasPermission && (
          <button
            onClick={requestNotificationPermission}
            className="mt-4 px-4 py-2 rounded-lg bg-sup-sys-500 text-neu-whi-100 hover:bg-pri-blue-600 transition-colors font-inter"
          >
            Enable notifications
          </button>
        )}
      </div>
    </div>
  );
};
