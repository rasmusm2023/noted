import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, SectionItem as SectionItemType } from "../types/task";
import type { BatchOperation } from "../services/taskService";
import { Icon } from "@iconify/react";
import confetti from "canvas-confetti";
import { TaskModal } from "../components/TaskModal/TaskModal";
import { SectionModal } from "../components/SectionModal/SectionModal";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { StatsModal } from "../components/Next7Days/StatsModal";
import { TaskManagementHeader } from "../components/Next7Days/TaskManagementHeader";
import { DayColumn } from "../components/Next7Days/DayColumn";
import { TaskItem } from "../components/Next7Days/TaskItem";
import { SectionItem } from "../components/Next7Days/SectionItem";

type ListItem = Task | SectionItemType;

type DayData = {
  id: string;
  date: Date;
  items: ListItem[];
};

type DragState = {
  item: ListItem;
  sourceIndex: number;
  currentIndex: number;
  position: "before" | "after";
  isDraggingOverCompleted?: boolean;
  originalOrder: number;
};

type DragItem = {
  id: string;
  type: string;
  index: number;
  dayIndex: number;
  item: ListItem;
};

// Add debounce utility at the top of the file
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add cache types
type Cache<T> = {
  data: Map<string, T>;
  lastUpdated: number;
};

// Add offline queue type
type QueuedOperation = {
  type: "task" | "section";
  operation: "create" | "update" | "delete";
  data: any;
  timestamp: number;
};

// Add stats types
type FirestoreStats = {
  uptime: string;
  totalOperations: number;
  dailyStats: {
    reads: number;
    writes: number;
    lastReset: number;
  };
  operationsByType: Record<string, number>;
  operationsByCollection: Record<string, number>;
};

