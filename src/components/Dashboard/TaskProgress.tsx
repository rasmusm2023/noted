import { ClearCompletedButton } from "../Buttons/ClearCompletedButton";
import { TaskLibraryButton } from "../Buttons/TaskLibraryButton";
import type { Task } from "../../types/task";

interface TaskProgressProps {
  completionPercentage: number;
  onClearCompleted: () => void;
  onTaskSelect: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
  totalTasks: number;
  completedTasks: number;
}

export const TaskProgress = ({
  completionPercentage,
  onClearCompleted,
  onTaskSelect,
  onRemoveTask,
  totalTasks,
  completedTasks,
}: TaskProgressProps) => {
  return (
    <div className="flex items-center rounded-5xl justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl sm:text-3xl lg:text-3xl font-inter font-bold text-neu-gre-800 dark:text-neu-gre-100">
          Today
        </h2>
        {/* Progress bar - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2">
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
        {/* Mobile progress text */}
        <div className="sm:hidden text-lg font-inter text-neu-gre-600 dark:text-neu-gre-300">
          {completedTasks}/{totalTasks}
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
