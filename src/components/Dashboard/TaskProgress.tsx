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
    <div className="flex items-center rounded-5xl justify-between mb-6">
      <div className="flex items-center gap-8">
        <h2 className="text-3xl font-inter font-bold text-neu-gre-800">
          Today
        </h2>
        <div className="hidden 2xl:flex items-center gap-2">
          <div className="w-[200px] h-2 bg-sup-suc-100 rounded-full">
            <div
              className="h-full bg-sup-suc-400 rounded-full"
              style={{
                width: `${completionPercentage}%`,
              }}
            ></div>
          </div>
          <span className="text-base font-inter text-neu-400">
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
