import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

interface QuickActionsProps {
  onAddTask: (title: string, description: string) => void;
}

export const QuickActions = ({ onAddTask }: QuickActionsProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [focusedInput, setFocusedInput] = useState<"task" | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        onAddTask(newTaskTitle.trim(), newTaskDescription.trim());
        setNewTaskTitle("");
        setNewTaskDescription("");
        if (taskInputRef.current) {
          taskInputRef.current.focus();
        }
      }
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      setNewTaskDescription("");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div
        className={`p-6 bg-pri-pur-500/10 dark:bg-pri-pur-500/20 rounded-lg hover:bg-neu-whi-100 dark:hover:bg-neu-gre-800 transition-colors border-2 ${
          focusedInput === "task"
            ? "border-solid border-pri-pur-500 dark:border-pri-pur-400 bg-pri-pur-500/20 dark:bg-pri-pur-500/30"
            : "border-dashed border-pri-pur-500/75 dark:border-pri-pur-500/50"
        }`}
        onClick={() => {
          if (taskInputRef.current) {
            taskInputRef.current.focus();
          }
        }}
        role="button"
        onKeyDown={(e) => {
          if (!focusedInput && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            if (taskInputRef.current) {
              taskInputRef.current.focus();
            }
          }
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-pri-pur-500 dark:bg-pri-pur-400 rounded-md flex items-center justify-center">
            <Icon
              icon="mingcute:add-fill"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
              color="#FFF5F8"
            />
          </div>
          <div className="text-left font-inter text-base flex-1">
            <input
              ref={taskInputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleTaskKeyPress}
              onFocus={() => setFocusedInput("task")}
              onBlur={() => setFocusedInput(null)}
              placeholder="New task"
              tabIndex={4}
              className="w-full bg-transparent font-semibold text-base sm:text-lg text-neu-gre-800 dark:text-neu-gre-100 placeholder-neu-gre-600 dark:placeholder-neu-gre-400 focus-visible:outline-none"
              autoFocus
            />
            <p className="text-neu-gre-500 dark:text-neu-gre-400 text-xs sm:text-sm font-inter mt-2">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
