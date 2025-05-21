import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-4 py-4 bg-orange-test-500/25 text-neu-gre-700 border border-pri-tea-900 rounded-lg hover:bg-orange-test-500/50 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-tea-500",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} className={className}>
      <Icon
        icon="mingcute:delete-2-fill"
        width={20}
        height={20}
        color="currentColor"
      />
      <span className="text-base font-inter">Clear completed</span>
    </button>
  );
};
