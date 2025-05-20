import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import timerCompleteSound from "../../assets/sounds/timer-complete.mp3";

interface TimeInterval {
  label: string;
  minutes: number;
  type: "work" | "break";
}

interface PomodoroTimerProps {
  onClose: () => void;
}

const timeIntervals: TimeInterval[] = [
  { label: "Pomodoro", minutes: 25, type: "work" },
  { label: "1 Hour", minutes: 60, type: "work" },
  { label: "Short Break", minutes: 5, type: "break" },
  { label: "Long Break", minutes: 15, type: "break" },
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
      if (hasPermission) {
        // If notifications are enabled, revoke them
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
        setHasPermission(false);
      } else {
        // If notifications are disabled, request them
        const permission = await Notification.requestPermission();
        setHasPermission(permission === "granted");
      }
    } catch (error) {
      console.error("Error managing notification permission:", error);
    }
  }, [hasPermission]);

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
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={requestNotificationPermission}
          className="p-2 rounded-full bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200 transition-colors"
          aria-label={
            hasPermission ? "Disable notifications" : "Enable notifications"
          }
        >
          <Icon
            icon={
              hasPermission
                ? "mingcute:notification-off-fill"
                : "mingcute:notification-fill"
            }
            className="w-5 h-5"
          />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200 transition-colors"
          aria-label="Close Timer"
        >
          <Icon icon="mingcute:close-fill" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-6">
        {/* Main Timer Section */}
        <div className="flex items-center justify-between w-full max-w-3xl">
          {/* Work Timers */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-inter font-semibold text-neu-gre-700 mb-3">
              Work
            </h3>
            {timeIntervals
              .filter((interval) => interval.type === "work")
              .map((interval) => (
                <button
                  key={interval.label}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-4 py-2 rounded-lg font-inter transition-all text-left ${
                    selectedInterval.label === interval.label
                      ? "bg-orange-test-500 text-neu-whi-100"
                      : "bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200"
                  }`}
                >
                  {interval.label}
                </button>
              ))}
          </div>

          {/* Timer Display and Controls */}
          <div className="flex flex-col items-center gap-6">
            <div className="text-6xl font-bold font-inter text-neu-gre-800">
              {formatTime(timeLeft)}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="p-4 rounded-full bg-orange-test-500 text-white hover:bg-orange-test-500/75 transition-colors"
              >
                <Icon
                  icon={
                    isRunning ? "mingcute:pause-fill" : "mingcute:play-fill"
                  }
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
          </div>

          {/* Break Timers */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-inter font-semibold text-neu-gre-700 mb-3">
              Break
            </h3>
            {timeIntervals
              .filter((interval) => interval.type === "break")
              .map((interval) => (
                <button
                  key={interval.label}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-4 py-2 rounded-lg font-inter transition-all text-left ${
                    selectedInterval.label === interval.label
                      ? "bg-pink-test-500 text-neu-whi-100"
                      : "bg-neu-gre-100 text-neu-gre-700 hover:bg-neu-gre-200"
                  }`}
                >
                  {interval.label}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
