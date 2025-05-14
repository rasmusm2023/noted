import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, SectionItem } from "../types/task";
import {
  TrashBinTrash,
  Pen,
  CheckCircle,
  Record,
  Eye,
  EyeClosed,
  AddSquare,
  CheckSquare,
  Sort,
  AlignTop,
  AlignBottom,
  AlignVerticalCenter,
} from "solar-icon-set";
import confetti from "canvas-confetti";

type ListItem = Task | SectionItem;

type DragState = {
  item: ListItem;
  sourceIndex: number;
  currentIndex: number;
  position: "before" | "after";
  sourceDay: number;
  targetDay: number;
};

type DayData = {
  date: Date;
  items: ListItem[];
};

export function Next7Days() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTimestamp, setIsCreatingTimestamp] = useState(false);
  const [newTaskInputs, setNewTaskInputs] = useState<{
    [key: number]: { title: string; description: string };
  }>({});
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [hideCompleted, setHideCompleted] = useState(() => {
    const savedState = localStorage.getItem("hideCompleted");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [completedPosition, setCompletedPosition] = useState<
    "top" | "bottom" | "mixed"
  >(() => {
    const savedPosition = localStorage.getItem("completedPosition");
    return (savedPosition as "top" | "bottom" | "mixed") || "mixed";
  });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewAnimation, setPreviewAnimation] = useState<{
    index: number;
    direction: "up" | "down";
  } | null>(null);
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<SectionItem | null>(
    null
  );
  const [sortOption, setSortOption] = useState<
    "custom" | "time" | "alphabetical"
  >("custom");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(
    null
  );
  const [focusedInput, setFocusedInput] = useState<"task" | "section" | null>(
    null
  );

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  // Initialize the next 7 days
  useEffect(() => {
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return {
        date,
        items: [],
      };
    });
    setDays(next7Days);
  }, []);

  // Load tasks and sections for each day
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [userTasks, userSections] = await Promise.all([
          taskService.getUserTasks(currentUser.uid),
          taskService.getUserSections(currentUser.uid),
        ]);

        // Check for tasks without dates and add them
        const tasksNeedingDates = userTasks.filter((task) => !task.date);
        if (tasksNeedingDates.length > 0) {
          console.log("Found tasks without dates:", tasksNeedingDates.length);
          const today = new Date();
          today.setHours(12, 0, 0, 0);

          // Update all tasks without dates to today
          await Promise.all(
            tasksNeedingDates.map((task) =>
              taskService.updateTask(task.id, {
                ...task,
                date: today.toISOString(),
              })
            )
          );

          // Reload tasks after update
          const updatedTasks = await taskService.getUserTasks(currentUser.uid);
          userTasks.splice(0, userTasks.length, ...updatedTasks);
        }

        // Convert tasks to the new format
        const tasksWithType = userTasks.map((task) => ({
          ...task,
          type: "task" as const,
        }));

        // Sort all items by order
        const allItems = [...tasksWithType, ...userSections].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        // Distribute items across days based on their date
        setDays((prevDays) => {
          const newDays = prevDays.map((day) => {
            const dayStart = new Date(day.date);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(day.date);
            dayEnd.setHours(23, 59, 59, 999);

            // Filter items for this day
            const dayItems = allItems.filter((item) => {
              if (isTask(item)) {
                const taskDate = new Date(item.date);
                return taskDate >= dayStart && taskDate <= dayEnd;
              }
              // For now, put sections in the first day
              return day === prevDays[0];
            });

            return {
              ...day,
              items: dayItems,
            };
          });
          return newDays;
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Handle click outside of sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isTask = (item: ListItem): item is Task => {
    return item.type === "task";
  };

  const isSection = (item: ListItem): item is SectionItem => {
    return item.type === "section";
  };

  const sortItems = (items: ListItem[]) => {
    return items
      .filter((item) => {
        if (!hideCompleted) return true;
        if (!isTask(item)) return true;
        return !item.completed;
      })
      .sort((a, b) => {
        // If both items have order, use that for custom sorting
        if (
          completedPosition === "mixed" &&
          a.order !== undefined &&
          b.order !== undefined
        ) {
          return a.order - b.order;
        }

        // For completed on top/bottom sorting
        const aIsCompleted = isTask(a) && a.completed;
        const bIsCompleted = isTask(b) && b.completed;

        if (completedPosition === "top") {
          if (aIsCompleted && !bIsCompleted) return -1;
          if (!aIsCompleted && bIsCompleted) return 1;
        } else if (completedPosition === "bottom") {
          if (aIsCompleted && !bIsCompleted) return 1;
          if (!aIsCompleted && bIsCompleted) return -1;
        }

        // If both items are in the same completion state, maintain their relative order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
  };

  // Update the useEffect to load saved sort position
  useEffect(() => {
    const savedPosition = localStorage.getItem("completedPosition");
    if (savedPosition) {
      setCompletedPosition(savedPosition as "top" | "bottom" | "mixed");
    }
  }, []);

  const handleAddTask = async (dayIndex: number, title: string) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    if (!title.trim()) return;

    try {
      const taskDate = days[dayIndex].date;
      // Set the time to noon to avoid timezone issues
      taskDate.setHours(12, 0, 0, 0);

      const newTask = await taskService.createTask(currentUser.uid, {
        type: "task",
        title: title.trim(),
        description: "",
        scheduledTime: taskDate.toLocaleString(),
        completed: false,
        date: taskDate.toISOString(),
      });

      // Update local state with the new task
      setDays((prevDays) =>
        prevDays.map((day, idx) =>
          idx === dayIndex
            ? {
                ...day,
                items: [{ ...newTask, type: "task" as const }, ...day.items],
              }
            : day
        )
      );
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleTaskInputChange = (
    dayIndex: number,
    field: "title" | "description",
    value: string
  ) => {
    setNewTaskInputs((prev) => ({
      ...prev,
      [dayIndex]: {
        ...(prev[dayIndex] || { title: "", description: "" }),
        [field]: value,
      },
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, dayIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask(dayIndex, newTaskInputs[dayIndex]?.title || "");
    } else if (e.key === "Escape") {
      setIsCreatingTask(false);
      setNewTaskInputs((prev) => ({
        ...prev,
        [dayIndex]: { title: "", description: "" },
      }));
    }
  };

  const handleTaskCompletion = async (
    taskId: string,
    completed: boolean,
    dayIndex: number,
    event: React.MouseEvent
  ) => {
    try {
      await taskService.toggleTaskCompletion(taskId, completed);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays[dayIndex].items = newDays[dayIndex].items.map((item) =>
          isTask(item) && item.id === taskId ? { ...item, completed } : item
        );
        return newDays;
      });

      // Add subtle confetti effect when completing a task
      if (completed) {
        const duration = 1.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 15,
          spread: 180,
          ticks: 30,
          zIndex: 0,
          particleCount: 20,
          colors: ["#4ade80", "#22c55e", "#16a34a"],
        };

        // Get click position relative to viewport
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 10 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: {
              x: x,
              y: y,
            },
          });
        }, 250);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const formatTimeFromInput = (input: string): string => {
    // Allow only numbers and specific symbols
    const cleaned = input.replace(/[^0-9.,:;-]/g, "");

    if (cleaned.length === 0) return "";

    // Split by any of the allowed separators
    const parts = cleaned.split(/[.,:;-]/);
    const numbers = parts.join("").replace(/\D/g, "");

    if (numbers.length === 0) return "";

    // Handle different input lengths
    if (numbers.length <= 2) {
      // Just hours
      const hours = parseInt(numbers);
      if (hours > 23) return "23:00";
      return `${hours.toString().padStart(2, "0")}:00`;
    } else if (numbers.length <= 4) {
      // Hours and minutes
      const hours = parseInt(numbers.slice(0, -2));
      const minutes = parseInt(numbers.slice(-2));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else {
      // Too many digits, take first 4
      const hours = parseInt(numbers.slice(0, 2));
      const minutes = parseInt(numbers.slice(2, 4));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    item: ListItem,
    dayIndex: number
  ) => {
    e.stopPropagation();
    console.log("=== Drag Start ===");
    console.log("Item:", { id: item.id, type: item.type, order: item.order });
    console.log("Source Day:", dayIndex);

    setIsDragging(true);
    setDragState({
      item,
      sourceIndex: dayIndex,
      currentIndex: dayIndex,
      position: "after",
      sourceDay: dayIndex,
      targetDay: dayIndex,
    });

    // Set drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = "0.8";
    dragImage.style.transform = "scale(1.02)";
    dragImage.style.boxShadow =
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    // Add a semi-transparent effect to the dragged item
    (e.target as HTMLElement).style.opacity = "0.4";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState) return;

    console.log("=== Drop ===");
    console.log("Target Day:", targetDayIndex);
    console.log("Current Drag State:", dragState);

    const { item, sourceDay } = dragState;

    // If we're dropping in the same day, ignore
    if (sourceDay === targetDayIndex) {
      console.log("Skipping drop - same day");
      setDragState(null);
      setIsDragging(false);
      return;
    }

    try {
      // Update the task's date
      if (isTask(item)) {
        const newDate = days[targetDayIndex].date.toISOString();

        // Create updated task object with new date
        const updatedTask = {
          ...item,
          date: newDate,
        };

        // Update the database first
        await taskService.updateTask(item.id, updatedTask);

        // Then update the local state
        setDays((prevDays) => {
          // Create a new array of days
          const newDays = prevDays.map((day, index) => {
            if (index === sourceDay) {
              // Remove from source day
              return {
                ...day,
                items: day.items.filter((i) => i.id !== item.id),
              };
            }
            if (index === targetDayIndex) {
              // Add to target day with updated date
              return {
                ...day,
                items: [...day.items, updatedTask],
              };
            }
            return day;
          });
          return newDays;
        });
      }
    } catch (error) {
      console.error("Error moving task:", error);
    } finally {
      setDragState(null);
      setIsDragging(false);
    }
  };

  const handleEditTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.map((item) =>
            isTask(item) && item.id === taskId ? { ...item, ...updates } : item
          );
        });
        return newDays;
      });
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleEditSection = async (
    sectionId: string,
    updates: Partial<SectionItem>
  ) => {
    try {
      await taskService.updateSection(sectionId, updates);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.map((item) =>
            isSection(item) && item.id === sectionId
              ? { ...item, ...updates }
              : item
          );
        });
        return newDays;
      });
      setEditingSection(null);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.filter(
            (item) => !isTask(item) || item.id !== taskId
          );
        });
        return newDays;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await taskService.deleteSection(sectionId);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.filter(
            (item) => !isSection(item) || item.id !== sectionId
          );
        });
        return newDays;
      });
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const TaskEditModal = ({
    task,
    onClose,
  }: {
    task: Task;
    onClose: () => void;
  }) => {
    const [editedTask, setEditedTask] = useState(task);

    const handleSave = async () => {
      await handleEditTask(task.id, editedTask);
      onClose();
    };

    const handleDelete = async () => {
      await handleDeleteTask(task.id);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-neu-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-neu-100 mb-4">Edit Task</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-neu-400 text-sm mb-1">Title</label>
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className="w-full bg-neu-700 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-neu-400 text-sm mb-1">
                Description
              </label>
              <input
                type="text"
                value={editedTask.description || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, description: e.target.value })
                }
                className="w-full bg-neu-700 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                placeholder="Add a description..."
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-neu-400 hover:text-neu-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SectionEditModal = ({
    section,
    onClose,
  }: {
    section: SectionItem;
    onClose: () => void;
  }) => {
    const [editedSection, setEditedSection] = useState(section);

    const handleSave = async () => {
      await handleEditSection(section.id, editedSection);
      onClose();
    };

    const handleDelete = async () => {
      await handleDeleteSection(section.id);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-neu-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-neu-100 mb-4">
            Edit Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-neu-400 text-sm mb-1">Title</label>
              <input
                type="text"
                value={editedSection.text}
                onChange={(e) =>
                  setEditedSection({ ...editedSection, text: e.target.value })
                }
                className="w-full bg-neu-700 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-neu-400 text-sm mb-1">Time</label>
              <input
                type="text"
                value={editedSection.time}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
                  setEditedSection({ ...editedSection, time: cleaned });
                }}
                className="w-full bg-neu-700 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                placeholder="Enter time (e.g. 14:30)"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-neu-400 hover:text-neu-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTask = (item: Task, dayIndex: number) => {
    return (
      <div
        key={item.id}
        data-task-id={item.id}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedTask(item);
          }
        }}
        className={`task-item p-3 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
          item.completed
            ? "bg-sup-suc-400 bg-opacity-50"
            : isTask(item) && item.backgroundColor
            ? item.backgroundColor
            : "bg-neu-800"
        } focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
        onClick={() => setSelectedTask(item)}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskCompletion(item.id, !item.completed, dayIndex, e);
              }}
              className={`transition-all duration-300 flex items-center justify-center ${
                item.completed
                  ? "text-neu-100 hover:text-neu-100 scale-95"
                  : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-full p-1`}
              aria-label={`Mark task "${item.title}" as ${
                item.completed ? "incomplete" : "complete"
              }`}
            >
              {item.completed ? (
                <CheckSquare size={24} color="currentColor" autoSize={false} />
              ) : (
                <Record size={24} color="currentColor" autoSize={false} />
              )}
            </button>
          </div>
          <div className="flex-1">
            <h3
              className={`text-sm font-outfit font-semibold transition-all duration-300 ${
                item.completed ? "text-neu-100 scale-95" : "text-neu-100"
              }`}
            >
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-neu-400 mt-1">{item.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTask(item);
              }}
              className={`p-1.5 flex items-center justify-center ${
                item.completed
                  ? "text-neu-100 hover:text-neu-100"
                  : "text-neu-400 hover:text-neu-100"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
              aria-label={`Edit task "${item.title}"`}
            >
              <Pen size={20} color="currentColor" autoSize={false} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(item.id);
              }}
              className={`p-1.5 flex items-center justify-center ${
                item.completed
                  ? "text-neu-100 hover:text-neu-100"
                  : "text-neu-400 hover:text-red-500"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
              aria-label={`Delete task "${item.title}"`}
            >
              <TrashBinTrash size={20} color="currentColor" autoSize={false} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (item: SectionItem) => (
    <div
      className="p-3 bg-neu-900 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
      tabIndex={0}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between cursor-pointer">
          <div>
            <h3 className="text-sm font-outfit font-semibold text-neu-300">
              {item.text}
            </h3>
            <p className="text-xs text-neu-400">{item.time}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setSelectedSection(item);
            setIsSectionModalOpen(true);
          }}
          className="p-1.5 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Edit section "${item.text}"`}
        >
          <Pen size={20} color="currentColor" autoSize={false} />
        </button>
        <button
          onClick={() => handleDeleteSection(item.id)}
          className="p-1.5 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Delete section "${item.text}"`}
        >
          <TrashBinTrash size={20} color="currentColor" autoSize={false} />
        </button>
      </div>
    </div>
  );

  const TaskCreationInput = ({ dayIndex }: { dayIndex: number }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localInput, setLocalInput] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalInput(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (localInput.trim()) {
          handleAddTask(dayIndex, localInput);
          setLocalInput("");
        }
      } else if (e.key === "Escape") {
        setLocalInput("");
      }
    };

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 bg-neu-900/50 rounded-md p-2">
          <button
            onClick={() => {
              if (localInput.trim()) {
                handleAddTask(dayIndex, localInput);
                setLocalInput("");
              }
            }}
            className="p-1 bg-pri-blue-500 rounded-sm hover:bg-pri-blue-600 transition-colors flex items-center justify-center"
          >
            <AddSquare
              size={20}
              color="#fff"
              autoSize={false}
              iconStyle="Broken"
            />
          </button>
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={localInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Add new task..."
              className="w-full bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-semibold focus:outline-none"
            />
            <p className="text-xs font-outfit text-neu-400 mt-0.5">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    );
  };

  const SectionCreationInput = ({ dayIndex }: { dayIndex: number }) => {
    const titleInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);
    const [localTitle, setLocalTitle] = useState("");
    const [localTime, setLocalTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    console.log("SectionCreationInput rendered:", {
      dayIndex,
      localTitle,
      localTime,
      isSubmitting,
    });

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("Title input changed:", e.target.value);
      setLocalTitle(e.target.value);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
      console.log("Time input changed:", { original: e.target.value, cleaned });
      setLocalTime(cleaned);
    };

    const handleAddSection = async () => {
      console.log("handleAddSection called:", {
        isSubmitting,
        localTitle,
        localTime,
      });

      if (isSubmitting) {
        console.log("Already submitting, returning early");
        return;
      }

      if (!currentUser) {
        console.error("No user logged in");
        return;
      }

      const title = localTitle.trim();
      const time = formatTimeFromInput(localTime.trim());

      console.log("Processed inputs:", { title, time });

      if (!title || !time) {
        console.error("Missing required fields:", { title, time });
        return;
      }

      try {
        console.log("Creating section...");
        setIsSubmitting(true);
        const newSection = await taskService.createSection(currentUser.uid, {
          text: title,
          time: time,
        });

        console.log("Section created successfully:", newSection);

        // Use a single state update with a callback to ensure we're working with the latest state
        setDays((prevDays) => {
          console.log("Updating days state:", {
            prevDaysLength: prevDays.length,
            dayIndex,
            newSection,
          });

          // Create a new array to avoid mutating the previous state
          const newDays = prevDays.map((day, idx) => {
            if (idx === dayIndex) {
              // Check if the section already exists in the items array
              const sectionExists = day.items.some(
                (item) => item.type === "section" && item.id === newSection.id
              );

              if (!sectionExists) {
                return {
                  ...day,
                  items: [newSection, ...day.items],
                };
              }
            }
            return day;
          });

          return newDays;
        });

        // Clear inputs after successful creation
        setLocalTitle("");
        setLocalTime("");
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      } catch (error) {
        console.error("Error creating section:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      console.log("Key pressed:", e.key);
      if (e.key === "Enter") {
        e.preventDefault();
        console.log("Enter pressed, calling handleAddSection");
        handleAddSection();
      } else if (e.key === "Escape") {
        console.log("Escape pressed, clearing inputs");
        setLocalTitle("");
        setLocalTime("");
      }
    };

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 bg-neu-900/50 rounded-md p-2">
          <button
            onClick={() => {
              console.log("Add button clicked");
              handleAddSection();
            }}
            disabled={isSubmitting}
            className="p-1 bg-sup-war-500 rounded-sm hover:bg-sup-war-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AddSquare
              size={20}
              color="#fff"
              autoSize={false}
              iconStyle="Broken"
            />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <input
                ref={titleInputRef}
                type="text"
                value={localTitle}
                onChange={handleTitleChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a section..."
                className="w-[calc(100%-5rem)] bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-semibold focus:outline-none"
              />
              <input
                ref={timeInputRef}
                type="text"
                value={localTime}
                onChange={handleTimeChange}
                onKeyDown={handleKeyDown}
                placeholder="Time"
                className="w-20 bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-semibold focus:outline-none"
              />
            </div>
            <p className="text-xs font-outfit text-neu-400 mt-0.5">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Add handleClearCompleted function
  const handleClearCompleted = async () => {
    if (!currentUser) return;

    try {
      // Get all completed tasks
      const completedTasks = days.flatMap((day) =>
        day.items.filter((item) => isTask(item) && item.completed)
      );

      // Delete each completed task
      await Promise.all(
        completedTasks.map((task) => taskService.deleteTask(task.id))
      );

      // Update local state
      setDays((prevDays) =>
        prevDays.map((day) => ({
          ...day,
          items: day.items.filter((item) => !isTask(item) || !item.completed),
        }))
      );
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
    }
  };

  // Add handleHideCompleted function
  const handleHideCompleted = () => {
    const newState = !hideCompleted;
    setHideCompleted(newState);
    localStorage.setItem("hideCompleted", JSON.stringify(newState));
  };

  return (
    <div className="p-4">
      <style>
        {`
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
          }

          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #374151;
            transition: .3s;
            border-radius: 24px;
          }

          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
          }

          input:checked + .toggle-slider {
            background-color: #22c55e;
          }

          input:checked + .toggle-slider:before {
            transform: translateX(20px);
          }
        `}
      </style>
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between mb-8 pl-8">
          <h1 className="text-4xl font-bold font-outfit text-neu-100">
            Next 7 Days
          </h1>
          <div className="bg-neu-600 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
                >
                  <Sort
                    size={20}
                    color="currentColor"
                    autoSize={false}
                    iconStyle="Broken"
                  />
                  <span className="text-base font-outfit">Sort</span>
                </button>
                {isSortMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neu-800 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCompletedPosition("top");
                          localStorage.setItem("completedPosition", "top");
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "top"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <AlignTop
                          size={20}
                          color="currentColor"
                          autoSize={false}
                          iconStyle="Broken"
                        />
                        <span>Completed on Top</span>
                      </button>
                      <button
                        onClick={() => {
                          setCompletedPosition("bottom");
                          localStorage.setItem("completedPosition", "bottom");
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "bottom"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <AlignBottom
                          size={20}
                          color="currentColor"
                          autoSize={false}
                          iconStyle="Broken"
                        />
                        <span>Completed on Bottom</span>
                      </button>
                      <button
                        onClick={() => {
                          setCompletedPosition("mixed");
                          localStorage.setItem("completedPosition", "mixed");
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "mixed"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <AlignVerticalCenter
                          size={20}
                          color="currentColor"
                          autoSize={false}
                          iconStyle="Broken"
                        />
                        <span>Custom Order</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div
                    onClick={handleHideCompleted}
                    className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-within:ring-2 focus-within:ring-pri-blue-500 cursor-pointer"
                  >
                    {hideCompleted ? (
                      <Eye size={20} color="currentColor" />
                    ) : (
                      <EyeClosed size={20} color="currentColor" />
                    )}
                    <span className="text-base font-outfit">
                      Hide completed
                    </span>
                    <div className="toggle-switch ml-2">
                      <input
                        id="hide-completed-toggle"
                        type="checkbox"
                        checked={hideCompleted}
                        onChange={handleHideCompleted}
                        className="sr-only focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                        aria-label="Toggle hide completed tasks"
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClearCompleted}
                  className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
                >
                  <TrashBinTrash
                    size={20}
                    color="currentColor"
                    autoSize={false}
                  />
                  <span className="text-base font-outfit">Clear completed</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Days Container */}
        <div className="flex space-x-8 overflow-x-auto pb-4 pl-8">
          {days.map((day, dayIndex) => (
            <div
              key={day.date.toISOString()}
              className="flex-shrink-0 w-[280px] bg-neu-800/90 rounded-lg p-4 h-fit"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dayIndex)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-outfit font-semibold text-neu-100">
                    {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                  </h2>
                  <p className="text-base font-outfit text-neu-400">
                    {day.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Task creation */}
                <div className="mb-4">
                  <TaskCreationInput dayIndex={dayIndex} />
                </div>

                {/* Section creation */}
                <div className="mb-4">
                  <SectionCreationInput dayIndex={dayIndex} />
                </div>

                {/* Tasks and Sections */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-neu-400">Loading tasks...</div>
                  ) : day.items.length === 0 ? (
                    <div className="text-center text-neu-400 py-4">
                      <p className="text-sm">No tasks for this day</p>
                    </div>
                  ) : (
                    sortItems(day.items).map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, dayIndex)}
                        className={`group relative flex items-start space-x-4 p-3 rounded-lg transition-all duration-200 ${
                          isTask(item) && item.completed
                            ? "bg-sup-suc-400 bg-opacity-50"
                            : isTask(item)
                            ? "bg-neu-700/50 hover:bg-neu-600/50"
                            : ""
                        }`}
                      >
                        {isSection(item)
                          ? renderSection(item)
                          : renderTask(item, dayIndex)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && selectedTask && (
        <TaskEditModal
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
      {isSectionModalOpen && selectedSection && (
        <SectionEditModal
          section={selectedSection}
          onClose={() => {
            setIsSectionModalOpen(false);
            setSelectedSection(null);
          }}
        />
      )}
    </div>
  );
}
