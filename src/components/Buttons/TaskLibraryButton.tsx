import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface TaskLibraryButtonProps {
  onTaskSelect: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
}

export const TaskLibraryButton = ({
  onTaskSelect,
  onRemoveTask,
}: TaskLibraryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedTasks, setSavedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingTask, setAddingTask] = useState<Task | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { currentUser } = useAuth();

  // Load tasks when dropdown opens
  useEffect(() => {
    const loadSavedTasks = async () => {
      if (currentUser && isOpen) {
        setIsLoading(true);
        try {
          const tasks = await taskService.getSavedTasks(currentUser.uid);
          setSavedTasks(tasks);
        } catch (error) {
          console.error("Error loading saved tasks:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSavedTasks();
  }, [isOpen, currentUser]);

  // Focus trap and click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = dropdownRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      // Focus the close button when dropdown opens
      closeButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTaskClick = async (task: Task) => {
    if (!currentUser) return;

    try {
      setAddingTask(task);

      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const { id, userId, createdAt, updatedAt, isSaved, ...taskData } = task;
      const newTask = await taskService.createTask(currentUser.uid, {
        ...taskData,
        type: "task",
        scheduledTime: today.toISOString(),
        completed: false,
        date: today.toISOString(),
        isSaved: false,
      });

      onTaskSelect(newTask);

      setTimeout(() => {
        setAddingTask(null);
      }, 500);
    } catch (error) {
      console.error("Error creating task from saved task:", error);
      setAddingTask(null);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      // Optimistically remove from UI
      setSavedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );

      // Call the remove handler to unsave the task
      await onRemoveTask(taskId);
    } catch (error) {
      console.error("Error removing task:", error);
      // If there's an error, we could reload the tasks here
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`task-library-button flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isOpen
            ? "bg-pri-pur-500/50 text-white hover:bg-pri-pur-500/75"
            : "bg-pri-pur-500 text-neu-whi-100 hover:bg-pri-pur-500/75 border border-pri-tea-200"
        }`}
      >
        <Icon
          icon="mingcute:classify-add-2-fill"
          className={`w-6 h-6 ${
            isOpen ? "text-neu-whi-100" : "text-neu-gre-200"
          }`}
        />
        <span className="text-base font-inter font-regular">Task Library</span>
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className="absolute right-50 mt-2 w-[40rem] bg-neu-whi-100 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300 border border-neu-300 z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="p-8"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-neu-gre-800 font-inter font-semibold text-xl">
                  Your saved tasks
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-neu-600 hover:text-neu-800 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-tea-500"
                  aria-label="Close task library"
                >
                  <Icon icon="mingcute:close-line" className="w-5 h-5" />
                </button>
              </div>
              {isLoading ? (
                <div className="text-neu-gre-800 text-xs p-2">
                  Loading tasks...
                </div>
              ) : (
                <>
                  {savedTasks.length === 0 ? (
                    <div className="text-neu-gre-800 font-inter font-regular text-base mb-4">
                      No saved tasks
                    </div>
                  ) : (
                    <>
                      <div className="text-neu-gre-800 font-inter font-regular text-base mb-4">
                        Click a task to add it to your todo-list
                      </div>
                      <div className="max-h-128 overflow-y-auto">
                        <AnimatePresence>
                          {savedTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 1, scale: 1 }}
                              animate={
                                addingTask?.id === task.id
                                  ? {
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -20,
                                      backgroundColor: "#4ade80",
                                      transition: {
                                        duration: 0.3,
                                        ease: "easeOut",
                                      },
                                    }
                                  : {
                                      opacity: 1,
                                      scale: 1,
                                      backgroundColor: "#f3f4f6",
                                      transition: {
                                        duration: 0.3,
                                        ease: "easeOut",
                                      },
                                    }
                              }
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="mb-4"
                            >
                              <button
                                onClick={() => handleTaskClick(task)}
                                className="w-full text-left font-inter font-regular px-2 py-6 text-neu-800 hover:bg-neu-gre-400 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
                                aria-label={`Add task "${task.title}" to your list`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Icon
                                      icon="mingcute:round-line"
                                      className="w-6 h-6 text-neu-gre-800"
                                    />
                                    <div>
                                      <div className="font-medium text-base">
                                        {task.title}
                                      </div>
                                      <div className="flex items-center mt-1">
                                        {task.description && (
                                          <div className="text-xs text-neu-400 truncate">
                                            {task.description}
                                          </div>
                                        )}
                                        {task.subtasks &&
                                          task.subtasks.length > 0 && (
                                            <div className="text-sm font-inter font-regular text-neu-600">
                                              {task.subtasks.length} subtask
                                              {task.subtasks.length !== 1
                                                ? "s"
                                                : ""}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTask(task.id);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveTask(task.id);
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className="p-1 hover:bg-neu-gre-400 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
                                    aria-label={`Remove task "${task.title}" from library`}
                                  >
                                    <Icon
                                      icon="mingcute:delete-2-line"
                                      className="w-5 h-5 text-neu-600 hover:text-neu-800"
                                    />
                                  </div>
                                </div>
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
