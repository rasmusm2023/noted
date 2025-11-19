import React, { useState, useRef, useEffect } from "react";
import type { Task, Subtask } from "../../types/task";
import { Icon } from "@iconify/react";
import { useAuth } from "../../contexts/AuthContext";
import { goalService } from "../../services/goalService";
import type { Goal } from "../../services/goalService";
import { useNavigate } from "react-router-dom";

interface TaskDrawerProps {
  task: Task;
  isOpen: boolean;
  onClose: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onArchive?: (taskId: string) => Promise<void>;
}

const TASK_COLORS = [
  {
    name: "Stone",
    value:
      "bg-neu-gre-50/50 dark:bg-neu-gre-900/50 border-2 border-neu-gre-600/30 dark:border-neu-gre-700/30",
    hover: "hover:bg-neu-gre-400/50 dark:hover:bg-neu-gre-800/50",
  },
  {
    name: "Sky",
    value:
      "bg-task-blue-300/50 dark:bg-task-blue-900/50 border-2 border-task-blue-600/30 dark:border-task-blue-700/30",
    hover: "hover:bg-task-blue-400/50 dark:hover:bg-task-blue-800/50",
  },
  {
    name: "Emerald",
    value:
      "bg-task-green-300/50 dark:bg-task-green-900/50 border-2 border-task-green-600/30 dark:border-task-green-700/30",
    hover: "hover:bg-task-green-400/50 dark:hover:bg-task-green-800/50",
  },
  {
    name: "Amber",
    value:
      "bg-task-orange-300/50 dark:bg-task-orange-900/50 border-2 border-task-orange-600/30 dark:border-task-orange-700/30",
    hover: "hover:bg-task-orange-400/50 dark:hover:bg-task-orange-800/50",
  },
  {
    name: "Rose",
    value:
      "bg-task-pink-300/50 dark:bg-task-pink-900/50 border-2 border-task-pink-600/30 dark:border-task-pink-700/30",
    hover: "hover:bg-task-pink-400/50 dark:hover:bg-task-pink-800/50",
  },
  {
    name: "Lilac",
    value:
      "bg-task-purple-300/50 dark:bg-task-purple-900/50 border-2 border-task-purple-600/30 dark:border-task-purple-700/30",
    hover: "hover:bg-task-purple-400/50 dark:hover:bg-task-purple-800/50",
  },
  {
    name: "Peach",
    value:
      "bg-task-orange-300/50 dark:bg-task-orange-900/50 border-2 border-task-orange-600/30 dark:border-task-orange-700/30",
    hover: "hover:bg-task-orange-400/50 dark:hover:bg-task-orange-800/50",
  },
  {
    name: "Mint",
    value:
      "bg-task-cyan-300/50 dark:bg-task-cyan-900/50 border-2 border-task-cyan-600/30 dark:border-task-cyan-700/30",
    hover: "hover:bg-task-cyan-400/50 dark:hover:bg-task-cyan-800/50",
  },
  {
    name: "Steel",
    value:
      "bg-task-gray-300/50 dark:bg-task-gray-900/50 border-2 border-task-gray-600/30 dark:border-task-gray-700/30",
    hover: "hover:bg-task-gray-400/50 dark:hover:bg-task-gray-800/50",
  },
];

