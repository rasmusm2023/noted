import { useState, useEffect, useRef } from "react";
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
  const [newTimestampTime, setNewTimestampTime] = useState("");
  const [newTitleText, setNewTitleText] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [completedPosition, setCompletedPosition] = useState<
    "top" | "bottom" | "mixed"
  >("bottom");
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
          sortOption === "custom" &&
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

        // For time-based sorting
        if (sortOption === "time") {
          const aTime = isTask(a) ? a.scheduledTime : a.time;
          const bTime = isTask(b) ? b.scheduledTime : b.time;
          return aTime.localeCompare(bTime);
        }

        // For alphabetical sorting
        if (sortOption === "alphabetical") {
          const aTitle = isTask(a) ? a.title : a.text;
          const bTitle = isTask(b) ? b.title : b.text;
          return aTitle.localeCompare(bTitle);
        }

        // If both items are in the same completion state, maintain their relative order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
  };

  const handleAddTask = async (dayIndex: number) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    const dayInput = newTaskInputs[dayIndex] || { title: "", description: "" };
    if (!dayInput.title.trim()) return;

    try {
      const taskDate = days[dayIndex].date;
      // Set the time to noon to avoid timezone issues
      taskDate.setHours(12, 0, 0, 0);

      // Clear input immediately to prevent double submission
      setNewTaskInputs((prev) => ({
        ...prev,
        [dayIndex]: { title: "", description: "" },
      }));

      const newTask = await taskService.createTask(currentUser.uid, {
        type: "task",
        title: dayInput.title.trim(),
        description: dayInput.description.trim(),
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

  const handleAddSection = async (dayIndex: number) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    const title = newTitleText.trim();
    const time = formatTimeFromInput(newTimestampTime.trim());

    if (!title || !time) {
      console.error("Missing required fields:", { title, time });
      return;
    }

    try {
      const newSection = await taskService.createSection(currentUser.uid, {
        text: title,
        time: time,
      });

      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays[dayIndex].items = [newSection, ...newDays[dayIndex].items];
        return newDays;
      });

      setNewTitleText("");
      setNewTimestampTime("");
      if (sectionInputRef.current) {
        sectionInputRef.current.focus();
      }
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, dayIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask(dayIndex);
    } else if (e.key === "Escape") {
      setIsCreatingTask(false);
      setNewTaskInputs((prev) => ({
        ...prev,
        [dayIndex]: { title: "", description: "" },
      }));
    }
  };

  const handleSectionKeyPress = (e: React.KeyboardEvent, dayIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const formattedTime = formatTimeFromInput(newTimestampTime);
      setNewTimestampTime(formattedTime);
      handleAddSection(dayIndex);
    } else if (e.key === "Escape") {
      setIsCreatingTimestamp(false);
      setNewTitleText("");
      setNewTimestampTime("");
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

  const handleDragStart = (
    e: React.DragEvent,
    item: ListItem,
    dayIndex: number
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ item, sourceDayIndex: dayIndex })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;

    try {
      const { item, sourceDayIndex } = JSON.parse(data);
      if (sourceDayIndex === targetDayIndex) return;

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
            if (index === sourceDayIndex) {
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

  return (
    <div className="p-4">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-neu-100">Next 7 Days</h1>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="px-4 py-2 bg-neu-800 text-neu-100 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-neu-100"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                <span>Sort</span>
              </button>
              {isSortMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neu-800 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setCompletedPosition("top");
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        completedPosition === "top"
                          ? "text-pri-blue-500"
                          : "text-neu-100 hover:bg-neu-700"
                      }`}
                    >
                      Completed on Top
                    </button>
                    <button
                      onClick={() => {
                        setCompletedPosition("bottom");
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        completedPosition === "bottom"
                          ? "text-pri-blue-500"
                          : "text-neu-100 hover:bg-neu-700"
                      }`}
                    >
                      Completed on Bottom
                    </button>
                    <button
                      onClick={() => {
                        setCompletedPosition("mixed");
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        completedPosition === "mixed"
                          ? "text-pri-blue-500"
                          : "text-neu-100 hover:bg-neu-700"
                      }`}
                    >
                      Custom Order
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="px-4 py-2 bg-neu-800 text-neu-100 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2">
                    {hideCompleted ? (
                      <Eye size={20} color="currentColor" />
                    ) : (
                      <EyeClosed size={20} color="currentColor" />
                    )}
                    <span>Hide completed</span>
                    <div className="toggle-switch ml-2">
                      <input
                        type="checkbox"
                        checked={hideCompleted}
                        onChange={() => setHideCompleted(!hideCompleted)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Days Container */}
        <div className="flex space-x-8 overflow-x-auto pb-4 pl-8">
          {days.map((day, dayIndex) => (
            <div
              key={day.date.toISOString()}
              className="flex-shrink-0 w-[280px] bg-neu-800/90 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dayIndex)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-neu-100">
                    {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                  </h2>
                  <p className="text-neu-400">
                    {day.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Task creation */}
                <div className="mb-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2 bg-neu-900/50 rounded-lg p-2">
                      <button
                        onClick={() => handleAddTask(dayIndex)}
                        className="p-1 bg-pri-blue-500 rounded-md hover:bg-pri-blue-600 transition-colors"
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
                          ref={taskInputRef}
                          type="text"
                          value={newTaskInputs[dayIndex]?.title || ""}
                          onChange={(e) =>
                            handleTaskInputChange(
                              dayIndex,
                              "title",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTask(dayIndex);
                            } else if (e.key === "Escape") {
                              setNewTaskInputs((prev) => ({
                                ...prev,
                                [dayIndex]: { title: "", description: "" },
                              }));
                            }
                          }}
                          placeholder="Add new task..."
                          className="w-full bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 focus:outline-none"
                        />
                        <p className="text-xs font-outfit text-neu-400 mt-0.5">
                          Press Enter to add
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section creation */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newTitleText}
                      onChange={(e) => setNewTitleText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSection(dayIndex);
                        } else if (e.key === "Escape") {
                          setIsCreatingTimestamp(false);
                          setNewTitleText("");
                          setNewTimestampTime("");
                        }
                      }}
                      placeholder="Add a section..."
                      className="flex-1 bg-neu-900/50 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                    />
                    <input
                      type="text"
                      value={newTimestampTime}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(
                          /[^0-9.,:;-]/g,
                          ""
                        );
                        setNewTimestampTime(cleaned);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSection(dayIndex);
                        } else if (e.key === "Escape") {
                          setIsCreatingTimestamp(false);
                          setNewTitleText("");
                          setNewTimestampTime("");
                        }
                      }}
                      placeholder="Time"
                      className="w-24 bg-neu-900/50 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                    />
                    <button
                      onClick={() => handleAddSection(dayIndex)}
                      className="p-2 text-neu-400 hover:text-neu-100 transition-colors"
                    >
                      <AddSquare
                        size={24}
                        color="currentColor"
                        autoSize={false}
                        iconStyle="Broken"
                      />
                    </button>
                  </div>
                </div>

                {/* Tasks and Sections */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-neu-400">Loading tasks...</div>
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
                        {isSection(item) ? (
                          <div className="flex-1">
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => {
                                setSelectedSection(item);
                                setIsSectionModalOpen(true);
                              }}
                            >
                              <div>
                                <h3 className="text-base font-semibold text-neu-100">
                                  {item.text}
                                </h3>
                                <p className="text-xs text-neu-400">
                                  {item.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4 flex-1">
                            <button
                              onClick={(e) =>
                                handleTaskCompletion(
                                  item.id,
                                  !item.completed,
                                  dayIndex,
                                  e
                                )
                              }
                              className={`transition-all duration-300 flex items-center justify-center ${
                                item.completed
                                  ? "text-neu-100 hover:text-neu-100 scale-95"
                                  : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
                              }`}
                            >
                              {item.completed ? (
                                <CheckCircle
                                  size={24}
                                  color="currentColor"
                                  autoSize={false}
                                />
                              ) : (
                                <Record
                                  size={24}
                                  color="currentColor"
                                  autoSize={false}
                                  className="hover:scale-95 transition-transform animate-bounce-subtle"
                                />
                              )}
                            </button>
                            <div className="flex-1">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onMouseUp={() => {
                                  setSelectedTask(item);
                                  setIsModalOpen(true);
                                }}
                              >
                                <div>
                                  <h3
                                    className={`text-base font-semibold ${
                                      item.completed
                                        ? "text-neu-100"
                                        : "text-neu-100"
                                    }`}
                                  >
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="text-xs text-neu-400">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
