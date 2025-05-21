import { Icon } from "@iconify/react";

interface TimerButtonProps {
  onClick: () => void;
  isActive?: boolean;
  timeLeft?: number;
  isRunning?: boolean;
  onPauseResume?: () => void;
  onCancel?: () => void;
}

export const TimerButton = ({
  onClick,
  isActive = false,
  timeLeft,
  isRunning = false,
  onPauseResume,
  onCancel,
}: TimerButtonProps) => {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 mt-4 px-4 py-2 rounded-md transition-all duration-300 backdrop-blur-sm ${
        isActive
          ? "bg-white/40 border border-white/50 text-neu-gre-800 hover:bg-white/75"
          : "bg-white/40 border border-white/50 text-neu-gre-800 hover:bg-white/75"
      }`}
    >
      <Icon
        icon="mingcute:alarm-2-fill"
        className={`w-6 h-6 text-neu-gre-800`}
      />
      {isActive && timeLeft !== undefined ? (
        <div className="flex items-center gap-2">
          <span className="text-base font-inter font-medium min-w-[4.5rem] tabular-nums text-center">
            {formatTime(timeLeft)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPauseResume?.();
            }}
            className="p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <Icon
              icon={isRunning ? "mingcute:pause-fill" : "mingcute:play-fill"}
              className="w-4 h-4"
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.();
            }}
            className="p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <Icon icon="mingcute:close-fill" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className="text-base font-inter font-medium">Start a timer</span>
      )}
    </button>
  );
};
