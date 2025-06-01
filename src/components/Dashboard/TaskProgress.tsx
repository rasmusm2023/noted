import { ClearCompletedButton } from "../Buttons/ClearCompletedButton";
import { TaskLibraryButton } from "../Buttons/TaskLibraryButton";
import type { Task } from "../../types/task";

interface TaskProgressProps {
  completionPercentage: number;
  completedPosition: "top" | "bottom" | "mixed";
  onCompletedPositionChange: (position: "top" | "bottom" | "mixed") => void;
  onClearCompleted: () => void;
  onTaskSelect: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
}

export const TaskProgress = ({
  completionPercentage,
  completedPosition,
  onCompletedPositionChange,
  onClearCompleted,
  onTaskSelect,
  onRemoveTask,
}: TaskProgressProps) => {
  return (
    <div className="flex items-center rounded-5xl justify-between mb-6">
      <div className="flex items-center gap-8">
        <h2 className="text-3xl font-inter font-bold text-neu-gre-800 dark:text-neu-gre-100">
          Today
        </h2>
        <div className="hidden 2xl:flex items-center gap-2">
          <div className="w-[200px] h-2 bg-neu-gre-200 dark:bg-neu-gre-600 rounded-full">
            <div
              className="h-full bg-sup-suc-400 dark:bg-sup-suc-400 rounded-full"
              style={{
                width: `${completionPercentage}%`,
              }}
            ></div>
          </div>
          <span className="text-base font-inter text-neu-gre-600 dark:text-neu-gre-300">
            {completionPercentage}%
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TaskLibraryButton
          onTaskSelect={onTaskSelect}
          onRemoveTask={onRemoveTask}
        />
        <ClearCompletedButton onClearCompleted={onClearCompleted} />
      </div>
    </div>
  );
};
