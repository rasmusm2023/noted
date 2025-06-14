import { useRef } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";

interface TaskItemProps {
  task: Task;
  dayIndex: number;
  isNextTask: boolean;
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
  dayIndex,
  isNextTask,
  editingTask,
  onTaskClick,
  onTaskCompletion,
  onTaskDelete,
  onTaskEdit,
  onEditingTaskChange,
  onTaskSave,
}: TaskItemProps) => {
  const taskInputRef = useRef<HTMLInputElement>(null);

  const taskItemClasses = `
    task-item py-4 px-2 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 m-[1px]
    ${
      isNextTask
        ? "highlighted-task border-2 border-pri-pur-500/30"
        : task.completed
        ? "dark:[background:linear-gradient(90deg,hsla(145,84%,45%,1)_0%,hsla(150,61%,35%,1)_100%)] [background:linear-gradient(90deg,hsla(145,84%,73%,1)_0%,hsla(150,61%,48%,1)_100%)] border-2 border-sup-suc-800/30"
        : task.backgroundColor
        ? task.backgroundColor
        : "bg-task-stone-100 dark:bg-neu-gre-700 border-2 border-neu-gre-500/30"
    }
    ${editingTask?.id === task.id ? "ring-2 ring-pri-pur-500" : ""}
    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500
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
      aria-label={`${task.title}${task.completed ? " (completed)" : ""}${
        isNextTask ? " (next task)" : ""
      }`}
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
                ? "text-sup-suc-600 dark:text-sup-suc-800 hover:text-sup-suc-600"
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
                className="w-6 h-6 text-neu-gre-700 dark:text-neu-gre-100 hover:text-sup-suc-500 dark:hover:text-sup-suc-400"
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
                  ? "text-neu-gre-800 dark:text-sup-suc-800 scale-95"
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
                  className="w-full bg-transparent text-sm font-inter font-regular text-neu-gre-900 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-focus-500"
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
                          ? "bg-sup-suc-600 dark:bg-sup-suc-800"
                          : "bg-sup-suc-600 dark:bg-sup-suc-400"
                        : task.completed
                        ? "bg-neu-gre-500 dark:bg-neu-gre-700"
                        : "bg-neu-gre-500 dark:bg-neu-gre-400"
                    }`}
                  />
                  <span
                    className={`font-inter text-xs truncate ${
                      subtask.completed
                        ? task.completed
                          ? "line-through text-sup-suc-600 dark:text-sup-suc-800"
                          : "line-through text-sup-suc-600 dark:text-sup-suc-400"
                        : task.completed
                        ? "text-neu-400 dark:text-neu-gre-700"
                        : "text-neu-400 dark:text-neu-gre-400"
                    }`}
                  >
                    {subtask.title}
                  </span>
                </div>
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
                    : isNextTask
                    ? "text-pri-pur-400 hover:text-pri-pur-600 dark:text-pri-pur-400 dark:hover:text-pri-pur-600"
                    : task.completed
                    ? "text-sup-suc-800 hover:text-pri-pur-600 dark:text-sup-suc-800 dark:hover:text-pri-pur-600"
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
                  ? "text-sup-suc-800 hover:text-sup-err-500 dark:text-sup-suc-800 dark:hover:text-sup-err-400"
                  : isNextTask
                  ? "text-pri-pur-400 hover:text-sup-err-500 dark:text-pri-pur-400 dark:hover:text-sup-err-400"
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
