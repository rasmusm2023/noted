import React, { useState, useRef, useEffect } from "react";
import type { Task, Subtask } from "../../types/task";
import {
  Pen,
  TrashBinTrash,
  AddSquare,
  Sort,
  CloseCircle,
  CheckCircle,
  Record,
  Palette,
} from "solar-icon-set";

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TASK_COLORS = [
  { name: "Default", value: "bg-neu-800" },
  { name: "Blue", value: "bg-pri-blue-500" },
  { name: "Green", value: "bg-sup-suc-500" },
  { name: "Yellow", value: "bg-sup-war-500" },
  { name: "Red", value: "bg-sup-err-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Teal", value: "bg-teal-500" },
];

export function TaskModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
    task.backgroundColor || "bg-neu-800"
  );
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    item: Subtask;
    sourceIndex: number;
    currentIndex: number;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTaskButtonRef = useRef<HTMLButtonElement>(null);
  const closeModalButtonRef = useRef<HTMLButtonElement>(null);

  // Add new refs for focus trapping
  const firstColorRef = useRef<HTMLButtonElement>(null);
  const lastColorRef = useRef<HTMLButtonElement>(null);
  const closeColorPickerRef = useRef<HTMLButtonElement>(null);

  // Add focus trap effect for modal
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when modal opens
      titleInputRef.current?.focus();

      const handleModalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          // Get all focusable elements in the modal
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (!focusableElements) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (e.shiftKey) {
            // If shift + tab and we're on the first focusable element, focus the last one
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            // If tab and we're on the last focusable element, focus the first one
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleModalKeyDown);
      return () => {
        document.removeEventListener("keydown", handleModalKeyDown);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose({ ...task, shouldClose: true });
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose({ ...task, shouldClose: true });
    }
  };

  // Update state when task changes
  useEffect(() => {
    console.log("Task changed in modal:", task);
    setEditedTitle(task.title);
    setSubtasks(task.subtasks || []);
    setCurrentBackgroundColor(task.backgroundColor || "bg-neu-800");
  }, [task]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose({ ...task, shouldClose: true });
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
      setCurrentBackgroundColor(task.backgroundColor || "bg-neu-800"); // Revert on error
    }
  };

  // Handle drag and drop for subtasks
  const handleDragStart = (
    e: React.DragEvent,
    subtask: Subtask,
    index: number
  ) => {
    setIsDragging(true);
    setDragState({
      item: subtask,
      sourceIndex: index,
      currentIndex: index,
    });
    (e.target as HTMLElement).style.opacity = "0.4";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState) return;

    setDragState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: index,
      };
    });
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState) return;

    const newSubtasks = [...subtasks];
    const [movedItem] = newSubtasks.splice(dragState.sourceIndex, 1);
    newSubtasks.splice(index, 0, movedItem);

    // Update order property
    const updatedSubtasks = newSubtasks.map((subtask, idx) => ({
      ...subtask,
      order: idx,
    }));

    setSubtasks(updatedSubtasks);
    setDragState(null);
    setIsDragging(false);
    (e.target as HTMLElement).style.opacity = "1";

    // Save the new order
    try {
      console.log("Saving reordered subtasks:", updatedSubtasks);
      await onUpdate(task.id, {
        title: editedTitle,
        subtasks: updatedSubtasks,
      });
    } catch (error) {
      console.error("Error saving reordered subtasks:", error);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDragState(null);
    (e.target as HTMLElement).style.opacity = "1";
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
      console.log("Saving new subtask:", newSubtask);
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
      console.log("Saving subtask completion:", updatedSubtasks);
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
      console.log("Saving after subtask deletion:", updatedSubtasks);
      await onUpdate(task.id, {
        title: editedTitle,
        subtasks: updatedSubtasks,
      });
    } catch (error) {
      console.error("Error saving after subtask deletion:", error);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setEditedTitle(newTitle);
    try {
      console.log("Saving title change:", newTitle);
      await onUpdate(task.id, {
        title: newTitle,
        subtasks: subtasks,
      });
    } catch (error) {
      console.error("Error saving title change:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="bg-neu-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 flex-1">
              <Pen size={24} color="currentColor" className="text-neu-400" />
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={handleTitleChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleClose();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-lg font-outfit font-semibold text-neu-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-blue-500 transition-colors duration-200"
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <div className="relative" ref={colorPickerRef}>
                <button
                  ref={colorPickerButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center"
                  aria-label="Change task background color"
                >
                  <div
                    className={`w-6 h-6 rounded-md border-[2px] border-neu-500 ${currentBackgroundColor}`}
                  />
                </button>
                {showColorPicker && (
                  <div
                    className="absolute right-0 mt-3 p-4 bg-neu-700 rounded-lg shadow-lg z-10 w-48"
                    onKeyDown={handleColorPickerKeyDown}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-outfit text-neu-300">
                        Select color
                      </span>
                      <button
                        ref={closeColorPickerRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(false);
                        }}
                        className="p-1 text-neu-400 hover:text-neu-100 transition-colors"
                        aria-label="Close color picker"
                      >
                        <CloseCircle size={16} color="currentColor" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
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
                          className={`w-6 h-6 rounded-md ${
                            color.value
                          } ring-1 ring-neu-600 ${
                            currentBackgroundColor === color.value
                              ? "ring-2 ring-pri-blue-500"
                              : ""
                          }`}
                          aria-label={`Select ${color.name} color`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                ref={deleteTaskButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center"
                aria-label="Delete task"
              >
                <TrashBinTrash size={24} color="currentColor" />
              </button>
              <button
                ref={closeModalButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center"
                aria-label="Close modal"
              >
                <CloseCircle
                  size={24}
                  color="currentColor"
                  iconStyle="Broken"
                />
              </button>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="mt-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold font-outfit text-neu-200">
                Subtasks
              </h3>
              <div className="flex items-center justify-center">
                <Sort size={20} color="currentColor" className="text-neu-400" />
              </div>
            </div>
            <p className="text-sm font-outfit text-neu-400 mb-4">
              Break down large tasks into smaller, manageable steps with
              subtasks
            </p>

            {/* Add Subtask Input */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-2 flex-1 bg-neu-700 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-pri-blue-500">
                <div className="text-neu-400 flex items-center justify-center">
                  <AddSquare size={20} color="currentColor" />
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
                  className="flex-1 bg-transparent font-outfit text-base text-neu-100 placeholder-neu-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div
                  key={subtask.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, subtask, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => e.stopPropagation()}
                  className={`p-3 rounded-lg flex items-center justify-between transition-all duration-300 ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  } ${
                    subtask.completed
                      ? "bg-sup-suc-400 bg-opacity-50"
                      : "bg-neu-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtaskCompletion(subtask.id);
                      }}
                      className={`transition-all duration-300 flex items-center justify-center ${
                        subtask.completed
                          ? "text-neu-100 hover:text-neu-100 scale-95"
                          : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
                      }`}
                      aria-label={`Mark subtask "${subtask.title}" as ${
                        subtask.completed ? "incomplete" : "complete"
                      }`}
                    >
                      {subtask.completed ? (
                        <CheckCircle
                          size={20}
                          color="currentColor"
                          autoSize={false}
                        />
                      ) : (
                        <Record
                          size={20}
                          color="currentColor"
                          autoSize={false}
                        />
                      )}
                    </button>
                    <span
                      className={`font-outfit text-base ${
                        subtask.completed
                          ? "line-through text-neu-400"
                          : "text-neu-100"
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
                    className="p-1 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    aria-label={`Delete subtask "${subtask.title}"`}
                  >
                    <TrashBinTrash size={20} color="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
