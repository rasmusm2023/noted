import React, { useState, useRef, useEffect } from "react";
import type { Task, Subtask } from "../../types/task";
import { Icon } from "@iconify/react";
import { useAuth } from "../../contexts/AuthContext";
import { goalService } from "../../services/goalService";
import type { Goal } from "../../services/goalService";

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TASK_COLORS = [
  {
    name: "Stone",
    value: "bg-task-stone-100",
    hover: "hover:bg-task-stone-hover",
  },
  {
    name: "Sky",
    value: "bg-task-sky-100",
    hover: "hover:bg-task-sky-hover",
  },
  {
    name: "Emerald",
    value: "bg-task-emerald-100",
    hover: "hover:bg-task-emerald-hover",
  },
  {
    name: "Amber",
    value: "bg-task-amber-100",
    hover: "hover:bg-task-amber-hover",
  },
  {
    name: "Rose",
    value: "bg-task-rose-100",
    hover: "hover:bg-task-rose-hover",
  },
  {
    name: "Lilac",
    value: "bg-task-lilac-100",
    hover: "hover:bg-task-lilac-hover",
  },
  {
    name: "Peach",
    value: "bg-task-peach-100",
    hover: "hover:bg-task-peach-hover",
  },
  {
    name: "Mint",
    value: "bg-task-mint-100",
    hover: "hover:bg-task-mint-hover",
  },
  {
    name: "Steel",
    value: "bg-task-steel-100",
    hover: "hover:bg-task-steel-hover",
  },
];

// Add these keyframes at the top of the file, after the imports
const fadeOut = {
  opacity: 0,
  transition: "opacity 200ms ease-out",
};

const scaleOut = {
  transform: "scale(0.95)",
  opacity: 0,
  transition: "transform 200ms ease-out, opacity 200ms ease-out",
};

