import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-3 sm:px-4 py-2 sm:py-2.5 lg:py-2.5 bg-sup-err-400 dark:bg-sup-err-700 text-neu-whi-100 dark:text-neu-whi-100 lg:bg-neu-gre-300 lg:dark:bg-neu-gre-600 lg:text-neu-gre-700 lg:dark:text-neu-gre-100 border border-sec-rose-900 dark:border-sec-rose-700 rounded-md hover:bg-sup-err-300 dark:hover:bg-sup-err-700 hover:text-neu-gre-900 dark:hover:text-neu-gre-50 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} tabIndex={2} className={className}>
      <Icon
        icon="mingcute:eraser-fill"
        width={20}
        height={20}
        className="w-6 h-6 sm:w-6 sm:h-6 lg:w-5 lg:h-5 text-neu-gre-800 dark:text-neu-whi-100 lg:text-current"
        color="currentColor"
      />
      <span className="text-sm sm:text-base font-inter font-medium">
        <span className="lg:hidden">Clear</span>
        <span className="hidden lg:inline">Clear Completed</span>
      </span>
    </button>
  );
};
