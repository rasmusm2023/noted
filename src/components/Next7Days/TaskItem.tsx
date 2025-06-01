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
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const lastMenuItemRef = useRef<HTMLButtonElement>(null);

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

  // Handle keyboard navigation in dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        if (e.shiftKey && document.activeElement === firstMenuItemRef.current) {
          e.preventDefault();
          setIsDropdownOpen(false);
          buttonRef.current?.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === lastMenuItemRef.current
        ) {
          e.preventDefault();
          setIsDropdownOpen(false);
          buttonRef.current?.focus();
        }
        break;
    }
  };

  // Focus trap for dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusableElements = dropdownRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [isDropdownOpen]);

  // Focus management for dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      // Focus first menu item when dropdown opens
      firstMenuItemRef.current?.focus();
    }
  }, [isDropdownOpen]);

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
        onKeyDown={handleDropdownKeyDown}
        role="menu"
        aria-label="Task options"
      >
        <div className="py-1" role="none">
          <button
            ref={firstMenuItemRef}
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
              // Ensure focus returns to dots button after a small delay
              setTimeout(() => {
                buttonRef.current?.focus();
              }, 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                // Create a synthetic event that won't be blocked by the button check
                const syntheticEvent = new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                });
                onTaskClick(
                  task,
                  syntheticEvent as unknown as React.MouseEvent
                );
                setIsDropdownOpen(false);
                // Ensure focus returns to dots button after a small delay
                setTimeout(() => {
                  buttonRef.current?.focus();
                }, 0);
              }
            }}
            className="w-full text-left px-4 py-2 text-sm text-neu-gre-700 dark:text-neu-whi-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md"
            role="menuitem"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mingcute:pencil-fill" className="w-4 h-4" />
              <span>Edit</span>
            </div>
          </button>
          {onTaskSave && (
            <button
              ref={lastMenuItemRef}
              onClick={(e) => {
                e.stopPropagation();
                onTaskSave(task.id);
                setIsDropdownOpen(false);
                // Ensure focus returns to dots button after a small delay
                setTimeout(() => {
                  buttonRef.current?.focus();
                }, 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskSave(task.id);
                  setIsDropdownOpen(false);
                  // Ensure focus returns to dots button after a small delay
                  setTimeout(() => {
                    buttonRef.current?.focus();
                  }, 0);
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-neu-gre-700 dark:text-neu-whi-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md"
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

  const taskItemClasses = `
    task-item p-3 rounded-md flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 m-[1px]
    ${
      isNextTask
        ? "highlighted-task border-2 border-pri-pur-500/30"
        : task.completed
        ? "dark:[background:linear-gradient(90deg,hsla(145,84%,45%,1)_0%,hsla(150,61%,35%,1)_100%)] [background:linear-gradient(90deg,hsla(145,84%,73%,1)_0%,hsla(150,61%,48%,1)_100%)] border-2 border-sup-suc-800/30"
        : task.backgroundColor
        ? task.backgroundColor
        : "dark:bg-neu-gre-800 border-2 border-neu-gre-500/30"
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
      onFocus={(e) => {
        console.log("Focus on outer task item:", e.currentTarget);
      }}
      className={taskItemClasses}
      onClick={(e) => onTaskClick(task, e)}
      role="button"
      aria-label={`${task.title}${task.completed ? " (completed)" : ""}${
        isNextTask ? " (next task)" : ""
      }`}
      aria-pressed={task.completed}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
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
            onFocus={(e) => {
              console.log("Focus on complete button:", e.currentTarget);
            }}
            className={`transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? "text-sup-suc-600 dark:text-sup-suc-500 hover:text-sup-suc-600"
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
                className="w-8 h-8 text-neu-gre-700 dark:text-neu-gre-100 hover:text-sup-suc-500 dark:hover:text-sup-suc-400"
              />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0 flex items-center">
          <div className="min-w-0">
            <h3
              className={`text-sm font-inter font-medium truncate ${
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
              <div className="mt-2 space-y-1 pl-1">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center space-x-2 min-w-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        subtask.completed
                          ? "bg-sup-suc-600 dark:bg-sup-suc-400"
                          : "bg-neu-gre-500 dark:bg-neu-gre-400"
                      }`}
                    />
                    <span
                      className={`font-inter text-xs truncate ${
                        subtask.completed
                          ? "line-through text-sup-suc-600 dark:text-sup-suc-400"
                          : "text-neu-400 dark:text-neu-whi-100/70"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center space-y-0 ml-2 flex-shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              onFocus={(e) => {
                console.log("Focus on options button:", e.currentTarget);
              }}
              className={`p-1 flex items-center justify-center ${
                task.completed
                  ? "text-sup-suc-800 hover:text-sup-suc-800 dark:text-sup-suc-700 dark:hover:text-sup-suc-700"
                  : isNextTask
                  ? "text-pri-pur-400 hover:text-pri-pur-800 dark:text-pri-pur-400 dark:hover:text-pri-pur-300"
                  : "text-neu-gre-500 hover:text-neu-gre-800 dark:text-neu-whi-100/70 dark:hover:text-neu-whi-100"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
              aria-label="Task options menu"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onTaskDelete(task.id);
              }
            }}
            onFocus={(e) => {
              console.log("Focus on delete button:", e.currentTarget);
            }}
            className={`p-1 flex items-center justify-center ${
              task.completed
                ? "text-sup-suc-800 hover:text-sup-err-500 dark:text-sup-suc-700 dark:hover:text-sup-err-400"
                : isNextTask
                ? "text-pri-pur-400 hover:text-sup-err-500 dark:text-pri-pur-400 dark:hover:text-sup-err-400"
                : "text-neu-gre-500 hover:text-sup-err-500 dark:text-neu-whi-100/70 dark:hover:text-sup-err-400"
            } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
            aria-label={`Delete task "${task.title}"`}
          >
            <Icon icon="mingcute:delete-2-fill" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
