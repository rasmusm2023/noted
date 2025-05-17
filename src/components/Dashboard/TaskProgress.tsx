import { useRef, useState } from "react";
import { SortMenuButton } from "../Button/SortMenuButton";
import { ClearCompletedButton } from "../Button/ClearCompletedButton";

interface TaskProgressProps {
  completionPercentage: number;
  completedPosition: "top" | "bottom" | "mixed";
  onCompletedPositionChange: (position: "top" | "bottom" | "mixed") => void;
  onClearCompleted: () => void;
}

export const TaskProgress = ({
  completionPercentage,
  completedPosition,
  onCompletedPositionChange,
  onClearCompleted,
}: TaskProgressProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-8">
        <h2 className="text-2xl font-outfit font-semibold text-neu-300">
          Today
        </h2>
        <div className="hidden 2xl:flex items-center gap-2">
          <div className="w-[300px] h-2 bg-sup-suc-900 rounded-full">
            <div
              className="h-full bg-sup-suc-500 rounded-full"
              style={{
                width: `${completionPercentage}%`,
              }}
            ></div>
          </div>
          <span className="text-base font-outfit text-neu-400">
            {completionPercentage}%
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <SortMenuButton
          completedPosition={completedPosition}
          onCompletedPositionChange={onCompletedPositionChange}
        />
        <ClearCompletedButton onClearCompleted={onClearCompleted} />
      </div>
    </div>
  );
};
