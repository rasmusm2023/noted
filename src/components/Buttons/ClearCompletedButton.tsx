import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-4 py-2 bg-neu-gre-300 text-neu-gre-700 border border-sec-rose-900 rounded-lg hover:bg-sup-err-300 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sec-rose-500",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} className={className}>
      <Icon
        icon="mingcute:delete-2-fill"
        width={24}
        height={24}
        color="currentColor"
      />
      <span className="text-base font-inter">Clear Completed</span>
    </button>
  );
};
