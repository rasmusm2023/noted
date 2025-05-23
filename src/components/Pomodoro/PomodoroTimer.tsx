import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import timerCompleteSound from "../../assets/sounds/timer-complete.mp3";

export interface TimeInterval {
  label: string;
  minutes: number;
  type: "work" | "break";
}

export const timeIntervals: TimeInterval[] = [
  { label: "Pomodoro", minutes: 25, type: "work" },
  { label: "1 Hour", minutes: 60, type: "work" },
  { label: "Short Break", minutes: 5, type: "break" },
  { label: "Long Break", minutes: 15, type: "break" },
];

interface PomodoroTimerProps {
  onClose: () => void;
  onTimerStart: (interval: TimeInterval) => void;
}

// Helper function to save timer state to localStorage
const saveTimerState = (state: {
  selectedInterval: TimeInterval;
  timeLeft: number;
  isRunning: boolean;
  startTime?: number;
}) => {
  localStorage.setItem("pomodoroTimerState", JSON.stringify(state));
};

// Helper function to load timer state from localStorage
const loadTimerState = () => {
  const savedState = localStorage.getItem("pomodoroTimerState");
  if (savedState) {
    return JSON.parse(savedState);
  }
  return null;
};

export const PomodoroTimer = ({
  onClose,
  onTimerStart,
}: PomodoroTimerProps) => {
  // Load initial state from localStorage or use defaults
  const savedState = loadTimerState();
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(
    savedState?.selectedInterval || timeIntervals[0]
  );
  const [timeLeft, setTimeLeft] = useState<number>(
    savedState?.timeLeft || selectedInterval.minutes * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(
    savedState?.isRunning || false
  );
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | undefined>(
    savedState?.startTime
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Save state whenever it changes
  useEffect(() => {
    saveTimerState({
      selectedInterval,
      timeLeft,
      isRunning,
      startTime,
    });
  }, [selectedInterval, timeLeft, isRunning, startTime]);

  // Calculate elapsed time when component mounts or when timer is running
  useEffect(() => {
    if (isRunning && startTime) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const newTimeLeft = Math.max(
        0,
        selectedInterval.minutes * 60 - elapsedSeconds
      );
      setTimeLeft(newTimeLeft);
    }
  }, [isRunning, startTime, selectedInterval]);

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
        icon: "/favicon.ico",
      });
    }

    // Play sound 5 times with delay between each play
    const playSound = (count: number) => {
      if (count <= 0) return;

      const audio = new Audio(timerCompleteSound);
      audio.play();

      // Schedule next play after 1 second
      setTimeout(() => {
        playSound(count - 1);
      }, 1000);
    };

    // Start playing the sound 5 times
    playSound(5);

    // Clear timer state when completed
    localStorage.removeItem("pomodoroTimerState");
  }, [hasPermission, selectedInterval.label]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      // Set start time when timer starts running
      if (!startTime) {
        const newStartTime =
          Date.now() - (selectedInterval.minutes * 60 - timeLeft) * 1000;
        setStartTime(newStartTime);
      }

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setStartTime(undefined);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete, selectedInterval, startTime]);

  // Reset timer when interval changes
  useEffect(() => {
    setTimeLeft(selectedInterval.minutes * 60);
    setIsRunning(false);
    setStartTime(undefined);
  }, [selectedInterval]);

  // Handle timer start
  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
    onTimerStart(selectedInterval);
  };

  // Handle timer reset
  const handleReset = () => {
    setTimeLeft(selectedInterval.minutes * 60);
    setIsRunning(false);
    setStartTime(undefined);
    localStorage.removeItem("pomodoroTimerState");
  };

  return (
    <div
      ref={containerRef}
      className="bg-neu-whi-100 rounded-5xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300 relative"
      role="dialog"
      aria-modal="true"
      aria-label="Pomodoro Timer"
      id="pomodoro-timer"
    >
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        role="toolbar"
        aria-label="Timer controls"
      >
        <button
          onClick={requestNotificationPermission}
          className="p-2 rounded-md text-neu-gre-700 hover:bg-neu-gre-100/50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
          aria-label={
            hasPermission ? "Disable notifications" : "Enable notifications"
          }
          aria-pressed={hasPermission}
        >
          <Icon
            icon={
              hasPermission
                ? "mingcute:notification-off-fill"
                : "mingcute:notification-fill"
            }
            className="w-6 h-6"
            aria-hidden="true"
          />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-neu-gre-700 hover:bg-neu-gre-100/50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
          aria-label="Close Timer"
        >
          <Icon
            icon="mingcute:close-circle-fill"
            className="w-6 h-6"
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="flex flex-col items-center gap-8">
        {/* Main Timer Section */}
        <div className="flex items-center justify-between w-full max-w-3xl">
          {/* Work Timers */}
          <div
            className="flex flex-col gap-3"
            role="group"
            aria-labelledby="work-timers-heading"
          >
            <div
              className="flex items-center space-x-3 mb-3"
              id="work-timers-heading"
            >
              <Icon
                icon="mingcute:work-fill"
                className="text-neu-gre-800 w-5 h-5"
                aria-hidden="true"
              />
              <h3 className="text-md font-medium font-inter text-neu-gre-800">
                Work
              </h3>
            </div>
            {timeIntervals
              .filter((interval) => interval.type === "work")
              .map((interval) => (
                <button
                  key={interval.label}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-4 py-2 rounded-lg font-inter transition-all text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 ${
                    selectedInterval.label === interval.label
                      ? "bg-pri-pur-400 text-neu-whi-100"
                      : "bg-neu-gre-300 text-neu-gre-800 hover:bg-pri-pur-100/50"
                  }`}
                  aria-pressed={selectedInterval.label === interval.label}
                  aria-label={`${interval.label} timer (${interval.minutes} minutes)`}
                >
                  {interval.label}
                </button>
              ))}
          </div>

          {/* Timer Display and Controls */}
          <div
            className="flex flex-col items-center gap-6"
            role="group"
            aria-label="Timer display and controls"
          >
            <div
              className="text-7xl font-bold font-inter text-neu-gre-800"
              role="timer"
              aria-live="polite"
              aria-label={`${Math.floor(timeLeft / 60)} minutes and ${
                timeLeft % 60
              } seconds remaining`}
            >
              {formatTime(timeLeft)}
            </div>
            <div
              className="flex gap-4"
              role="group"
              aria-label="Timer action buttons"
            >
              <button
                onClick={handleStart}
                className="p-4 rounded-full bg-pri-pur-400 text-neu-whi-100 hover:bg-pri-pur-500 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                aria-label={isRunning ? "Pause Timer" : "Start Timer"}
                aria-pressed={isRunning}
              >
                <Icon
                  icon={
                    isRunning ? "mingcute:pause-fill" : "mingcute:play-fill"
                  }
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </button>
              <button
                onClick={handleReset}
                className="p-4 rounded-full bg-neu-gre-300 text-neu-gre-700 hover:bg-neu-gre-200 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                aria-label="Reset Timer"
              >
                <Icon
                  icon="mingcute:back-2-fill"
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Break Timers */}
          <div
            className="flex flex-col gap-3"
            role="group"
            aria-labelledby="break-timers-heading"
          >
            <div
              className="flex items-center space-x-3 mb-3"
              id="break-timers-heading"
            >
              <Icon
                icon="mingcute:coffee-fill"
                className="text-neu-gre-800 w-5 h-5"
                aria-hidden="true"
              />
              <h3 className="text-md font-medium font-inter text-neu-gre-800">
                Break
              </h3>
            </div>
            {timeIntervals
              .filter((interval) => interval.type === "break")
              .map((interval) => (
                <button
                  key={interval.label}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-4 py-2 rounded-lg font-inter transition-all text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 ${
                    selectedInterval.label === interval.label
                      ? "bg-pri-pur-400 text-neu-whi-100"
                      : "bg-neu-gre-300 text-neu-gre-800 hover:bg-pri-pur-100/50"
                  }`}
                  aria-pressed={selectedInterval.label === interval.label}
                  aria-label={`${interval.label} timer (${interval.minutes} minutes)`}
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
