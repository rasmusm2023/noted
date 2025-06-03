import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";

interface TaskItemProps {
  task: Task;
  isNextTask: boolean;
  isEditing: boolean;
  editingTitle: string;
  index: number;
  onCompletion: (
    taskId: string,
    completed: boolean,
    event: React.MouseEvent
  ) => void;
  onSelect: (task: Task) => void;
  onEdit: (task: Task | null) => void;
  onDelete: (taskId: string) => void;
  onTitleChange: (title: string) => void;
  onSave: (taskId: string, isSaved: boolean) => void;
}

export const TaskItem = ({
  task,
  isNextTask,
  isEditing,
  editingTitle,
  index,
  onCompletion,
  onSelect,
  onEdit,
  onDelete,
  onTitleChange,
  onSave,
}: TaskItemProps) => {
  const containerTabIndex = 4 + index * 4;
  const completionTabIndex = containerTabIndex + 1;
  const saveTabIndex = containerTabIndex + 2;
  const deleteTabIndex = containerTabIndex + 3;

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
    ${isEditing ? "ring-2 ring-pri-pur-500" : ""}
    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500
  `;

  return (
    <div
      key={task.id}
      data-task-id={task.id}
      tabIndex={containerTabIndex}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(task);
        }
      }}
      onFocus={(e) => {
        console.log("Focused element:", {
          element: e.target,
          className: e.target.className,
          id: e.target.id,
          tagName: e.target.tagName,
          role: e.target.getAttribute("role"),
          tabIndex: e.target.getAttribute("tabIndex"),
        });
      }}
      className={taskItemClasses}
      onClick={() => onSelect(task)}
      role="button"
    >
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
        <div className="flex items-center justify-center h-full flex-shrink-0">
          <button
            tabIndex={completionTabIndex}
            onClick={(e) => {
              e.stopPropagation();
              onCompletion(task.id, !task.completed, e);
            }}
            onKeyDown={(e) => {
              console.log("Key pressed:", e.key);
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const syntheticEvent = {
                  stopPropagation: () => {},
                  preventDefault: () => {},
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2,
                  currentTarget: {
                    closest: () => {
                      const taskItem = button.closest(".task-item");
                      if (taskItem) {
                        taskItem.classList.add("task-completing");
                      }
                      return taskItem;
                    },
                  },
                  altKey: false,
                  button: 0,
                  buttons: 0,
                  ctrlKey: false,
                  metaKey: false,
                  shiftKey: false,
                  getModifierState: () => false,
                  detail: 0,
                  screenX: 0,
                  screenY: 0,
                  pageX: 0,
                  pageY: 0,
                  relatedTarget: null,
                  movementX: 0,
                  movementY: 0,
                  nativeEvent: e.nativeEvent,
                  bubbles: true,
                  cancelable: true,
                  defaultPrevented: false,
                  eventPhase: 0,
                  isTrusted: true,
                  timeStamp: Date.now(),
                  type: "click",
                  target: button,
                  view: window,
                } as unknown as React.MouseEvent;
                console.log("Completing task:", task.id);
                onCompletion(task.id, !task.completed, syntheticEvent);
              }
            }}
            className={`transition-all duration-300 flex items-center justify-center min-w-[32px] min-h-[32px] p-2 sm:p-2 ${
              task.completed
                ? "text-sup-suc-600 dark:text-sup-suc-800 hover:text-sup-suc-600"
                : "text-neu-gre-800 dark:text-neu-whi-100 hover:text-sup-suc-500"
            } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md`}
            aria-label={`Mark task "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
          >
            {task.completed ? (
              <Icon
                icon="mingcute:check-2-fill"
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
            ) : (
              <Icon
                icon="mingcute:round-line"
                className="w-6 h-6 sm:w-7 sm:h-7 text-neu-gre-700 dark:text-neu-gre-100 hover:text-sup-suc-500 dark:hover:text-sup-suc-400"
              />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center min-w-0 overflow-hidden">
            <h3
              className={`text-sm sm:text-base font-inter font-medium truncate w-full ${
                isEditing ? "" : "transition-all duration-300"
              } ${
                task.completed
                  ? "text-neu-gre-800 dark:text-sup-suc-800 scale-95"
                  : "text-neu-gre-800 dark:text-neu-whi-100"
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onEdit({ ...task, title: editingTitle });
                    } else if (e.key === "Escape") {
                      onEdit(null);
                    }
                  }}
                  onBlur={() => {
                    onEdit({ ...task, title: editingTitle });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-sm sm:text-base font-inter font-regular text-neu-gre-900 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-focus-500"
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
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
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
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(task.id, task.isSaved || false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSave(task.id, task.isSaved || false);
                }
              }}
              className={`p-2 sm:p-2.5 flex items-center justify-center min-w-[44px] min-h-[44px] ${
                task.isSaved
                  ? "text-pri-pur-200 hover:text-pri-pur-100 scale-110"
                  : isNextTask
                  ? "text-pri-pur-400 hover:text-pri-pur-600 dark:text-pri-pur-400 dark:hover:text-pri-pur-600"
                  : task.completed
                  ? "text-sup-suc-800 hover:text-pri-pur-600 dark:text-sup-suc-800 dark:hover:text-pri-pur-600"
                  : "text-neu-gre-500 hover:text-pri-pur-600 dark:text-neu-whi-100/70 dark:hover:text-pri-pur-600"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
              aria-label={`${task.isSaved ? "Unsave" : "Save"} task "${
                task.title
              }"`}
              tabIndex={saveTabIndex}
            >
              <Icon
                icon="mingcute:classify-add-2-fill"
                width={24}
                height={24}
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(task.id);
                }
              }}
              className={`p-2 sm:p-2.5 flex items-center justify-center min-w-[44px] min-h-[44px] ${
                task.completed
                  ? "text-sup-suc-800 hover:text-sup-err-500 dark:text-sup-suc-800 dark:hover:text-sup-err-400"
                  : isNextTask
                  ? "text-pri-pur-400 hover:text-sup-err-500 dark:text-pri-pur-400 dark:hover:text-sup-err-400"
                  : "text-neu-gre-500 hover:text-sup-err-500 dark:text-neu-whi-100/70 dark:hover:text-sup-err-400"
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 focus-visible:rounded-md transition-all duration-300 hover:bg-neu-800/50`}
              aria-label={`Delete task "${task.title}"`}
              tabIndex={deleteTabIndex}
            >
              <Icon
                icon="mingcute:delete-2-fill"
                width={24}
                height={24}
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
