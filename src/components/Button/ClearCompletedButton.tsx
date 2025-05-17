import { Icon } from "@iconify/react";

interface ClearCompletedButtonProps {
  onClearCompleted: () => void;
  className?: string;
}

export const ClearCompletedButton = ({
  onClearCompleted,
  className = "px-4 py-2 bg-neu-700 text-sup-err-400 rounded-lg hover:bg-neu-600 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500",
}: ClearCompletedButtonProps) => {
  return (
    <button onClick={onClearCompleted} className={className}>
      <Icon
        icon="mingcute:delete-2-fill"
        width={20}
        height={20}
        color="currentColor"
      />
      <span className="text-base font-outfit">Clear completed</span>
    </button>
  );
};
