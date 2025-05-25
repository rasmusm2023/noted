import { Icon } from "@iconify/react";
import { SortMenuButton } from "../Buttons/SortMenuButton";
import { ClearCompletedButton } from "../Buttons/ClearCompletedButton";

interface TaskManagementHeaderProps {
  completedPosition: "top" | "bottom" | "mixed";
  onCompletedPositionChange: (position: "top" | "bottom" | "mixed") => void;
  onClearCompleted: () => void;
  onStatsClick: () => void;
  children?: React.ReactNode;
}

export const TaskManagementHeader = ({
  completedPosition,
  onCompletedPositionChange,
  onClearCompleted,
  onStatsClick,
  children,
}: TaskManagementHeaderProps) => {
  return (
    <div className="flex-none pt-8 pb-8">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between pl-8 pr-8">
          {children}
          <div className="bg-neu-800/30 backdrop-blur-md rounded-5xl p-2 shadow-lg border border-neu-800/20">
            <div className="flex items-center space-x-2">
              <button
                onClick={onStatsClick}
                className="px-4 py-2 bg-gradient-to-r from-neu-800 to-neu-700 text-neu-400 rounded-5xl hover:from-neu-700 hover:to-neu-600 hover:text-neu-100 transition-all duration-300 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-pur-500"
              >
                <Icon icon="mingcute:chart-fill" className="w-5 h-5" />
                <span className="text-base font-inter">Stats</span>
              </button>

              <SortMenuButton
                completedPosition={completedPosition}
                onCompletedPositionChange={onCompletedPositionChange}
              />
              <ClearCompletedButton
                onClearCompleted={onClearCompleted}
                className="px-4 py-2 bg-gradient-to-r from-neu-800 to-neu-700 text-neu-400 rounded-5xl hover:from-neu-700 hover:to-neu-600 hover:text-neu-100 transition-all duration-300 flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
