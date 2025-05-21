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
      className={`task-item p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
        task.completed
          ? "bg-sup-suc-400 bg-opacity-50"
          : task.backgroundColor
          ? task.backgroundColor
          : "bg-neu-gre-800"
      } ${
        isNextTask
          ? "highlighted-task ring-2 ring-pri-blue-500 ring-opacity-60"
          : ""
      } focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
      onClick={(e) => onTaskClick(task, e)}
    >
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center justify-center h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskCompletion(task.id, !task.completed, dayIndex, e);
            }}
            className={`transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? "text-neu-whi-100 hover:text-neu-whi-100 scale-95"
                : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-full p-1`}
            aria-label={`Mark task "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
          >
            {task.completed ? (
              <Icon
                icon="mingcute:choice-line"
                className="w-full h-full text-white"
              />
            ) : (
              <Icon
                icon="mingcute:square-line"
                className="w-full h-full text-current"
              />
            )}
          </button>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex-1">
            <h3
              className={`text-base font-inter font-regular transition-all duration-300 ${
                task.completed
                  ? "text-neu-whi-100 scale-95"
                  : "text-neu-whi-100"
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
                  className="w-full bg-transparent text-base font-inter font-semibold text-neu-whi-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-pur-500 transition-colors duration-200"
                  autoFocus
                />
              ) : (
                task.title
              )}
            </h3>
            <SubtaskList subtasks={task.subtasks || []} />
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTaskDelete(task.id);
              }}
              className={`p-2 flex items-center justify-center ${
                task.completed
                  ? "text-neu-whi-100 hover:text-neu-whi-100"
                  : "text-neu-gre-400 hover:text-red-500"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
              aria-label={`Delete task "${task.title}"`}
            >
              <Icon
                icon="mingcute:delete-fill"
                className="w-4 h-4 text-gray-400"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
