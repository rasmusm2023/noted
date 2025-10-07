import { useRef } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import type { Goal } from "../../services/goalService";

interface TaskItemProps {
  task: Task;
  goals: Goal[];
  dayIndex: number;
  editingTask: Task | null;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  onTaskCompletion: (
    taskId: string,
    completed: boolean,
    dayIndex: number,
    e: React.MouseEvent
  ) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (taskId: string, updates: Partial<Task>) => void;
  onEditingTaskChange: (task: Task | null) => void;
  onTaskSave?: (taskId: string) => void;
}

export const TaskItem = ({
  task,
  goals,
  dayIndex,
  editingTask,
  onTaskClick,
  onTaskCompletion,
  onTaskDelete,
  onTaskEdit,
  onEditingTaskChange,
  onTaskSave,
}: TaskItemProps) => {
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Get associated goals for this task
  const associatedGoals = task.goalIds
    ? goals.filter((goal) => task.goalIds?.includes(goal.id))
    : [];

  const taskItemClasses = `
    task-item py-4 px-2 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 m-[1px]
    ${
      task.completed
        ? "bg-acc-green-400/50 dark:bg-acc-green-900/50 border-2 border-acc-green-800/30 dark:border-acc-green-700/30"
        : task.backgroundColor
        ? task.backgroundColor
        : "bg-neu-gre-300/50 dark:bg-neu-gre-900/50 border-2 border-neu-gre-600/30 dark:border-neu-gre-700/30"
    }
    ${editingTask?.id === task.id ? "ring-2 ring-pri-blue-500" : ""}
    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-500
  `;

  return (
    <div
      key={task.id}
      data-task-id={task.id}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTaskClick(task, e as unknown as React.MouseEvent);
        }
      }}
      className={taskItemClasses}
      onClick={(e) => onTaskClick(task, e)}
      role="button"
      aria-label={`${task.title}${task.completed ? " (completed)" : ""}`}
      aria-pressed={task.completed}
    >
      <div className="flex items-center space-x-0 sm:space-x-2 flex-1 min-w-0">
        <div className="flex items-center justify-center h-full flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskCompletion(task.id, !task.completed, dayIndex, e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onTaskCompletion(
                  task.id,
                  !task.completed,
                  dayIndex,
                  e as unknown as React.MouseEvent
                );
              }
            }}
            className={`transition-all duration-300 flex items-center justify-center min-w-[24px] min-h-[24px] p-2 sm:p-2 ${
              task.completed
                ? "text-acc-green-800 dark:text-acc-green-300 hover:text-acc-green-700 dark:hover:text-acc-green-400"
                : "text-neu-gre-800 dark:text-neu-whi-100 hover:text-sup-suc-500"
            } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md`}
            aria-label={`Mark task "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
          >
            {task.completed ? (
              <Icon icon="mingcute:check-2-fill" className="w-6 h-6" />
            ) : (
              <Icon
                icon="mingcute:round-line"
                className="w-6 h-6 text-neu-gre-700 dark:text-neu-gre-100 hover:text-acc-green-500 dark:hover:text-acc-green-400"
              />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center min-w-0 overflow-hidden">
            <h3
              className={`text-sm sm:text-sm font-inter font-medium w-full ${
                editingTask?.id === task.id ? "" : "transition-all duration-300"
              } ${
                task.completed
                  ? "text-acc-green-800 dark:text-acc-green-300 scale-95"
                  : "text-neu-gre-800 dark:text-neu-whi-100"
              }`}
            >
              {editingTask?.id === task.id ? (
                <input
                  ref={taskInputRef}
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    onEditingTaskChange({
                      ...editingTask,
                      title: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onTaskEdit(task.id, {
                        title: editingTask.title,
                      });
                    } else if (e.key === "Escape") {
                      onEditingTaskChange(null);
                    }
                  }}
                  onBlur={() => {
                    onTaskEdit(task.id, {
                      title: editingTask.title,
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-sm font-inter font-regular text-neu-gre-900 dark:text-neu-whi-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-focus-500"
                  autoFocus
                />
              ) : (
                task.title
              )}
            </h3>
          </div>
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-1 sm:mt-2 space-y-1">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      subtask.completed
                        ? task.completed
                          ? "bg-acc-green-700 dark:bg-acc-green-300"
                          : "bg-acc-green-600 dark:bg-acc-green-400"
                        : task.completed
                        ? "bg-neu-gre-500 dark:bg-neu-gre-600"
                        : "bg-neu-gre-500 dark:bg-neu-gre-400"
                    }`}
                  />
                  <span
                    className={`font-inter text-xs truncate ${
                      subtask.completed
                        ? task.completed
                          ? "line-through text-acc-green-700 dark:text-acc-green-200"
                          : "line-through text-acc-green-600 dark:text-acc-green-300"
                        : task.completed
                        ? "text-neu-gre-600 dark:text-neu-gre-300"
                        : "text-neu-gre-600 dark:text-neu-gre-400"
                    }`}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Associated Goals Display */}
          {associatedGoals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {associatedGoals.map((goal) => (
                <span
                  key={goal.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pri-pur-100 dark:bg-pri-pur-900/30 text-pri-pur-700 dark:text-pri-pur-300 border border-pri-pur-200 dark:border-pri-pur-700/50"
                >
                  <Icon
                    icon="mingcute:target-2-fill"
                    className="w-3 h-3 mr-1"
                  />
                  {goal.title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center ml-2 sm:ml-4">
          <div className="flex flex-col items-center gap-0">
            {onTaskSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskSave(task.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    onTaskSave(task.id);
                  }
                }}
                className={`p-2 sm:p-2 flex items-center justify-center min-w-[24px] min-h-[24px] ${
                  task.isSaved
                    ? "text-pri-pur-200 hover:text-pri-pur-100 scale-110"
                    : task.completed
                    ? "text-acc-green-800 dark:text-acc-green-300 hover:text-pri-pur-600 dark:hover:text-pri-pur-600"
                    : "text-neu-gre-500 hover:text-pri-pur-600 dark:text-neu-whi-100/70 dark:hover:text-pri-pur-300"
                } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
                aria-label={`${task.isSaved ? "Unsave" : "Save"} task "${
                  task.title
                }"`}
              >
                <Icon
                  icon="mingcute:classify-add-2-fill"
                  width={24}
                  height={24}
                  className="w-5 h-5"
                />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskDelete(task.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskDelete(task.id);
                }
              }}
              className={`p-2 sm:p-2 flex items-center justify-center min-w-[24px] min-h-[24px] ${
                task.completed
                  ? "text-acc-green-800 dark:text-acc-green-300 hover:text-sup-err-500 dark:hover:text-sup-err-400"
                  : "text-neu-gre-500 hover:text-sup-err-500 dark:text-neu-whi-100/70 dark:hover:text-sup-err-400"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
              aria-label={`Delete task "${task.title}"`}
            >
              <Icon
                icon="mingcute:delete-2-fill"
                width={24}
                height={24}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