export function Next7Days() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<SectionItemType | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTimestamp, setIsCreatingTimestamp] = useState(false);
  const [newTaskInputs, setNewTaskInputs] = useState<{
    [key: number]: { title: string; description: string };
  }>({});
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [completedPosition, setCompletedPosition] = useState<
    "top" | "bottom" | "mixed"
  >(() => {
    const savedPosition = localStorage.getItem("completedPosition");
    return (savedPosition as "top" | "bottom" | "mixed") || "mixed";
  });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<SectionItemType | null>(
    null
  );
  const [sortOption, setSortOption] = useState<
    "custom" | "time" | "alphabetical"
  >("custom");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"task" | "section" | null>(
    null
  );
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  // Add caches
  const [taskCache, setTaskCache] = useState<Cache<Task>>({
    data: new Map(),
    lastUpdated: 0,
  });
  const [sectionCache, setSectionCache] = useState<Cache<SectionItemType>>({
    data: new Map(),
    lastUpdated: 0,
  });

  // Add offline queue
  const [offlineQueue, setOfflineQueue] = useState<QueuedOperation[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Add this near the top with other state declarations
  const hasLoadedData = useRef(false);

  // Add online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [isOnline, offlineQueue]);

  // Add cache management functions
  const updateTaskCache = (task: Task) => {
    setTaskCache((prev) => ({
      data: new Map(prev.data).set(task.id, task),
      lastUpdated: Date.now(),
    }));
  };

  const updateSectionCache = (section: SectionItemType) => {
    setSectionCache((prev) => ({
      data: new Map(prev.data).set(section.id, section),
      lastUpdated: Date.now(),
    }));
  };

  const getFromCache = (id: string, type: "task" | "section") => {
    if (type === "task") {
      return taskCache.data.get(id);
    }
    return sectionCache.data.get(id);
  };

  // Add offline queue processing
  const processOfflineQueue = async () => {
    if (!currentUser) return;

    const queue = [...offlineQueue];
    setOfflineQueue([]);

    for (const operation of queue) {
      try {
        if (operation.type === "task") {
          switch (operation.operation) {
            case "create":
              await taskService.createTask(currentUser.uid, operation.data);
              break;
            case "update":
              await taskService.updateTask(operation.data.id, operation.data);
              break;
            case "delete":
              await taskService.deleteTask(operation.data.id);
              break;
          }
        } else {
          switch (operation.operation) {
            case "create":
              await taskService.createSection(currentUser.uid, operation.data);
              break;
            case "update":
              await taskService.updateSection(
                operation.data.id,
                operation.data
              );
              break;
            case "delete":
              await taskService.deleteSection(operation.data.id);
              break;
          }
        }
      } catch (error) {
        console.error("Error processing offline operation:", error);
        // Add failed operation back to queue
        setOfflineQueue((prev) => [...prev, operation]);
      }
    }
  };

  // Add queue operation function
  const queueOperation = (operation: QueuedOperation) => {
    setOfflineQueue((prev) => [...prev, operation]);
  };

  // Initialize the next 7 days
  useEffect(() => {
    const today = new Date();
    // Set time to midnight in local timezone
    today.setHours(0, 0, 0, 0);

    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return {
        id: `day_${date.toISOString().split("T")[0]}`,
        date,
        items: [],
      };
    });
    setDays(next7Days);
  }, []);

  // Define processData outside useEffect so it can be reused
  const processData = async () => {
    if (!currentUser || days.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const tasks = await taskService.getUserTasks(currentUser.uid);
      const sections = await taskService.getUserSections(currentUser.uid);

      // Group tasks by day
      const tasksByDay = tasks.reduce(
        (acc: Record<number, Task[]>, task: Task) => {
          // Parse the date from the task's scheduledTime field
          const taskDate = parseDateString(task.scheduledTime);
          // Reset time part for comparison in local timezone
          taskDate.setHours(0, 0, 0, 0);

          const dayIndex = days.findIndex((day) => {
            const dayDate = new Date(day.date);
            // Reset time part for comparison in local timezone
            dayDate.setHours(0, 0, 0, 0);

            const taskDateStr = taskDate.toISOString().split("T")[0];
            const dayDateStr = dayDate.toISOString().split("T")[0];

            return taskDateStr === dayDateStr;
          });

          if (dayIndex !== -1) {
            if (!acc[dayIndex]) {
              acc[dayIndex] = [];
            }
            // Ensure task has all required properties
            const taskWithType: Task = {
              ...task,
              type: "task" as const,
              description: task.description || "",
              scheduledTime: task.scheduledTime,
              completed: task.completed || false,
              date: task.scheduledTime, // Use scheduledTime as the date
              userId: task.userId,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              order: task.order || 0,
            };
            acc[dayIndex].push(taskWithType);
          }
          return acc;
        },
        {}
      );

      // Distribute sections across days based on their date
      const sectionsByDay: Record<number, SectionItemType[]> = {};

      sections.forEach((section) => {
        // Parse the date from the section's scheduledTime field
        const sectionDate = parseDateString(
          section.scheduledTime || section.createdAt
        );
        // Reset time part for comparison in local timezone
        sectionDate.setHours(0, 0, 0, 0);

        // Find the corresponding day index
        const dayIndex = days.findIndex((day) => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);

          const sectionDateStr = sectionDate.toISOString().split("T")[0];
          const dayDateStr = dayDate.toISOString().split("T")[0];

          return sectionDateStr === dayDateStr;
        });

        if (dayIndex !== -1) {
          if (!sectionsByDay[dayIndex]) {
            sectionsByDay[dayIndex] = [];
          }

          // Ensure section has all required properties
          const sectionWithType: SectionItemType = {
            ...section,
            type: "section" as const,
            userId: section.userId,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
            order: section.order || 0,
            scheduledTime: section.scheduledTime || section.createdAt, // Ensure scheduledTime is set
          };

          sectionsByDay[dayIndex].push(sectionWithType);
        }
      });

      // Update days with tasks and sections
      setDays((prevDays) => {
        const newDays = prevDays.map((day, index) => {
          const updatedDay = {
            ...day,
            items: [
              ...(sectionsByDay[index] || []),
              ...(tasksByDay[index] || []),
            ],
          };
          return updatedDay;
        });
        return newDays;
      });

      hasLoadedData.current = true;
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process tasks and sections after days are initialized
  useEffect(() => {
    if (!currentUser || days.length === 0 || hasLoadedData.current) {
      setIsLoading(false);
      return;
    }
    processData();
  }, [currentUser, days.length]); // Add days.length to dependencies to ensure we process when days are initialized

  // Add a function to reload data
  const reloadData = () => {
    hasLoadedData.current = false;
    processData();
  };

  // Helper function to parse date strings
  const parseDateString = (dateStr: string): Date => {
    // If it's an ISO string or YYYY-MM-DD format, parse it directly
    if (dateStr.includes("T") || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }

    // Handle format "DD/MM/YYYY, HH:mm:ss" or "YYYY-MM-DD, HH:mm:ss"
    const [datePart, timePart] = dateStr.split(", ");
    if (!datePart || !timePart) {
      console.warn("Invalid date format:", dateStr);
      return new Date(); // Return current date as fallback
    }

    // Check if datePart is in YYYY-MM-DD format
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split("-");
      const [hours, minutes] = timePart.split(":");

      // Create date in local timezone
      const date = new Date();
      date.setFullYear(parseInt(year));
      date.setMonth(parseInt(month) - 1); // Months are 0-based
      date.setDate(parseInt(day));
      date.setHours(parseInt(hours));
      date.setMinutes(parseInt(minutes));
      date.setSeconds(0);
      date.setMilliseconds(0);

      return date;
    }

    // Handle DD/MM/YYYY format
    const [day, month, year] = datePart.split("/");
    const [hours, minutes] = timePart.split(":");

    // Create date in local timezone
    const date = new Date();
    date.setFullYear(parseInt(year));
    date.setMonth(parseInt(month) - 1); // Months are 0-based
    date.setDate(parseInt(day));
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  };

  const isTask = (item: ListItem): item is Task => {
    return item.type === "task";
  };

  const isSection = (item: ListItem): item is SectionItemType => {
    return item.type === "section";
  };

  const sortItems = (items: ListItem[]) => {
    return items.sort((a, b) => {
      // If both items have order, use that for custom sorting
      if (a.order !== undefined && b.order !== undefined) {
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

  const handleAddTask = async (dayIndex: number, title: string) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    if (!title.trim()) {
      console.log("Empty title, skipping task creation");
      return;
    }

    try {
      const taskDate = days[dayIndex].date;
      taskDate.setHours(12, 0, 0, 0);

      const taskData: Omit<
        Task,
        "id" | "userId" | "createdAt" | "updatedAt" | "order"
      > = {
        type: "task" as const,
        title: title.trim(),
        description: "",
        scheduledTime: taskDate.toLocaleString(),
        completed: false,
        date: taskDate.toISOString(),
      };

      if (!isOnline) {
        // Queue the operation if offline
        queueOperation({
          type: "task",
          operation: "create",
          data: taskData,
          timestamp: Date.now(),
        });
        return;
      }

      const newTask = await taskService.createTask(currentUser.uid, taskData);
      updateTaskCache(newTask);

      // Update UI
      setDays((prevDays) => {
        const newDays = [...prevDays];
        const day = newDays[dayIndex];
        const updatedItems = day.items.map((item) => ({
          ...item,
          order: (item.order ?? 0) + 1,
        }));

        newDays[dayIndex] = {
          ...day,
          items: [{ ...newTask, type: "task" as const }, ...updatedItems],
        };

        return newDays;
      });

      setNewTaskInputs((prev) => ({
        ...prev,
        [dayIndex]: { title: "", description: "" },
      }));
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
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
      const title = newTaskInputs[dayIndex]?.title || "";
      handleAddTask(dayIndex, title);
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
      // Get the absolute position of the click relative to the viewport
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;

      // Play confetti immediately if completing the task
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
          origin: {
            x: x,
            y: y,
          },
        };

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 10 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
          });
        }, 250);

        // Add completing class after confetti starts
        const taskElement = event.currentTarget.closest(".task-item");
        if (taskElement) {
          taskElement.classList.add("task-completing");
        }
        // Wait for the completion animation to finish
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await taskService.toggleTaskCompletion(taskId, completed);
      setDays(
        days.map((day, index) =>
          index === dayIndex
            ? {
                ...day,
                items: day.items.map((item) =>
                  isTask(item) && item.id === taskId
                    ? { ...item, completed }
                    : item
                ),
              }
            : day
        )
      );
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
    updates: Partial<SectionItemType>
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

  const renderTask = (item: Task, dayIndex: number) => {
    // Find the first uncompleted task across all days
    const firstUncompletedTask = days.reduce<Task | null>((found, day) => {
      if (found) return found; // If we already found a task, keep it
      return (day.items.find((i) => isTask(i) && !i.completed) as Task) || null;
    }, null);

    // A task is highlighted if it's the first uncompleted task and highlightNextTask is enabled
    const isNextTask =
      highlightNextTask && firstUncompletedTask?.id === item.id;

    const handleTaskClick = (task: Task, e: React.MouseEvent) => {
      // Don't open modal if clicking on buttons, inputs, or if we're editing
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest("button") ||
          e.target.closest("input") ||
          editingTask?.id === task.id)
      ) {
        e.stopPropagation();
        return;
      }

      // Clear any existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
        // If we had a timeout, this is a double click
        setEditingTask(task);
        return;
      }

      // Set a new timeout
      const timeout = setTimeout(() => {
        setSelectedTask(task);
        setClickTimeout(null);
      }, 200); // 200ms delay to allow for double click

      setClickTimeout(timeout);
    };

    return (
      <TaskItem
        task={item}
        dayIndex={dayIndex}
        isNextTask={isNextTask}
        editingTask={editingTask}
        onTaskClick={handleTaskClick}
        onTaskCompletion={handleTaskCompletion}
        onTaskDelete={handleDeleteTask}
        onTaskEdit={handleEditTask}
        onEditingTaskChange={setEditingTask}
      />
    );
  };

  const renderSection = (item: SectionItemType) => (
    <SectionItem
      section={item}
      onSectionClick={setSelectedSection}
      onSectionDelete={handleDeleteSection}
    />
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // Add the globalStyles
  const globalStyles = `
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

    /* Add custom scrollbar styles */
    .days-container {
      scrollbar-width: thin;
      scrollbar-color: #4B5563 #1F2937;
    }

    .days-container::-webkit-scrollbar {
      height: 8px;
    }

    .days-container::-webkit-scrollbar-track {
      background: #1F2937;
    }

    .days-container::-webkit-scrollbar-thumb {
      background-color: #4B5563;
      border-radius: 4px;
    }

    .days-container::-webkit-scrollbar-thumb:hover {
      background-color: #6B7280;
    }

    @keyframes completeTask {
      0% {
        clip-path: inset(0 100% 0 0);
      }
      100% {
        clip-path: inset(0 0 0 0);
      }
    }

    .task-completing {
      position: relative;
      overflow: hidden;
    }

    .task-completing::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgb(74, 222, 128, 0.5); /* Using the exact same color as bg-sup-suc-400 */
      border-radius: 0.5rem;
      animation: completeTask 0.5s ease-out forwards;
      z-index: 0;
    }

    .task-completing > * {
      position: relative;
      z-index: 1;
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }

    .task-item {
      transition: all 0.3s ease-in-out;
    }

    .task-item.hiding {
      animation: slideOut 0.3s ease-in-out forwards;
    }
  `;

  // Add DraggableItem component
  const DraggableItem = ({
    item,
    index,
    moveItem,
    isTaskItem,
    renderTask,
    renderSection,
    isTask,
    dayIndex,
  }: {
    item: ListItem;
    index: number;
    moveItem: (
      dragIndex: number,
      hoverIndex: number,
      sourceDay: number,
      targetDay: number
    ) => void;
    isTaskItem: boolean;
    renderTask: (task: Task, dayIndex: number) => JSX.Element;
    renderSection: (section: SectionItemType) => JSX.Element;
    isTask: (item: ListItem) => item is Task;
    dayIndex: number;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: "ITEM",
      item: { id: item.id, type: item.type, index, dayIndex, item },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => true,
    });

    const [{ isOver, canDrop, dropPosition }, drop] = useDrop<
      DragItem,
      void,
      {
        isOver: boolean;
        canDrop: boolean;
        dropPosition: "before" | "after" | null;
      }
    >({
      accept: "ITEM",
      collect: (monitor: DropTargetMonitor) => {
        const isOver = monitor.isOver();
        const canDrop = monitor.canDrop();
        const clientOffset = monitor.getClientOffset();
        const hoverBoundingRect = ref.current?.getBoundingClientRect();

        let dropPosition: "before" | "after" | null = null;
        if (isOver && hoverBoundingRect && clientOffset) {
          const hoverMiddleY =
            (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
          const hoverClientY = clientOffset.y - hoverBoundingRect.top;
          // Make the top 40% of the item a "before" drop zone
          dropPosition = hoverClientY < hoverMiddleY * 0.8 ? "before" : "after";
        }

        return { isOver, canDrop, dropPosition };
      },
      canDrop: (draggedItem: DragItem) => {
        return !(
          draggedItem.id === item.id && draggedItem.dayIndex === dayIndex
        );
      },
      hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
        if (!ref.current) return;

        const dragIndex = draggedItem.index;
        const hoverIndex = index;
        const sourceDay = draggedItem.dayIndex;
        const targetDay = dayIndex;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex && sourceDay === targetDay) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

        // Make the drop zones more forgiving by using 40% of the item height
        const dropThreshold = hoverMiddleY * 0.8;

        // For same-day moves, only perform the move when the mouse has crossed the threshold
        if (sourceDay === targetDay) {
          // If we're moving an item down, only move when we've crossed the threshold
          if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
          // If we're moving an item up, only move when we've crossed the threshold
          if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;
        }

        // For cross-day moves, always allow the move
        moveItem(dragIndex, hoverIndex, sourceDay, targetDay);

        // Update the dragged item's index and day
        draggedItem.index = hoverIndex;
        draggedItem.dayIndex = targetDay;
      },
    });

    // Combine drag and drop refs
    drag(drop(ref));

    const opacity = isDragging ? 0.4 : 1;

    // Enhanced visual feedback for drop zones
    const getDropZoneStyles = () => {
      if (!isOver || !canDrop) return {};

      const baseStyle = {
        position: "relative" as const,
        transition: "all 0.2s ease-in-out",
      };

      if (dropPosition === "before") {
        return {
          ...baseStyle,
          borderTop: "2px solid theme(colors.pri-pur.500)",
          marginTop: "2px",
        };
      } else if (dropPosition === "after") {
        return {
          ...baseStyle,
          borderBottom: "2px solid theme(colors.pri-pur.500)",
          marginBottom: "2px",
        };
      }

      return baseStyle;
    };

    return (
      <div
        ref={ref}
        style={{
          opacity,
          ...getDropZoneStyles(),
        }}
        className={`transition-all duration-200 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${isOver && canDrop ? "bg-pri-pur-500/5" : ""}`}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        aria-dropeffect="move"
      >
        {item.type === "section"
          ? renderSection(item as SectionItemType)
          : isTaskItem
          ? renderTask(item as Task, dayIndex)
          : null}
      </div>
    );
  };

  // Update moveItem function
  const moveItem = async (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => {
    if (sourceDay === targetDay) {
      // Handle same-day reordering
      const newItems = [...days];
      const [movedItem] = newItems[sourceDay].items.splice(dragIndex, 1);
      newItems[sourceDay].items.splice(hoverIndex, 0, movedItem);
      setDays(newItems);
      return;
    }

    // Get the target date from the target day
    const targetDate = new Date(days[targetDay].date);
    // Set to noon for better visibility
    targetDate.setHours(12, 0, 0, 0);

    // Get the item being moved
    const movedItem = days[sourceDay].items[dragIndex];
    if (!movedItem) return;

    // Update the task's date
    if (isTask(movedItem)) {
      await taskService.updateTaskDate(movedItem.id, targetDate);
    }

    // Update the UI
    const newDays = [...days];
    const [removedItem] = newDays[sourceDay].items.splice(dragIndex, 1);
    newDays[targetDay].items.splice(hoverIndex, 0, removedItem);
    setDays(newDays);
  };

  const handleClearCompleted = async () => {
    // Get all completed tasks across all days
    const completedTasks = days.flatMap((day) =>
      day.items
        .filter((item) => isTask(item) && item.completed)
        .map((item) => item.id)
    );

    // Add hiding animation
    setHidingItems(new Set(completedTasks));

    // Wait for animation to complete before updating state
    setTimeout(async () => {
      try {
        if (currentUser) {
          // Delete completed tasks from Firestore
          await Promise.all(
            completedTasks.map((taskId) => taskService.deleteTask(taskId))
          );

          // Update local state by filtering out completed tasks
          setDays((prevDays) =>
            prevDays.map((day) => ({
              ...day,
              items: day.items.filter(
                (item) => !isTask(item) || !item.completed
              ),
            }))
          );
        }
      } catch (error) {
        console.error("Error clearing completed tasks:", error);
        // Revert the state if the update fails
        setDays(days);
      }

      // Clear hiding items after animation
      setHidingItems(new Set());
    }, 300); // Match the animation duration
  };

  useEffect(() => {
    const handleHighlightNextTaskChange = (event: CustomEvent) => {
      setHighlightNextTask(event.detail);
    };

    window.addEventListener(
      "highlightNextTaskChanged",
      handleHighlightNextTaskChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "highlightNextTaskChanged",
        handleHighlightNextTaskChange as EventListener
      );
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{globalStyles}</style>
      <div className="h-screen flex flex-col">
        <TaskManagementHeader
          onClearCompleted={handleClearCompleted}
          onStatsClick={() => setIsStatsModalOpen(true)}
          completedPosition={completedPosition}
          onCompletedPositionChange={setCompletedPosition}
        />

        {/* Days Container - Now with dynamic height */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="days-container h-full overflow-x-auto">
            <div className="flex space-x-8 p-4 pl-8 h-fit min-h-[calc(100vh-8rem)]">
              {days.map((day, dayIndex) => (
                <DayColumn
                  key={day.date.toISOString()}
                  day={day}
                  dayIndex={dayIndex}
                  isLoading={isLoading}
                  hidingItems={hidingItems}
                  onAddTask={handleAddTask}
                  onSectionAdded={reloadData}
                  moveItem={moveItem}
                  renderTask={renderTask}
                  renderSection={renderSection}
                  isTask={isTask}
                  sortItems={sortItems}
                />
              ))}
            </div>
          </div>
        </div>

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={(task) => {
              if (task.shouldClose) {
                setSelectedTask(null);
              }
            }}
            onUpdate={handleEditTask}
            onDelete={handleDeleteTask}
          />
        )}
        {selectedSection && (
          <SectionModal
            section={selectedSection}
            isOpen={!!selectedSection}
            onClose={(section) => {
              if (section.shouldClose) {
                setSelectedSection(null);
              }
            }}
            onUpdate={handleEditSection}
            onDelete={handleDeleteSection}
          />
        )}

        {/* Add Stats Modal */}
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
        />
      </div>
    </DndProvider>
  );
}
