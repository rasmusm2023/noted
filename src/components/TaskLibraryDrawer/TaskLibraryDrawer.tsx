import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { gsap } from "gsap";
import type { Task } from "../../types/task";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";

interface TaskLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
  selectedDate?: Date;
}

export const TaskLibraryDrawer = ({
  isOpen,
  onClose,
  onTaskSelect,
  onRemoveTask,
  selectedDate,
}: TaskLibraryDrawerProps) => {
  const [savedTasks, setSavedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingTask, setAddingTask] = useState<Task | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { currentUser } = useAuth();

  // Load tasks when drawer opens
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

  // GSAP animations
  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current) {
      // Opening animation
      gsap.set([modalRef.current, backdropRef.current], {
        opacity: 0,
      });
      gsap.set(modalRef.current, {
        x: "100%",
      });

      gsap.to([modalRef.current, backdropRef.current], {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out",
      });

      gsap.to(modalRef.current, {
        x: "0%",
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [isOpen]);

  // Cleanup GSAP animations on unmount
  useEffect(() => {
    return () => {
      if (modalRef.current) {
        gsap.killTweensOf(modalRef.current);
      }
      if (backdropRef.current) {
        gsap.killTweensOf(backdropRef.current);
      }
    };
  }, []);

  // Focus trap and click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
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
      // Focus the close button when drawer opens
      closeButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      // Closing animation
      gsap.to(modalRef.current, {
        x: "100%",
        duration: 0.25, // Increased from 0.15 to 0.25 (250ms)
        ease: "power2.in",
        onComplete: () => {
          onClose();
        },
      });

      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.083, // ~83ms duration to finish exactly when slide completes
        ease: "power2.in",
        delay: 0.167, // Start fading after 2/3 of slide animation (~167ms into 250ms)
      });
    } else {
      onClose();
    }
  };

  const handleTaskClick = async (task: Task) => {
    if (!currentUser) return;

    try {
      setAddingTask(task);

      // Create date in local timezone
      const taskDate = selectedDate ? new Date(selectedDate) : new Date();
      // Set to noon in local timezone
      taskDate.setHours(12, 0, 0, 0);
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

      // Just reload the task list without opening the modal
      await onTaskSelect(newTask);
      onClose(); // Close the library drawer

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

      // Use unsaveTask instead of onRemoveTask
      await taskService.unsaveTask(taskId);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-in modal overlay */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
        style={{ margin: 0, padding: 0 }}
      >
        <div
          ref={modalRef}
          className="fixed right-0 top-0 bottom-0 w-[85%] sm:w-[90%] md:w-[90%] lg:w-[85%] xl:w-[80%] max-w-4xl bg-transparent overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ margin: 0, padding: 0, border: "none", outline: "none" }}
        >
          {/* Solid background layer */}
          <div className="absolute inset-0 bg-[#F3F4F6] dark:bg-[#374151]"></div>

          {/* Extension to left edge to prevent white line */}
          <div className="absolute top-0 bottom-0 -left-8 w-8 bg-[#F3F4F6] dark:bg-[#374151]"></div>

          {/* See-through styling layer */}
          <div className="relative bg-neu-gre-100/50 dark:bg-neu-gre-900/50 backdrop-blur-sm min-h-full">
            <div className="relative z-10 p-8 sm:p-12 lg:p-16 xl:p-20">
              <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Icon
                    icon="mingcute:classify-2-line"
                    className="text-pri-blue-900 dark:text-pri-blue-200 w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <h3 className="font-medium font-inter text-neu-gre-800 dark:text-neu-whi-100 text-sm sm:text-md">
                    Your saved tasks
                  </h3>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={handleClose}
                  className="p-1 text-neu-gre-600 hover:text-neu-gre-800 dark:text-neu-gre-400 dark:hover:text-neu-whi-100 transition-all duration-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                  aria-label="Close task library"
                >
                  <Icon
                    icon="mingcute:close-circle-fill"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                </button>
              </div>
              {isLoading ? (
                <div className="text-neu-gre-800 dark:text-neu-gre-300 text-sm p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-neu-gre-400 dark:border-neu-gre-500 border-t-transparent"></div>
                    <span>Loading tasks...</span>
                  </div>
                </div>
              ) : (
                <>
                  {savedTasks.length === 0 ? (
                    <div className="text-neu-gre-800 dark:text-neu-gre-300 font-inter font-regular text-sm sm:text-base mb-4 p-4 text-center bg-neu-gre-200/30 dark:bg-neu-gre-800/30 rounded-lg border border-neu-gre-300/30 dark:border-neu-gre-700/30">
                      <Icon
                        icon="mingcute:inbox-line"
                        className="w-8 h-8 mx-auto mb-2 text-neu-gre-500 dark:text-neu-gre-400"
                      />
                      <p>No saved tasks</p>
                      <p className="text-xs text-neu-gre-600 dark:text-neu-gre-400 mt-1">
                        Save tasks to access them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-neu-gre-700 dark:text-neu-gre-400 font-inter font-regular mb-4 p-3 bg-neu-gre-200/20 dark:bg-neu-gre-800/20 rounded-lg border border-neu-gre-300/20 dark:border-neu-gre-700/20 text-xs sm:text-sm lg:text-base">
                        <div className="flex items-center space-x-2">
                          <Icon
                            icon="mingcute:information-line"
                            className="w-4 h-4 text-pri-pur-500 dark:text-pri-pur-400"
                          />
                          <span>Click a task to add it to your todo-list</span>
                        </div>
                      </div>
                      <div className="max-h-[60vh] sm:max-h-128 overflow-y-auto">
                        {savedTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`mb-3 sm:mb-4 rounded-xl border-2 border-pri-pur-500/25 dark:border-pri-pur-400/25 hover:border-pri-pur-600/50 dark:hover:border-pri-pur-300/50 transition-all duration-300 ${
                              addingTask?.id === task.id
                                ? "opacity-50 scale-95"
                                : ""
                            }`}
                          >
                            <button
                              onClick={() => handleTaskClick(task)}
                              className="w-full text-left font-inter font-regular px-3 sm:px-4 py-4 sm:py-6 text-neu-gre-800 dark:text-neu-whi-100 bg-neu-gre-200/50 dark:bg-neu-gre-800/50 hover:bg-neu-gre-300/50 dark:hover:bg-neu-gre-700/50 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                              aria-label={`Add task "${task.title}" to your list`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Icon
                                    icon="mingcute:add-circle-line"
                                    className="text-neu-gre-800 dark:text-neu-gre-300 w-5 h-5 sm:w-6 sm:h-6"
                                  />
                                  <div>
                                    <div className="font-medium text-neu-gre-800 dark:text-neu-whi-100 text-sm sm:text-base">
                                      {task.title}
                                    </div>
                                    <div className="flex items-center mt-1">
                                      {task.description && (
                                        <div className="text-neu-gre-700 dark:text-neu-gre-400 truncate text-xs sm:text-sm">
                                          {task.description}
                                        </div>
                                      )}
                                      {task.subtasks &&
                                        task.subtasks.length > 0 && (
                                          <div className="font-inter font-regular text-neu-gre-600 dark:text-neu-gre-400 text-xs sm:text-sm">
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
                                  className="p-1.5 sm:p-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                                  aria-label={`Remove task "${task.title}" from library`}
                                >
                                  <Icon
                                    icon="mingcute:delete-2-line"
                                    className="text-neu-gre-600 hover:text-sup-err-400 dark:text-neu-gre-400 dark:hover:text-sup-err-400 w-5 h-5 sm:w-6 sm:h-6"
                                  />
                                </div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
