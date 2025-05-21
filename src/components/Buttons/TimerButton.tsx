import { Icon } from "@iconify/react";

interface TimerButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export const TimerButton = ({
  onClick,
  isActive = false,
}: TimerButtonProps) => {
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
      <span className="text-base font-inter font-medium">Start a timer</span>
    </button>
  );
};
