import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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

      // Create date in UTC to avoid timezone issues
      const taskDate = selectedDate ? new Date(selectedDate) : new Date();
      // Set to noon UTC
      taskDate.setUTCHours(12, 0, 0, 0);
      const isoDate = taskDate.toISOString();

      console.log("Creating task with date:", {
        originalDate: taskDate,
        isoDate,
        localTime: new Date(isoDate).toLocaleString(),
      });

      const { id, userId, createdAt, updatedAt, isSaved, ...taskData } = task;
      const newTask = await taskService.createTask(currentUser.uid, {
        ...taskData,
        type: "task",
        scheduledTime: isoDate,
        completed: false,
        date: isoDate,
        isSaved: false,
        subtasks: taskData.subtasks?.map((subtask) => ({
          ...subtask,
          completed: false,
        })),
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
      // Find the task being removed to get its originalTaskId
      const taskToRemove = savedTasks.find((task) => task.id === taskId);
      if (!taskToRemove) return;

      // Optimistically remove from UI
      setSavedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );

      // Call the remove handler to unsave the task
      await onRemoveTask(taskId);

      // If this task has an originalTaskId, we should update the original task's saved state
      if (taskToRemove.originalTaskId) {
        // The parent component will handle updating the original task's saved state
        // through the onRemoveTask callback
      }
    } catch (error) {
      console.error("Error removing task:", error);
      // If there's an error, we could reload the tasks here
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={1}
        className={`task-library-button flex items-center ${
          variant === "next7days"
            ? "justify-center w-8 h-8 rounded-md bg-pri-pur-400/10 hover:bg-pri-pur-400/20 dark:bg-pri-pur-500/20 dark:hover:bg-pri-pur-500/30"
            : "gap-2 px-3 sm:px-4 py-2 sm:py-2.5 lg:py-2.5 rounded-md"
        } transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 ${
          isOpen
            ? "bg-pri-pur-400 text-neu-whi-100 hover:bg-pri-pur-600 dark:bg-pri-pur-500 dark:hover:bg-pri-pur-600"
            : variant === "next7days"
            ? "text-pri-pur-400 hover:text-pri-pur-500 dark:text-pri-pur-300 dark:hover:text-pri-pur-200"
            : "bg-pri-pur-400 text-neu-whi-100 hover:bg-pri-pur-600 dark:bg-pri-pur-500 dark:hover:bg-pri-pur-600"
        }`}
      >
        <Icon
          icon="mingcute:classify-2-fill"
          className={`${
            variant === "next7days"
              ? "w-5 h-5"
              : "w-6 h-6 sm:w-6 sm:h-6 lg:w-5 lg:h-5"
          } ${
            variant === "next7days"
              ? "text-pri-pur-400 dark:text-pri-pur-300"
              : "text-neu-whi-100"
          }`}
        />
        {variant !== "next7days" && (
          <span className="font-inter font-medium text-sm sm:text-base">
            <span className="lg:hidden">Library</span>
            <span className="hidden lg:inline">Task Library</span>
          </span>
        )}
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
            className={`fixed lg:absolute ${
              variant === "next7days"
                ? "left-0"
                : "left-0 right-0 mx-auto lg:left-0 lg:right-auto lg:mx-0"
            } mt-2 ${
              variant === "next7days"
                ? "w-[320px]"
                : "w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] lg:w-[40rem]"
            } bg-neu-whi-100 dark:bg-neu-gre-600 rounded-md shadow-lg border border-neu-gre-200 dark:border-neu-gre-700 z-50`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className={`${
                variant === "next7days" ? "p-4" : "p-4 sm:p-6 lg:p-8"
              }`}
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Icon
                    icon="mingcute:classify-2-fill"
                    className={`text-neu-gre-800 dark:text-neu-whi-100 ${
                      variant === "next7days"
                        ? "w-4 h-4"
                        : "w-4 h-4 sm:w-5 sm:h-5"
                    }`}
                  />
                  <h3
                    className={`font-medium font-inter text-neu-gre-800 dark:text-neu-whi-100 ${
                      variant === "next7days" ? "text-sm" : "text-sm sm:text-md"
                    }`}
                  >
                    Your saved tasks
                  </h3>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neu-gre-600 hover:text-neu-gre-800 dark:text-neu-gre-400 dark:hover:text-neu-whi-100 transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                  aria-label="Close task library"
                >
                  <Icon
                    icon="mingcute:close-circle-fill"
                    className={`${
                      variant === "next7days"
                        ? "w-5 h-5"
                        : "w-5 h-5 sm:w-6 sm:h-6"
                    }`}
                  />
                </button>
              </div>
              {isLoading ? (
                <div className="text-neu-gre-800 dark:text-neu-gre-300 text-xs p-2">
                  Loading tasks...
                </div>
              ) : (
                <>
                  {savedTasks.length === 0 ? (
                    <div className="text-neu-gre-800 dark:text-neu-gre-300 font-inter font-regular text-sm sm:text-base mb-4">
                      No saved tasks
                    </div>
                  ) : (
                    <>
                      <div
                        className={`text-neu-gre-700 dark:text-neu-gre-400 font-inter font-regular mb-4 ${
                          variant === "next7days"
                            ? "text-sm"
                            : "text-xs sm:text-sm lg:text-base"
                        }`}
                      >
                        Click a task to add it to your todo-list
                      </div>
                      <div className="max-h-[60vh] sm:max-h-128 overflow-y-auto">
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
                                      backgroundColor: "transparent",
                                      transition: {
                                        duration: 0.3,
                                        ease: "easeOut",
                                      },
                                    }
                              }
                              className="mb-3 sm:mb-4 rounded-xl"
                            >
                              <button
                                onClick={() => handleTaskClick(task)}
                                className="w-full text-left font-inter font-regular px-3 sm:px-4 py-4 sm:py-6 text-neu-gre-800 dark:text-neu-whi-100 bg-task-stone-100 hover:bg-task-stone-100/80 dark:bg-neu-gre-800 dark:hover:bg-neu-gre-700 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                                aria-label={`Add task "${task.title}" to your list`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <Icon
                                      icon="mingcute:add-circle-fill"
                                      className={`text-neu-gre-800 dark:text-neu-gre-300 ${
                                        variant === "next7days"
                                          ? "w-5 h-5"
                                          : "w-5 h-5 sm:w-6 sm:h-6"
                                      }`}
                                    />
                                    <div>
                                      <div
                                        className={`font-medium text-neu-gre-800 dark:text-neu-whi-100 ${
                                          variant === "next7days"
                                            ? "text-sm"
                                            : "text-sm sm:text-base"
                                        }`}
                                      >
                                        {task.title}
                                      </div>
                                      <div className="flex items-center mt-1">
                                        {task.description && (
                                          <div
                                            className={`text-neu-gre-700 dark:text-neu-gre-400 truncate ${
                                              variant === "next7days"
                                                ? "text-xs"
                                                : "text-xs sm:text-sm"
                                            }`}
                                          >
                                            {task.description}
                                          </div>
                                        )}
                                        {task.subtasks &&
                                          task.subtasks.length > 0 && (
                                            <div
                                              className={`font-inter font-regular text-neu-gre-600 dark:text-neu-gre-400 ${
                                                variant === "next7days"
                                                  ? "text-xs"
                                                  : "text-xs sm:text-sm"
                                              }`}
                                            >
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
                                    className="p-1.5 sm:p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 transition-colors duration-200 rounded-md"
                                    aria-label={`Remove task "${task.title}" from library`}
                                  >
                                    <Icon
                                      icon="mingcute:delete-2-fill"
                                      className={`text-neu-gre-600 hover:text-sup-err-400 dark:text-neu-gre-400 dark:hover:text-sup-err-400 ${
                                        variant === "next7days"
                                          ? "w-5 h-5"
                                          : "w-5 h-5 sm:w-6 sm:h-6"
                                      }`}
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
