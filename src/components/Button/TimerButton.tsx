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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        isActive
          ? "bg-pri-pur-500/50 text-white hover:bg-pri-pur-500/75"
          : "bg-pri-pur-500 text-neu-whi-100 hover:bg-pri-pur-500/75 border border-pri-tea-200"
      }`}
    >
      <Icon
        icon="mingcute:stopwatch-fill"
        className={`w-6  h-6 ${
          isActive ? "text-neu-whi-100" : "text-neu-gre-200"
        }`}
      />
      <span className="text-base font-inter font-regular">Start a timer</span>
    </button>
  );
};