export function TaskModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const { currentUser } = useAuth();
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
    task.backgroundColor || "bg-neu-gre-100"
  );
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    task.goalIds || []
  );
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTaskButtonRef = useRef<HTMLButtonElement>(null);
  const closeModalButtonRef = useRef<HTMLButtonElement>(null);

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

  // Add focus effect for modal
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when modal opens
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }
    }
  }, [isOpen]);

  // Add focus trap effect for modal
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when modal opens
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }

      const handleModalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          // Get all focusable elements in the modal
          const focusableElements = modalRef.current?.querySelectorAll(
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

      document.addEventListener("keydown", handleModalKeyDown);
      return () => {
        document.removeEventListener("keydown", handleModalKeyDown);
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
      // Still close the modal even if save fails
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
    setCurrentBackgroundColor(task.backgroundColor || "bg-neu-gre-100");
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
      setCurrentBackgroundColor(task.backgroundColor || "bg-neu-gre-100"); // Revert on error
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

  // Load goals when modal opens
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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${
        isClosing ? "duration-200" : "duration-150"
      } ${isClosing ? "opacity-0" : isOpening ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-modal="true"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className={`bg-neu-whi-100 rounded-5xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative transition-all ${
          isClosing ? "duration-200" : "duration-150"
        } ${
          isClosing
            ? "opacity-0 scale-95"
            : isOpening
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-3 flex-1 bg-neu-gre-200 rounded-md p-4">
                <Icon
                  icon="mingcute:pencil-3-fill"
                  className="text-neu-gre-800 w-6 h-6"
                />
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
                  className="flex-1 bg-transparent text-lg font-inter font-semibold text-neu-gre-800 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-pur-300 transition-colors duration-200 resize-none overflow-hidden min-h-[28px] py-0"
                  rows={1}
                  style={{ height: "auto" }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className="flex items-center space-x-2 rounded-lg p-1">
                <div className="relative" ref={colorPickerRef}>
                  <button
                    ref={colorPickerButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColorPicker(!showColorPicker);
                    }}
                    className="p-2 text-neu-gre-600 hover:text-neu-gre-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                    aria-label="Change task background color"
                    aria-expanded={showColorPicker}
                    aria-haspopup="true"
                  >
                    <div
                      className={`w-8 h-8 rounded-md border-[2px] border-neu-gre-400 ${currentBackgroundColor}`}
                    />
                  </button>
                  {showColorPicker && (
                    <div
                      className="absolute right-0 mt-3 p-4 bg-neu-whi-100 rounded-lg shadow-lg z-10 w-48 border border-neu-gre-200"
                      onKeyDown={handleColorPickerKeyDown}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-inter text-neu-gre-800">
                          Select a background color
                        </span>
                        <button
                          ref={closeColorPickerRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker(false);
                          }}
                          className="p-1 text-neu-gre-600 hover:text-neu-gre-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                          aria-label="Close color picker"
                        >
                          <Icon
                            icon="mingcute:close-circle-fill"
                            className="w-6 h-6"
                          />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 p-2">
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
                            className={`w-8 h-8 rounded-md ${
                              color.value
                            } ring-2 ring-neu-gre-300 ${
                              currentBackgroundColor === color.value
                                ? "ring-4 ring-pri-pur-400"
                                : ""
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500`}
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
                <button
                  ref={deleteTaskButtonRef}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onDelete(task.id);
                    onClose({ ...task, shouldClose: true });
                  }}
                  className="p-2 text-neu-gre-600 hover:text-sup-err-400 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                  aria-label="Delete task"
                >
                  <Icon icon="mingcute:delete-2-fill" className="w-6 h-6" />
                </button>
                <button
                  ref={closeModalButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-2 text-neu-gre-600 hover:text-neu-gre-800 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                  aria-label="Close modal"
                >
                  <Icon icon="mingcute:close-circle-fill" className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="mb-12" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Icon
                  icon="mingcute:more-2-fill"
                  className="text-neu-gre-800 w-5 h-5"
                />
                <h3 className="text-md font-medium font-inter text-neu-gre-800">
                  Subtasks
                </h3>
              </div>
            </div>
            <p className="text-sm font-inter text-neu-gre-600 mb-4">
              Break down large tasks into smaller, manageable steps with
              subtasks
            </p>

            {/* Add Subtask Input */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-2 flex-1 bg-neu-gre-200 rounded-md px-4 py-2 ring-2 ring-pri-pur-500/25 focus-within:ring-2 focus-within:ring-pri-pur-500/75 transition-all duration-200 ease-in-out">
                <div className="flex items-center justify-center">
                  <Icon
                    icon="mingcute:add-fill"
                    className="w-6 h-6 text-pri-pur-300"
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
                  className="flex-1 bg-transparent py-2 font-inter text-base text-neu-gre-800 placeholder-neu-gre-600 focus:outline-none"
                  tabIndex={0}
                  aria-label="Add new subtask"
                />
              </div>
            </div>

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div
                  key={subtask.id}
                  onClick={(e) => e.stopPropagation()}
                  className={`p-3 rounded-lg flex items-center justify-between transition-all duration-300 ${
                    subtask.completed
                      ? "bg-sup-suc-400 bg-opacity-75"
                      : "bg-neu-gre-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtaskCompletion(subtask.id);
                      }}
                      className={`transition-all duration-300 flex items-center justify-center rounded-md p-2 ${
                        subtask.completed
                          ? "text-neu-gre-800 hover:text-neu-gre-600 scale-95"
                          : "text-neu-gre-800 hover:text-neu-gre-600 hover:scale-95"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500`}
                      aria-label={`Mark subtask "${subtask.title}" as ${
                        subtask.completed ? "incomplete" : "complete"
                      }`}
                      aria-pressed={subtask.completed}
                    >
                      {subtask.completed ? (
                        <Icon
                          icon="mingcute:check-2-fill"
                          className="w-6 h-6"
                        />
                      ) : (
                        <Icon icon="mingcute:round-line" className="w-6 h-6" />
                      )}
                    </button>
                    <span
                      className={`font-inter text-base ${
                        subtask.completed
                          ? "line-through text-neu-gre-600"
                          : "text-neu-gre-800"
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
                    className="p-2 text-neu-gre-600 hover:text-sup-err-400 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md"
                    aria-label={`Delete subtask "${subtask.title}"`}
                  >
                    <Icon icon="mingcute:delete-2-fill" className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/*Goal Tags */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <Icon
                icon="mingcute:target-fill"
                className="text-neu-gre-800 w-5 h-5"
                aria-hidden="true"
              />
              <h3 className="text-md font-medium font-inter text-neu-gre-800">
                Associated goals
              </h3>
            </div>
            <p className="text-sm font-inter text-neu-gre-600 mb-4">
              Associate this task with one or more goals to help you stay on
              track
            </p>
            <div
              className="flex flex-wrap gap-2"
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
                  className={`px-3 py-2 rounded-full text-sm font-inter transition-all duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 ${
                    selectedGoalIds.includes(goal.id)
                      ? "bg-pri-pur-400 text-neu-whi-100"
                      : "bg-neu-gre-100 text-neu-gre-600 hover:bg-pri-pur-100/50"
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
                      className="w-4 h-4"
                      aria-hidden="true"
                      aria-label="Remove goal"
                    />
                  )}
                </button>
              ))}
              {goals.length === 0 && (
                <span
                  className="text-sm font-inter text-neu-gre-600"
                  role="status"
                >
                  No goals available
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
