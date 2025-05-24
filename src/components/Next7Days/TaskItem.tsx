import { useRef } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import { SubtaskList } from "./SubtaskList";

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
      className={`task-item px-2 py-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
        task.completed
          ? "bg-gradient-to-r from-sup-suc-400/50 to-sup-suc-400/30"
          : task.backgroundColor
          ? task.backgroundColor
          : "bg-gradient-to-r from-neu-gre-800 to-neu-gre-800/80"
      } ${
        isNextTask
          ? "highlighted-task ring-2 ring-pri-pur-500 ring-opacity-60"
          : ""
      } focus:outline-none focus:ring-4 focus:ring-pri-pur-500 backdrop-blur-sm`}
      onClick={(e) => onTaskClick(task, e)}
    >
      <div className="flex items-center space-x-2 flex-1">
        <div className="flex items-center justify-center h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskCompletion(task.id, !task.completed, dayIndex, e);
            }}
            className={`transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? "text-neu-100 hover:text-neu-100 scale-95"
                : "text-pri-pur-500 hover:text-sup-suc-500 hover:scale-95"
            } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md`}
            aria-label={`Mark task "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
          >
            {task.completed ? (
              <Icon icon="mingcute:check-2-fill" className="w-6 h-6" />
            ) : (
              <Icon
                icon="mingcute:round-line"
                className={`w-6 h-6 ${
                  isNextTask ? "animate-bounce-subtle" : ""
                }`}
              />
            )}
          </button>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex-1">
            <h3
              className={`text-base font-inter font-regular ${
                editingTask?.id === task.id ? "" : "transition-all duration-300"
              } ${task.completed ? "text-neu-100 scale-95" : "text-neu-100"}`}
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
                  className="w-full bg-transparent text-base font-inter font-medium text-neu-gre-800 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-pur-500"
                  autoFocus
                />
              ) : (
                task.title
              )}
            </h3>
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-2 space-y-1">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        subtask.completed ? "bg-sup-suc-500" : "bg-neu-gre-500"
                      }`}
                    />
                    <span
                      className={`font-inter text-xs ${
                        subtask.completed
                          ? "line-through text-neu-400"
                          : "text-neu-400"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center space-y-0 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task, e);
              }}
              className={`p-1 flex items-center justify-center ${
                task.completed
                  ? "text-neu-gre-500 hover:text-neu-gre-800"
                  : "text-neu-gre-500 hover:text-neu-gre-800"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 transition-all duration-300 rounded-md hover:bg-neu-800/50`}
              aria-label={`Edit task "${task.title}"`}
            >
              <Icon icon="mingcute:pencil-fill" className="w-5 h-5" />
            </button>
            {onTaskSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskSave(task.id);
                }}
                className={`p-1 flex items-center justify-center ${
                  task.isSaved
                    ? "text-neu-gre-500 hover:text-neu-gre-700"
                    : "text-neu-gre-500 hover:text-neu-gre-700"
                } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md transition-all duration-300 hover:bg-neu-800/50`}
                aria-label={`${task.isSaved ? "Unsave" : "Save"} task "${
                  task.title
                }"`}
              >
                <Icon icon="mingcute:classify-add-2-fill" className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskDelete(task.id);
              }}
              className={`p-1 flex items-center justify-center ${
                task.completed
                  ? "text-neu-gre-500 hover:text-sup-err-500"
                  : "text-neu-gre-500 hover:text-sup-err-500"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md transition-all duration-300 hover:bg-neu-800/50`}
              aria-label={`Delete task "${task.title}"`}
            >
              <Icon icon="mingcute:delete-2-fill" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
