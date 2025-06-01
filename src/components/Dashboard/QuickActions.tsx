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
        className={`p-6 bg-pri-pur-500/10 dark:bg-pri-pur-500/20 rounded-lg hover:bg-neu-whi-100 dark:hover:bg-neu-gre-800 transition-colors border-2 border-dashed border-pri-pur-500/75 dark:border-pri-pur-500/50 ${
          focusedInput === "task"
            ? "bg-pri-pur-500/20 dark:bg-pri-pur-500/30 border-pri-pur-500 dark:border-pri-pur-400"
            : ""
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-pri-pur-500 dark:bg-pri-pur-400 rounded-lg flex items-center justify-center">
            <Icon
              icon="mingcute:add-fill"
              width={32}
              height={32}
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
              className="w-full bg-transparent font-semibold text-neu-gre-800 dark:text-neu-gre-100 placeholder-neu-gre-600 dark:placeholder-neu-gre-400 focus-visible:outline-none"
              autoFocus
            />
            <p className="text-neu-gre-500 dark:text-neu-gre-400 text-sm font-inter mt-2">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
