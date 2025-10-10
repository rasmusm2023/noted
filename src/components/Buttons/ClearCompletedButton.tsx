import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-3 py-2 sm:py-3 bg-transparent border-2 border-neu-gre-300 dark:border-neu-gre-600 text-sm font-semibold text-neu-gre-600 dark:text-neu-gre-300 hover:text-sup-err-500 dark:hover:text-sup-err-400 hover:border-sup-err-500 dark:hover:border-sup-err-400 hover:bg-sup-err-50 dark:hover:bg-sup-err-900/20 rounded-md transition-all duration-200 font-inter focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 flex items-center justify-center gap-2 min-h-[44px]",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} tabIndex={2} className={className}>
      <span className="font-inter font-semibold text-base">
        <span className="lg:hidden">Clear</span>
        <span className="hidden lg:inline">Clear completed</span>
      </span>
      <Icon
        icon="mingcute:eraser-fill"
        className="w-4 h-4 sm:w-5 sm:h-5"
        aria-hidden="true"
      />
    </button>
  );
};
