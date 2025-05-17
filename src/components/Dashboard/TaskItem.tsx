import { CheckSquare, Record, Pen, TrashBinTrash } from "solar-icon-set";
import type { Task } from "../../types/task";

interface TaskItemProps {
  task: Task;
  isNextTask: boolean;
  isEditing: boolean;
  editingTitle: string;
  onCompletion: (
    taskId: string,
    completed: boolean,
    event: React.MouseEvent
  ) => void;
  onSelect: (task: Task) => void;
  onEdit: (task: Task | null) => void;
  onDelete: (taskId: string) => void;
  onTitleChange: (title: string) => void;
}

export const TaskItem = ({
  task,
  isNextTask,
  isEditing,
  editingTitle,
  onCompletion,
  onSelect,
  onEdit,
  onDelete,
  onTitleChange,
}: TaskItemProps) => {
  return (
    <div
      key={task.id}
      data-task-id={task.id}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(task);
        }
      }}
      className={`task-item p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
        task.completed
          ? "bg-sup-suc-400 bg-opacity-50"
          : task.backgroundColor
          ? task.backgroundColor
          : "bg-neu-700"
      } ${
        isNextTask
          ? "highlighted-task ring-2 ring-pri-blue-500 ring-opacity-60"
          : ""
      } focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
      onClick={() => onSelect(task)}
    >
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center justify-center h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompletion(task.id, !task.completed, e);
            }}
            className={`transition-all duration-300 flex items-center justify-center ${
              task.completed
                ? "text-neu-100 hover:text-neu-100 scale-95"
                : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-full p-1`}
            aria-label={`Mark task "${task.title}" as ${
              task.completed ? "incomplete" : "complete"
            }`}
          >
            {task.completed ? (
              <CheckSquare size={32} color="currentColor" autoSize={false} />
            ) : (
              <Record
                size={32}
                color="currentColor"
                autoSize={false}
                className={isNextTask ? "animate-bounce-subtle" : ""}
              />
            )}
          </button>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex-1">
            <h3
              className={`text-base font-outfit font-regular ${
                isEditing ? "" : "transition-all duration-300"
              } ${task.completed ? "text-neu-100 scale-95" : "text-neu-100"}`}
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
                  className="w-full bg-transparent text-base font-outfit font-regular text-neu-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-blue-500"
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
                        subtask.completed ? "bg-sup-suc-500" : "bg-neu-500"
                      }`}
                    />
                    <span
                      className={`font-outfit text-sm ${
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
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(task);
              }}
              className={`p-2 flex items-center justify-center ${
                task.completed
                  ? "text-neu-100 hover:text-neu-100"
                  : "text-neu-400 hover:text-neu-100"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
              aria-label={`Edit task "${task.title}"`}
            >
              <Pen size={24} color="currentColor" autoSize={false} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className={`p-2 flex items-center justify-center ${
                task.completed
                  ? "text-neu-100 hover:text-neu-100"
                  : "text-neu-400 hover:text-red-500"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
              aria-label={`Delete task "${task.title}"`}
            >
              <TrashBinTrash size={24} color="currentColor" autoSize={false} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
