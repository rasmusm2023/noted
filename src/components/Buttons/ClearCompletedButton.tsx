import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-4 py-2 bg-neu-gre-300 dark:bg-neu-gre-600 text-neu-gre-700 dark:text-neu-gre-100 border border-sec-rose-900 dark:border-sec-rose-700 rounded-md hover:bg-sup-err-300 dark:hover:bg-sup-err-700 hover:text-neu-gre-900 dark:hover:text-neu-gre-50 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} className={className}>
      <Icon
        icon="mingcute:delete-2-fill"
        width={24}
        height={24}
        color="currentColor"
      />
      <span className="text-base font-inter font-medium">Clear Completed</span>
    </button>
  );
};
