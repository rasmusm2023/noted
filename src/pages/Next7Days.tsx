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
  AddCircle,
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
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

        // Convert tasks to the new format
        const tasksWithType = userTasks.map((task) => ({
          ...task,
          type: "task" as const,
        }));

        // Combine and sort all items
        const allItems = [...tasksWithType, ...userSections].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        // TODO: Distribute items across days based on their scheduled date
        // For now, just put all items in the first day
        setDays((prevDays) => {
          const newDays = [...prevDays];
          newDays[0].items = allItems;
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

    if (!newTaskTitle.trim()) return;

    try {
      const newTask = await taskService.createTask(currentUser.uid, {
        type: "task",
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        scheduledTime: new Date().toLocaleString(),
        completed: false,
        date: days[dayIndex].date.toISOString(),
      });

      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays[dayIndex].items = [newTask, ...newDays[dayIndex].items];
        return newDays;
      });
      setNewTaskTitle("");
      setNewTaskDescription("");
      // Keep focus on the input field
      if (taskInputRef.current) {
        taskInputRef.current.focus();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
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
      setNewTaskTitle("");
      setNewTaskDescription("");
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
        await taskService.updateTask(item.id, { ...item, date: newDate });

        // Update local state
        setDays((prevDays) => {
          const newDays = [...prevDays];
          // Remove from source day
          newDays[sourceDayIndex].items = newDays[sourceDayIndex].items.filter(
            (i) => i.id !== item.id
          );
          // Add to target day
          newDays[targetDayIndex].items = [
            ...newDays[targetDayIndex].items,
            item,
          ];
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
                  <div className="flex items-center space-x-2">
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTask(dayIndex);
                        } else if (e.key === "Escape") {
                          setIsCreatingTask(false);
                          setNewTaskTitle("");
                          setNewTaskDescription("");
                        }
                      }}
                      placeholder="Add a task..."
                      className="flex-1 bg-neu-900/50 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                    />
                    <button
                      onClick={() => handleAddTask(dayIndex)}
                      className="p-2 text-neu-400 hover:text-neu-100 transition-colors"
                    >
                      <AddCircle
                        size={24}
                        color="currentColor"
                        autoSize={false}
                      />
                    </button>
                  </div>
                  {isCreatingTask && (
                    <input
                      type="text"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="mt-2 w-full bg-neu-900/50 text-neu-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                    />
                  )}
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
                      <AddCircle
                        size={24}
                        color="currentColor"
                        autoSize={false}
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
                            ? "bg-neu-900/50"
                            : "bg-neu-800/50 hover:bg-neu-700/50"
                        }`}
                      >
                        {isSection(item) ? (
                          <div className="flex-1">
                            {editingSection?.id === item.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editingSection.text}
                                  onChange={(e) =>
                                    setEditingSection({
                                      ...editingSection,
                                      text: e.target.value,
                                    })
                                  }
                                  className="flex-1 bg-neu-800 text-neu-100 rounded px-2 py-1"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  value={editingSection.time}
                                  onChange={(e) =>
                                    setEditingSection({
                                      ...editingSection,
                                      time: e.target.value,
                                    })
                                  }
                                  className="w-24 bg-neu-800 text-neu-100 rounded px-2 py-1"
                                  placeholder="Time"
                                />
                                <button
                                  onClick={() =>
                                    handleEditSection(item.id, editingSection)
                                  }
                                  className="p-1 text-neu-400 hover:text-neu-100 transition-colors"
                                >
                                  <CheckCircle
                                    size={20}
                                    color="currentColor"
                                    autoSize={false}
                                  />
                                </button>
                                <button
                                  onClick={() => setEditingSection(null)}
                                  className="p-1 text-neu-400 hover:text-red-500 transition-colors"
                                >
                                  <TrashBinTrash
                                    size={20}
                                    color="currentColor"
                                    autoSize={false}
                                  />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-base font-semibold text-neu-100">
                                    {item.text}
                                  </h3>
                                  <p className="text-xs text-neu-400">
                                    {item.time}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingSection(item)}
                                    className="p-1.5 text-neu-400 hover:text-neu-100 transition-colors"
                                  >
                                    <Pen
                                      size={16}
                                      color="currentColor"
                                      autoSize={false}
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSection(item.id)}
                                    className="p-1.5 text-neu-400 hover:text-red-500 transition-colors"
                                  >
                                    <TrashBinTrash
                                      size={16}
                                      color="currentColor"
                                      autoSize={false}
                                    />
                                  </button>
                                </div>
                              </div>
                            )}
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
                              {editingTask?.id === item.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) =>
                                      setEditingTask({
                                        ...editingTask,
                                        title: e.target.value,
                                      })
                                    }
                                    className="flex-1 bg-neu-800 text-base text-neu-100 rounded px-2 py-1"
                                    autoFocus
                                  />
                                  <input
                                    type="text"
                                    value={editingTask.description}
                                    onChange={(e) =>
                                      setEditingTask({
                                        ...editingTask,
                                        description: e.target.value,
                                      })
                                    }
                                    className="flex-1 bg-neu-800 text-base text-neu-100 rounded px-2 py-1"
                                    placeholder="Description"
                                  />
                                  <button
                                    onClick={() =>
                                      handleEditTask(item.id, editingTask)
                                    }
                                    className="p-1.5 text-neu-400 hover:text-neu-100 transition-colors"
                                  >
                                    <CheckCircle
                                      size={16}
                                      color="currentColor"
                                      autoSize={false}
                                    />
                                  </button>
                                  <button
                                    onClick={() => setEditingTask(null)}
                                    className="p-1.5 text-neu-400 hover:text-red-500 transition-colors"
                                  >
                                    <TrashBinTrash
                                      size={16}
                                      color="currentColor"
                                      autoSize={false}
                                    />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3
                                      className={`text-base font-semibold ${
                                        item.completed
                                          ? "text-neu-400 line-through"
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
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => setEditingTask(item)}
                                      className="p-1.5 text-neu-400 hover:text-neu-100 transition-colors"
                                    >
                                      <Pen
                                        size={16}
                                        color="currentColor"
                                        autoSize={false}
                                      />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(item.id)}
                                      className="p-1.5 text-neu-400 hover:text-red-500 transition-colors"
                                    >
                                      <TrashBinTrash
                                        size={16}
                                        color="currentColor"
                                        autoSize={false}
                                      />
                                    </button>
                                  </div>
                                </div>
                              )}
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
    </div>
  );
}
