import { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import { SubtaskList } from "./SubtaskList";
import { createPortal } from "react-dom";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  };

  // Add click outside listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderDropdown = () => {
    if (!isDropdownOpen || !buttonRef.current) return null;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownStyle = {
      position: "fixed" as const,
      top: buttonRect.bottom + window.scrollY + 4,
      right: window.innerWidth - buttonRect.right,
      zIndex: 9999,
    };

    return createPortal(
      <div
        ref={dropdownRef}
        className="w-48 rounded-md shadow-lg bg-white dark:bg-neu-gre-800 ring-1 ring-black ring-opacity-5"
        style={dropdownStyle}
      >
        <div className="py-1" role="menu" aria-orientation="vertical">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Create a synthetic event that won't be blocked by the button check
              const syntheticEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              onTaskClick(task, syntheticEvent as unknown as React.MouseEvent);
              setIsDropdownOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-neu-gre-700 dark:text-neu-whi-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700"
            role="menuitem"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mingcute:pencil-fill" className="w-4 h-4" />
              <span>Edit</span>
            </div>
          </button>
          {onTaskSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskSave(task.id);
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-neu-gre-700 dark:text-neu-whi-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700"
              role="menuitem"
            >
              <div className="flex items-center space-x-2">
                <Icon icon="mingcute:classify-add-2-fill" className="w-4 h-4" />
                <span>
                  {task.isSaved
                    ? "Remove from Task Library"
                    : "Save to Task Library"}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  };

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
      className={`task-item py-4 px-2 rounded-md flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 m-[1px] ${
        task.completed
          ? "[background:linear-gradient(90deg,hsla(145,84%,73%,1)_0%,hsla(150,61%,48%,1)_100%)] border-2 border-sup-suc-800/30"
          : task.backgroundColor
          ? `${task.backgroundColor} ${
              task.backgroundColor.includes("bg-task-")
                ? `dark:${task.backgroundColor
                    .replace("bg-task-", "bg-task-")
                    .replace("-100", "-dark")} hover:${task.backgroundColor
                    .replace("bg-task-", "hover:bg-task-")
                    .replace(
                      "-100",
                      "-hover"
                    )} dark:hover:${task.backgroundColor
                    .replace("bg-task-", "hover:bg-task-")
                    .replace("-100", "-dark-hover")}`
                : task.backgroundColor
            } border-2 border-neu-gre-400/30`
          : "bg-neu-gre-100 dark:bg-neu-gre-800 border-2 border-neu-gre-400/30"
      } ${
        isNextTask
          ? "highlighted-task bg-gradient-highlighted-task ring-2 ring-pri-pur-500 ring-opacity-60"
          : ""
      } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500`}
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
                ? "text-sup-suc-600 hover:text-sup-suc-600"
                : "text-pri-pur-500 hover:text-sup-suc-500"
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
              className={`text-sm font-inter font-medium ${
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
                      className={`w-2 h-2 rounded-full ${
                        subtask.completed ? "bg-sup-suc-800" : "bg-neu-gre-500"
                      }`}
                    />
                    <span
                      className={`font-inter text-xs ${
                        subtask.completed
                          ? "line-through text-sup-suc-800"
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
            <div className="relative" ref={dropdownRef}>
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className={`p-1 flex items-center justify-center ${
                  task.completed
                    ? "text-sup-suc-800 hover:text-sup-suc-800"
                    : isNextTask
                    ? "text-pri-pur-400 hover:text-pri-pur-800"
                    : "text-neu-gre-500 hover:text-neu-gre-800"
                } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 transition-all duration-300 rounded-md hover:bg-neu-800/50`}
                aria-label="Task options"
              >
                <Icon icon="mingcute:more-1-fill" className="w-5 h-5" />
              </button>
              {renderDropdown()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskDelete(task.id);
              }}
              className={`p-1 flex items-center justify-center ${
                task.completed
                  ? "text-sup-suc-800 hover:text-sup-err-500"
                  : isNextTask
                  ? "text-pri-pur-400 hover:text-sup-err-500"
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
