import { useState } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import { TaskLibraryDrawer } from "../TaskLibraryDrawer/TaskLibraryDrawer";

interface TaskLibraryButtonProps {
  onTaskSelect: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
  variant?: "default" | "next7days";
  selectedDate?: Date;
}

export const TaskLibraryButton = ({
  onTaskSelect,
  onRemoveTask,
  variant = "default",
  selectedDate,
}: TaskLibraryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          tabIndex={1}
          className={`task-library-button flex items-center ${
            variant === "next7days"
              ? "justify-center w-11 h-11 rounded-md bg-pri-pur-400/20 hover:bg-pri-pur-400/30 dark:bg-pri-pur-500/30 dark:hover:bg-pri-pur-500/40"
              : "gap-2 px-3 sm:px-4 py-2 sm:py-2.5 lg:py-2.5 rounded-md"
          } transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 ${
            isOpen
              ? "bg-pri-pur-400 text-neu-whi-100 hover:bg-pri-pur-600 dark:bg-pri-pur-500 dark:hover:bg-pri-pur-600"
              : variant === "next7days"
              ? "text-pri-pur-500 hover:text-pri-pur-600 dark:text-pri-pur-200 dark:hover:text-pri-pur-100"
              : "bg-pri-pur-400 text-neu-whi-100 hover:bg-pri-pur-600 dark:bg-pri-pur-500 dark:hover:bg-pri-pur-600"
          }`}
        >
          <Icon
            icon="mingcute:classify-2-line"
            className={`${
              variant === "next7days"
                ? "w-6 h-6"
                : "w-6 h-6 sm:w-6 sm:h-6 lg:w-5 lg:h-5"
            } ${
              variant === "next7days"
                ? "text-pri-blue-900 dark:text-pri-blue-200"
                : "text-pri-blue-900 dark:text-pri-blue-200"
            }`}
          />
          {variant === "default" && (
            <span className="font-inter font-medium text-sm sm:text-base">
              <span className="lg:hidden">Library</span>
              <span className="hidden lg:inline">Library</span>
            </span>
          )}
        </button>
      </div>

      <TaskLibraryDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onTaskSelect={onTaskSelect}
        onRemoveTask={onRemoveTask}
        selectedDate={selectedDate}
      />
    </>
  );
};