export function TaskDrawer({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
}: TaskDrawerProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
    task.backgroundColor || TASK_COLORS[0].value
  );
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    task.goalIds || []
  );
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTaskButtonRef = useRef<HTMLButtonElement>(null);
  const closeDrawerButtonRef = useRef<HTMLButtonElement>(null);

  // Add new refs for focus trapping
  const firstColorRef = useRef<HTMLButtonElement>(null);
  const lastColorRef = useRef<HTMLButtonElement>(null);
  const closeColorPickerRef = useRef<HTMLButtonElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  // Add auto-resize effect for title textarea
  useEffect(() => {
    const textarea = titleTextareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set the height to scrollHeight to fit the content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editedTitle]);

  // Add focus effect for drawer
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when drawer opens
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }
    }
  }, [isOpen]);

  // Add focus trap effect for drawer
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when drawer opens
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }

      const handleDrawerKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          // Get all focusable elements in the drawer
          const focusableElements = drawerRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;

          if (!focusableElements?.length) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          // If shift + tab and we're on the first focusable element, focus the last one
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
          // If tab and we're on the last focusable element, focus the first one
          else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleDrawerKeyDown);
      return () => {
        document.removeEventListener("keydown", handleDrawerKeyDown);
      };
    }
  }, [isOpen]);

  // Add effect for opening animation
  useEffect(() => {
    if (isOpen) {
      setIsOpening(true);
      // Reset opening state after animation
      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = async () => {
    try {
      // Create updates object without undefined fields
      const updates: Partial<Task> = {
        title: editedTitle,
        subtasks: subtasks,
        backgroundColor: currentBackgroundColor,
      };

      // Only add goalIds if they have a value
      if (selectedGoalIds.length > 0) {
        updates.goalIds = selectedGoalIds;
      }

      // Start closing animation
      setIsClosing(true);

      // Wait for animation to complete before closing
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Save any pending changes before closing
      await onUpdate(task.id, updates);
      onClose({ ...task, shouldClose: true });
    } catch (error) {
      console.error("Error saving changes before closing:", error);
      // Still close the drawer even if save fails
      onClose({ ...task, shouldClose: true });
    }
  };

  const handleClickOutside = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      await handleClose();
    }
  };

  // Update state when task changes
  useEffect(() => {
    setEditedTitle(task.title);
    setSubtasks(task.subtasks || []);
    setCurrentBackgroundColor(task.backgroundColor || TASK_COLORS[0].value);
  }, [task]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        await handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, task]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  // Add focus trap effect
  useEffect(() => {
    if (showColorPicker) {
      // Focus the first color button when opening
      firstColorRef.current?.focus();
    }
  }, [showColorPicker]);

  const handleColorPickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // If shift + tab and we're on the first color, focus the close button
        if (document.activeElement === firstColorRef.current) {
          e.preventDefault();
          closeColorPickerRef.current?.focus();
        }
      } else {
        // If tab and we're on the last color, focus the close button
        if (document.activeElement === lastColorRef.current) {
          e.preventDefault();
          closeColorPickerRef.current?.focus();
        }
      }
    } else if (e.key === "Escape") {
      setShowColorPicker(false);
    }
  };

  const handleColorSelect = async (color: string) => {
    try {
      setCurrentBackgroundColor(color); // Update local state immediately
      await onUpdate(task.id, {
        backgroundColor: color,
      });
      setShowColorPicker(false);
    } catch (error) {
      console.error("Error updating task color:", error);
      setCurrentBackgroundColor(task.backgroundColor || TASK_COLORS[0].value); // Revert on error
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
      order: subtasks.length,
    };

    const updatedSubtasks = [...subtasks, newSubtask];
    setSubtasks(updatedSubtasks);
    setNewSubtaskTitle("");

    try {
      await onUpdate(task.id, {
        title: editedTitle,
        subtasks: updatedSubtasks,
      });
      // Focus back on the subtask input after adding
      requestAnimationFrame(() => {
        if (subtaskInputRef.current) {
          subtaskInputRef.current.focus();
        }
      });
    } catch (error) {
      console.error("Error saving new subtask:", error);
    }
  };

  const handleSubtaskCompletion = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    setSubtasks(updatedSubtasks);

    try {
      await onUpdate(task.id, {
        title: editedTitle,
        subtasks: updatedSubtasks,
      });
    } catch (error) {
      console.error("Error saving subtask completion:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(
      (subtask) => subtask.id !== subtaskId
    );
    setSubtasks(updatedSubtasks);

    try {
      await onUpdate(task.id, {
        title: editedTitle,
        subtasks: updatedSubtasks,
      });
    } catch (error) {
      console.error("Error saving after subtask deletion:", error);
    }
  };

  const handleTitleChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newTitle = e.target.value;
    setEditedTitle(newTitle);
    try {
      await onUpdate(task.id, {
        title: newTitle,
        subtasks: subtasks,
      });
    } catch (error) {
      console.error("Error saving title change:", error);
    }
  };

  const shouldShowDivisionSuggestion = subtasks.length > 10;

  // Load goals when drawer opens
  useEffect(() => {
    const loadGoals = async () => {
      if (currentUser) {
        try {
          const userGoals = await goalService.getUserGoals(currentUser.uid);
          setGoals(userGoals);
        } catch (error) {
          console.error("Error loading goals:", error);
        }
      }
    };

    if (isOpen) {
      loadGoals();
    }
  }, [isOpen, currentUser]);

  // Handle goal selection
  const handleGoalChange = async (goalId: string) => {
    const newSelectedGoalIds = selectedGoalIds.includes(goalId)
      ? selectedGoalIds.filter((id) => id !== goalId)
      : [...selectedGoalIds, goalId];

    setSelectedGoalIds(newSelectedGoalIds);
    try {
      await onUpdate(task.id, { goalIds: newSelectedGoalIds });
    } catch (error) {
      console.error("Error updating task goals:", error);
      setSelectedGoalIds(task.goalIds || []); // Revert on error
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 transition-opacity ${
        isClosing ? "duration-200" : "duration-150"
      } ${isClosing ? "opacity-0" : isOpening ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-modal="true"
      onClick={handleClickOutside}
    >
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 bottom-0 w-[85%] sm:w-[90%] md:w-[90%] lg:w-[85%] xl:w-[80%] max-w-4xl bg-transparent overflow-y-auto transition-transform ${
          isClosing ? "duration-200" : "duration-150"
        } ${
          isClosing
            ? "translate-x-full"
            : isOpening
            ? "translate-x-full"
            : "translate-x-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background layer with left extension */}
        <div className="relative bg-neu-gre-50 dark:bg-[#18202F] min-h-full">
          {/* Extension to left edge to prevent white line */}
          <div className="absolute top-0 bottom-0 -left-8 w-8 bg-neu-gre-50 dark:bg-[#18202F]"></div>

          {/* Task color overlay if exists */}
          {task.backgroundColor && (
            <div
              className={`absolute inset-0 ${task.backgroundColor}`}
              style={{
                backgroundColor: task.backgroundColor.includes("bg-")
                  ? undefined
                  : task.backgroundColor,
              }}
            ></div>
          )}
          <div className="relative z-10">
            <div className="p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24">
              {/* AI Division Suggestion - Premium Feature */}
              {shouldShowDivisionSuggestion && (
                <div className="mb-8 sm:mb-10 md:mb-12 relative">
                  {/* Content with border and see-through orange glass background */}
                  <div className="relative p-4 rounded-lg border-2 border-sup-war-300 dark:border-sup-war-600 bg-sup-war-50/30 dark:bg-sup-war-900/20 backdrop-blur-sm overflow-hidden">
                    {/* Premium Badge */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-gradient-to-r from-sup-war-500 to-sup-war-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        PRO
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon
                          icon="mingcute:magic-wand-line"
                          className="w-5 h-5 text-sup-war-500 dark:text-sup-war-400"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-1">
                          ✨ Task-splitting recommended
                        </h4>
                        <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-3">
                          This task has a whopping {subtasks.length} subtasks.
                          Let AI efficiently split it into smaller, manageable
                          tasks in order to keep staying focused and productive.
                          Available with Pro plan.
                        </p>
                        <button
                          onClick={() => navigate("/upgrade")}
                          className="group px-4 py-2 bg-gradient-to-r from-sup-war-500 to-sup-war-600 hover:from-sup-war-600 hover:to-sup-war-700 text-white text-sm font-semibold rounded-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 transform hover:scale-105 flex items-center justify-center relative overflow-hidden whitespace-nowrap"
                        >
                          <div className="relative flex items-center justify-center">
                            {/* Hidden text to determine button width */}
                            <span className="invisible whitespace-nowrap">
                              Upgrade to Pro
                            </span>
                            {/* Visible text that transitions */}
                            <span className="absolute left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2 whitespace-nowrap">
                              Split task
                            </span>
                            <span className="absolute left-1/2 -translate-x-1/2 transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap">
                              Upgrade to Pro
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
                  <div
                    className={`flex items-center space-x-2 sm:space-x-3 flex-1 rounded-md p-2 sm:p-3 md:p-4 min-w-0 transition-colors duration-200 ${
                      task.completed
                        ? "bg-acc-green-400 dark:bg-acc-green-700 bg-opacity-75"
                        : "bg-neu-gre-50 dark:bg-[#18202F]"
                    }`}
                  >
                    <textarea
                      ref={titleTextareaRef}
                      value={editedTitle}
                      onChange={handleTitleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleClose();
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          handleClose();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 bg-transparent text-base sm:text-lg font-inter font-semibold focus:outline-none cursor-text border-b-2 border-transparent transition-colors duration-200 resize-none overflow-hidden min-h-[28px] py-0 min-w-0 text-neu-gre-800 dark:text-neu-gre-100 ${
                        task.completed
                          ? "focus:border-acc-green-700 dark:focus:border-acc-green-300"
                          : "focus:border-focus-300 dark:focus:border-focus-500"
                      }`}
                      spellCheck={false}
                      rows={1}
                      style={{ height: "auto" }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        titleTextareaRef.current?.focus();
                      }}
                      className="p-1.5 sm:p-2 text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                      aria-label="Focus task title input"
                    >
                      <Icon
                        icon="mingcute:pencil-3-line"
                        className="w-6 h-6"
                        aria-label="Edit task"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3 flex-shrink-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 rounded-lg p-1">
                    <div className="relative group" ref={colorPickerRef}>
                      <button
                        ref={colorPickerButtonRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(!showColorPicker);
                        }}
                        className="p-1.5 sm:p-2 text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                        aria-label="Change task background color"
                        aria-expanded={showColorPicker}
                        aria-haspopup="true"
                      >
                        <div
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md border-[2px] border-neu-gre-400 dark:border-neu-gre-600 ${
                            currentBackgroundColor ||
                            "bg-neu-gre-200 dark:bg-neu-gre-800"
                          }`}
                        />
                      </button>
                      {!showColorPicker && (
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-neu-gre-800 dark:bg-neu-gre-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Change task color
                        </div>
                      )}
                      {showColorPicker && (
                        <div
                          className="absolute left-0 mt-2 sm:mt-3 p-3 sm:p-4 bg-neu-whi-100 dark:bg-neu-gre-700 rounded-lg shadow-lg z-10 w-40 sm:w-48 border border-neu-gre-200 dark:border-neu-gre-600"
                          onKeyDown={handleColorPickerKeyDown}
                        >
                          <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <span className="text-xs sm:text-sm font-inter text-neu-gre-800 dark:text-neu-gre-100">
                              Select a background color
                            </span>
                            <button
                              ref={closeColorPickerRef}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowColorPicker(false);
                              }}
                              className="p-1 text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                              aria-label="Close color picker"
                            >
                              <Icon
                                icon="mingcute:close-circle-fill"
                                className="w-5 h-5 sm:w-6 sm:h-6"
                              />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                            {TASK_COLORS.map((color, index) => (
                              <button
                                ref={
                                  index === 0
                                    ? firstColorRef
                                    : index === TASK_COLORS.length - 1
                                    ? lastColorRef
                                    : null
                                }
                                key={color.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorSelect(color.value);
                                }}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md ${
                                  color.value
                                } ring-2 ring-neu-gre-300 dark:ring-neu-gre-600 ${
                                  currentBackgroundColor === color.value
                                    ? "ring-4 ring-pri-pur-400 dark:ring-pri-pur-300"
                                    : ""
                                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500`}
                                aria-label={`Select ${color.name} color`}
                                aria-pressed={
                                  currentBackgroundColor === color.value
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {onArchive && !task.isArchived && (
                      <div className="relative group">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (onArchive) {
                              await onArchive(task.id);
                              onClose({ ...task, shouldClose: true });
                            }
                          }}
                          className="p-1.5 sm:p-2 text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                          aria-label="Archive task"
                        >
                          <Icon
                            icon="mingcute:box-2-line"
                            className="w-6 h-6"
                            aria-label="Archive task"
                          />
                        </button>
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-neu-gre-800 dark:bg-neu-gre-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Archive task
                        </div>
                      </div>
                    )}
                    <div className="relative group">
                      <button
                        ref={deleteTaskButtonRef}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onDelete(task.id);
                          onClose({ ...task, shouldClose: true });
                        }}
                        className="p-1.5 sm:p-2 text-neu-gre-600 dark:text-neu-gre-300 hover:text-sup-err-400 dark:hover:text-sup-err-500 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                        aria-label="Delete task"
                      >
                        <Icon
                          icon="mingcute:delete-2-line"
                          className="w-6 h-6"
                          aria-label="Delete task"
                        />
                      </button>
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-neu-gre-800 dark:bg-neu-gre-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Delete task
                      </div>
                    </div>
                    <div className="relative group">
                      <button
                        ref={closeDrawerButtonRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose();
                        }}
                        className="p-1.5 sm:p-2 text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                        aria-label="Close drawer"
                      >
                        <Icon
                          icon="mingcute:close-circle-fill"
                          className="w-6 h-6"
                          aria-label="Close drawer"
                        />
                      </button>
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-neu-gre-800 dark:bg-neu-gre-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Close drawer
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtasks Section */}
              <div
                className="mb-8 sm:mb-10 md:mb-12"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Icon
                      icon="mingcute:more-2-fill"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-neu-gre-800 dark:text-neu-gre-100"
                    />
                    <h3 className="text-sm sm:text-md font-medium font-inter text-neu-gre-800 dark:text-neu-gre-100">
                      Subtasks
                    </h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-inter text-neu-gre-600 dark:text-neu-gre-300 mb-3 sm:mb-4">
                  Break down large tasks into smaller, manageable steps with
                  subtasks
                </p>

                {/* Add Subtask Input */}
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 flex-1 bg-neu-gre-50 dark:bg-[#18202F] rounded-md px-3 sm:px-4 py-2 border-2 border-dashed border-pri-pur-500/75 dark:border-pri-pur-300/75 focus-within:border-2 focus-within:border-solid focus-within:border-pri-pur-500/75 dark:focus-within:border-pri-pur-300/75 transition-all duration-500 ease-in-out group">
                    <div className="flex items-center justify-center">
                      <Icon
                        icon="mingcute:add-circle-line"
                        className="w-5 h-5 sm:w-6 sm:h-6 text-pri-pur-500/75 dark:text-pri-pur-300/75 group-focus-within:text-pri-pur-500 dark:group-focus-within:text-pri-pur-300 transition-colors duration-200"
                      />
                    </div>
                    <input
                      ref={subtaskInputRef}
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add a subtask..."
                      className="flex-1 bg-transparent py-1.5 sm:py-2 font-inter text-sm sm:text-base text-neu-gre-800 dark:text-neu-gre-100 placeholder-neu-gre-500 group-focus-within:placeholder-neu-gre-600 dark:placeholder-neu-gre-300 dark:group-focus-within:placeholder-neu-gre-200 focus:outline-none transition-colors duration-200"
                      tabIndex={0}
                      aria-label="Add new subtask"
                    />
                  </div>
                </div>

                {/* Subtasks List */}
                <div className="space-y-1.5 sm:space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 sm:p-3 rounded-lg flex items-center justify-between transition-all duration-300 ${
                        subtask.completed
                          ? "bg-acc-green-400 dark:bg-acc-green-700 bg-opacity-75"
                          : "bg-neu-gre-200 dark:bg-neu-gre-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubtaskCompletion(subtask.id);
                          }}
                          className={`transition-all duration-300 flex items-center justify-center rounded-md p-1.5 sm:p-2 ${
                            subtask.completed
                              ? "text-acc-green-700 dark:text-acc-green-300 hover:text-acc-green-800 dark:hover:text-acc-green-200 scale-95"
                              : "text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 hover:scale-95"
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-500`}
                          aria-label={`Mark subtask "${subtask.title}" as ${
                            subtask.completed ? "incomplete" : "complete"
                          }`}
                          aria-pressed={subtask.completed}
                        >
                          {subtask.completed ? (
                            <Icon
                              icon="mingcute:check-2-fill"
                              className="w-6 h-6"
                              aria-label="Save changes"
                            />
                          ) : (
                            <Icon
                              icon="mingcute:round-line"
                              className="w-5 h-5 sm:w-6 sm:h-6"
                            />
                          )}
                        </button>
                        <span
                          className={`font-inter text-sm sm:text-base ${
                            subtask.completed
                              ? "line-through text-acc-green-700 dark:text-acc-green-300"
                              : "text-neu-gre-800 dark:text-neu-gre-100"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubtask(subtask.id);
                        }}
                        className={`p-1.5 sm:p-2 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md ${
                          subtask.completed
                            ? "text-acc-green-700 dark:text-acc-green-300 hover:text-sup-err-400 dark:hover:text-sup-err-500"
                            : "text-neu-gre-400 dark:text-neu-gre-400 hover:text-sup-err-400 dark:hover:text-sup-err-500"
                        }`}
                        aria-label={`Delete subtask "${subtask.title}"`}
                      >
                        <Icon
                          icon="mingcute:delete-back-line"
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/*Goal Tags */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <Icon
                    icon="mingcute:target-line"
                    className="text-neu-gre-800 dark:text-neu-gre-100 w-4 h-4 sm:w-5 sm:h-5"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm sm:text-md font-medium font-inter text-neu-gre-800 dark:text-neu-gre-100">
                    Associated goals
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-inter text-neu-gre-600 dark:text-neu-gre-300 mb-3 sm:mb-4">
                  Associate this task with one or more goals to help you stay on
                  track
                </p>
                <div
                  className="flex flex-wrap gap-1.5 sm:gap-2"
                  role="group"
                  aria-labelledby="goals-group-label"
                >
                  <span id="goals-group-label" className="sr-only">
                    Select goals to associate with this task
                  </span>
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalChange(goal.id)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-inter transition-all duration-200 flex items-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 ${
                        selectedGoalIds.includes(goal.id)
                          ? "bg-pri-pur-400 dark:bg-pri-pur-500 text-neu-whi-100 dark:text-neu-gre-100"
                          : "bg-neu-gre-200 dark:bg-neu-gre-600 text-neu-gre-600 dark:text-neu-gre-300 hover:bg-pri-pur-200 dark:hover:bg-pri-pur-400/30"
                      }`}
                      aria-label={`${
                        selectedGoalIds.includes(goal.id) ? "Remove" : "Select"
                      } goal "${goal.title}"`}
                      aria-pressed={selectedGoalIds.includes(goal.id)}
                      role="checkbox"
                      aria-checked={selectedGoalIds.includes(goal.id)}
                    >
                      {goal.title}
                      {selectedGoalIds.includes(goal.id) && (
                        <Icon
                          icon="mingcute:close-fill"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          aria-hidden="true"
                          aria-label="Remove goal"
                        />
                      )}
                    </button>
                  ))}
                  {goals.length === 0 && (
                    <span
                      className="text-xs sm:text-sm font-inter text-neu-gre-600 dark:text-neu-gre-300"
                      role="status"
                    >
                      No goals available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Close see-through styling layer */}
      </div>
    </div>
  );
}
