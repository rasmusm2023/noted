import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, SectionItem } from "../types/task";
import {
  TrashBinTrash,
  Pen,
  CheckSquare,
  Record,
  Bookmark,
} from "solar-icon-set";
import confetti from "canvas-confetti";
import { TaskModal } from "../components/TaskModal/TaskModal";
import { SectionModal } from "../components/SectionModal/SectionModal";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PageTransition } from "../components/PageTransition";
import { LoadingScreen } from "../components/LoadingScreen";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskProgress } from "../components/Dashboard/TaskProgress";
import { TaskList } from "../components/Dashboard/TaskList";
import { QuickActions } from "../components/Dashboard/QuickActions";
import { PomodoroTimer } from "../components/Pomodoro/PomodoroTimer";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

// Import weather icons
import sunIcon from "../assets/weather-icons/sun-svgrepo-com(1).svg";
import cloudIcon from "../assets/weather-icons/cloud-svgrepo-com.svg";
import cloudySunIcon from "../assets/weather-icons/cloudy-sun-svgrepo-com.svg";
import rainIcon from "../assets/weather-icons/rain-water-svgrepo-com.svg";
import snowIcon from "../assets/weather-icons/snowflake-svgrepo-com.svg";
import thunderIcon from "../assets/weather-icons/thunder-svgrepo-com.svg";
import windIcon from "../assets/weather-icons/wind-svgrepo-com.svg";
import moonIcon from "../assets/weather-icons/crescent-moon-moon-svgrepo-com.svg";

type ListItem = Task | SectionItem;

type DragState = {
  item: ListItem;
  sourceIndex: number;
  currentIndex: number;
  position: "before" | "after";
  isDraggingOverCompleted?: boolean;
  originalOrder: number;
};

// Add new types for drag and drop
type DragItem = {
  id: string;
  type: string;
  index: number;
  item: ListItem;
};

// Add new component for draggable item
const DraggableItem = ({
  item,
  index,
  moveItem,
  isTaskItem,
  renderTask,
  renderSection,
  isTask,
}: {
  item: ListItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isTaskItem: boolean;
  renderTask: (task: Task) => JSX.Element;
  renderSection: (section: SectionItem) => JSX.Element;
  isTask: (item: ListItem) => item is Task;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: item.type, index, item },
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

      if (isOver) {
        console.log("Drop Target State:", {
          itemId: item.id,
          index,
          isOver,
          canDrop,
          dropPosition,
          hoverMiddleY: hoverBoundingRect
            ? (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            : null,
          hoverClientY: clientOffset
            ? clientOffset.y - (hoverBoundingRect?.top || 0)
            : null,
        });
      }

      return { isOver, canDrop, dropPosition };
    },
    canDrop: (draggedItem: DragItem) => {
      const canDrop = !(draggedItem.id === item.id);
      console.log("Can Drop Check:", {
        draggedItemId: draggedItem.id,
        targetItemId: item.id,
        canDrop,
      });
      return canDrop;
    },
    hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        console.log("Skipping hover - same index");
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

      console.log("Hover State:", {
        dragIndex,
        hoverIndex,
        hoverClientY,
        dropThreshold,
        hoverMiddleY,
        shouldMove:
          !(dragIndex < hoverIndex && hoverClientY < dropThreshold) &&
          !(dragIndex > hoverIndex && hoverClientY > dropThreshold),
      });

      // Only perform the move when the mouse has crossed the threshold
      if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
      if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
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
        borderTop: "2px solid #3b82f6",
        marginTop: "2px",
      };
    } else if (dropPosition === "after") {
      return {
        ...baseStyle,
        borderBottom: "2px solid #3b82f6",
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
      } ${isOver && canDrop ? "bg-blue-500/5" : ""}`}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-dropeffect="move"
    >
      {item.type === "section"
        ? renderSection(item as SectionItem)
        : isTaskItem
        ? renderTask(item as Task)
        : null}
    </div>
  );
};

export function Dashboard() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTimestamp, setIsCreatingTimestamp] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(
    null
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);
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
  const [editingSection, setEditingSection] = useState<SectionItem | null>(
    null
  );
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionTime, setNewSectionTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  // Add new drag and drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Add new state for preview animation
  const [previewAnimation, setPreviewAnimation] = useState<{
    index: number;
    direction: "up" | "down";
  } | null>(null);

  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });

  const [isTimerVisible, setIsTimerVisible] = useState(false);

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

  const isTask = (item: ListItem): item is Task => {
    return item.type === "task";
  };

  const isSection = (item: ListItem): item is SectionItem => {
    return item.type === "section";
  };

  // Helper function to parse date strings
  const parseDateString = (dateStr: string): Date => {
    // If it's an ISO string or YYYY-MM-DD format, parse it directly
    if (dateStr.includes("T") || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr);
    }

    // Handle format "DD/MM/YYYY, HH:mm:ss"
    const [datePart, timePart] = dateStr.split(", ");
    if (!datePart || !timePart) {
      console.warn("Invalid date format:", dateStr);
      return new Date(); // Return current date as fallback
    }

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

  // Helper function to get today's date in user's timezone
  const getTodayInUserTimezone = (): Date => {
    const now = new Date();
    // Set to midnight in user's timezone
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Helper function to format date for display
  const formatDateForDisplay = (
    date: Date
  ): { dayOfWeek: string; currentDate: string } => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const dayOfWeek = date.toLocaleString("default", { weekday: "long" });

    return {
      dayOfWeek,
      currentDate: `${month} ${day}`,
    };
  };

  // Update filteredAndSortedItems to filter for today and sort
  const filteredAndSortedItems = items
    .filter((item) => {
      const itemDate = parseDateString(
        isTask(item) ? item.scheduledTime : item.scheduledTime || item.createdAt
      );
      const today = getTodayInUserTimezone();

      // Compare dates by their date parts only (ignoring time)
      const itemDateStr = itemDate.toLocaleDateString();
      const todayStr = today.toLocaleDateString();

      return itemDateStr === todayStr;
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

  // Calculate completion percentage
  const todaysTasks = items.filter(isTask);
  const completionPercentage =
    todaysTasks.length > 0
      ? Math.round(
          (todaysTasks.filter((task) => task.completed).length /
            todaysTasks.length) *
            100
        )
      : 0;

  // Add useEffect to load data on mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Update date on mount and every day
  useEffect(() => {
    const updateDate = async () => {
      const today = getTodayInUserTimezone();
      const { dayOfWeek: newDayOfWeek, currentDate: newCurrentDate } =
        formatDateForDisplay(today);

      setCurrentDate(newCurrentDate);
      setDayOfWeek(newDayOfWeek);

      // Only move incomplete tasks at midnight
      const now = new Date();
      const isMidnight = now.getHours() === 0 && now.getMinutes() === 0;

      if (currentUser && isMidnight) {
        await taskService.moveIncompleteTasksToNextDay(currentUser.uid);
        // Reload data after moving tasks
        const [tasks, sections] = await Promise.all([
          taskService.getUserTasks(currentUser.uid),
          taskService.getUserSections(currentUser.uid),
        ]);
        setItems([...tasks, ...sections]);
      }
    };

    updateDate();
    // Update at midnight in user's timezone
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      updateDate();
      // Set up daily updates
      setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [currentUser]);

  // Add temperature fetching
  useEffect(() => {
    const fetchTemperature = async (latitude: number, longitude: number) => {
      try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

        if (!apiKey) {
          console.error("OpenWeather API key is not configured");
          return;
        }

        const url = new URL("http://api.openweathermap.org/data/2.5/weather");
        url.searchParams.append("lat", latitude.toString());
        url.searchParams.append("lon", longitude.toString());
        url.searchParams.append("units", "metric");
        url.searchParams.append("appid", apiKey);

        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 401) {
          console.error(
            "Invalid API key. Please check your OpenWeather API key configuration."
          );
          return;
        }

        if (!data.main?.temp) {
          console.error("Unexpected API response format:", data);
          return;
        }

        setTemperature(Math.round(data.main.temp));
        setWeatherCondition(data.weather[0]?.main || null);
      } catch (error) {
        console.error("Error fetching temperature:", error);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchTemperature(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const getWeatherIcon = (condition: string | null) => {
    if (!condition) return null;

    const iconMap: { [key: string]: string } = {
      Clear: sunIcon,
      Clouds: cloudIcon,
      Rain: rainIcon,
      Snow: snowIcon,
      Thunderstorm: thunderIcon,
      Drizzle: rainIcon,
      Mist: cloudySunIcon,
      Wind: windIcon,
      Night: moonIcon,
    };

    const iconSrc = iconMap[condition];
    if (!iconSrc) return null;

    return (
      <img
        src={iconSrc}
        alt={`${condition} weather icon`}
        className="h-8 w-8"
      />
    );
  };

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const tasks = await taskService.getUserTasks(currentUser.uid);
      const sections = await taskService.getUserSections(currentUser.uid);

      // Get today's date in user's timezone
      const today = getTodayInUserTimezone();

      // Filter tasks for today
      const todaysTasks = tasks.filter((task) => {
        const taskDate = parseDateString(task.scheduledTime);
        taskDate.setHours(0, 0, 0, 0);

        const taskDateStr = taskDate.toISOString().split("T")[0];
        const todayStr = today.toISOString().split("T")[0];

        return taskDateStr === todayStr;
      });

      // Filter sections for today
      const todaysSections = sections.filter((section) => {
        const sectionDate = parseDateString(
          section.scheduledTime || section.createdAt
        );
        sectionDate.setHours(0, 0, 0, 0);

        const sectionDateStr = sectionDate.toISOString().split("T")[0];
        const todayStr = today.toISOString().split("T")[0];

        return sectionDateStr === todayStr;
      });

      // Convert tasks to new format
      const tasksWithType = todaysTasks.map((task) => ({
        ...task,
        type: "task" as const,
      }));

      // Convert sections to new format
      const sectionsWithType = todaysSections.map((section) => ({
        ...section,
        type: "section" as const,
      }));

      // Combine and sort items
      const allItems = [...tasksWithType, ...sectionsWithType].sort((a, b) => {
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

      setItems(allItems);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCompletion = async (
    taskId: string,
    completed: boolean,
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

      await taskService.updateTask(taskId, { completed });
      setItems(
        items.map((item) =>
          isTask(item) && item.id === taskId ? { ...item, completed } : item
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

  const handleAddTask = async (title: string, description: string) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    try {
      // Get today's date in user's timezone
      const today = getTodayInUserTimezone();
      // Set to noon for better visibility
      today.setHours(12, 0, 0, 0);

      const newTask = await taskService.createTask(currentUser.uid, {
        type: "task",
        title: title,
        description: description,
        scheduledTime: today.toISOString(),
        completed: false,
        date: today.toISOString(),
      });

      setItems((prevItems) => [newTask, ...prevItems]);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask(newTaskTitle, newTaskDescription);
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      setNewTaskDescription("");
    }
  };

  const handleEditTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      setItems(
        items.map((item) =>
          isTask(item) && item.id === taskId ? { ...item, ...updates } : item
        )
      );
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) {
      console.error("No task ID provided for deletion");
      return;
    }

    try {
      // Add deleting class to the task
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.classList.add("task-deleting");
        // Wait for the animation to finish
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await taskService.deleteTask(taskId);
      setItems(items.filter((item) => !isTask(item) || item.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const [focusedInput, setFocusedInput] = useState<"task" | "section" | null>(
    null
  );

  const handleDragStart = (
    e: React.DragEvent,
    item: ListItem,
    index: number
  ) => {
    e.stopPropagation();
    console.log("=== Drag Start ===");
    console.log("Item:", { id: item.id, type: item.type, order: item.order });
    console.log("Source Index:", index);

    setIsDragging(true);
    setDragState({
      item,
      sourceIndex: index,
      currentIndex: index,
      position: "after",
      originalOrder: item.order || 0,
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

    console.log("Drag State Set:", {
      sourceIndex: index,
      currentIndex: index,
      position: "after",
      originalOrder: item.order || 0,
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState || !listContainerRef.current) return;

    const listRect = listContainerRef.current.getBoundingClientRect();
    const mouseY = e.clientY;
    const relativeY = mouseY - listRect.top;
    const itemHeight = listRect.height / filteredAndSortedItems.length;
    const itemTop = index * itemHeight;
    const itemBottom = (index + 1) * itemHeight;

    // Calculate position based on mouse position relative to the item's center
    const position =
      relativeY < (itemTop + itemBottom) / 2 ? "before" : ("after" as const);

    // Check if we're dragging over a completed item
    const targetItem = filteredAndSortedItems[index];
    const isDraggingOverCompleted = isTask(targetItem) && targetItem.completed;

    console.log("=== Drag Over ===");
    console.log("Current Index:", index);
    console.log("Mouse Position:", {
      y: mouseY,
      relativeY,
      itemTop,
      itemBottom,
      itemHeight,
      center: (itemTop + itemBottom) / 2,
    });
    console.log("Drop Position:", position);
    console.log("Target Item:", {
      id: targetItem.id,
      type: targetItem.type,
      order: targetItem.order,
      isCompleted: isTask(targetItem) ? targetItem.completed : false,
    });

    // Don't update if we're over the same position
    if (dragState.currentIndex === index && dragState.position === position) {
      console.log("Skipping update - same position");
      return;
    }

    // Update drag state
    setDragState((prev) => {
      if (!prev) return null;

      // Calculate if we need to animate items
      const oldIndex = prev.currentIndex;
      const newIndex = index;

      if (oldIndex !== newIndex) {
        // Determine animation direction
        const direction = newIndex > oldIndex ? "up" : "down";
        setPreviewAnimation({ index: newIndex, direction });
        console.log("Animation:", { direction, newIndex });
      }

      const newState: DragState = {
        ...prev,
        currentIndex: index,
        position,
        isDraggingOverCompleted,
      };

      console.log("New Drag State:", newState);
      return newState;
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log("=== Drag End ===");
    console.log("Final Drag State:", dragState);

    setIsDragging(false);
    setDragState(null);
    setPreviewAnimation(null);
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState) return;

    const { item, sourceIndex, position, originalOrder } = dragState;

    // Calculate the target index
    let targetIndex = position === "before" ? index : index + 1;

    // Adjust target index if we're moving an item forward
    if (sourceIndex < targetIndex) {
      targetIndex--;
    }

    // Ensure target index is within bounds
    targetIndex = Math.max(0, Math.min(targetIndex, items.length - 1));

    // Don't do anything if we're dropping at the same position
    if (sourceIndex === targetIndex) {
      console.log("Skipping drop - same position");
      setDragState(null);
      setPreviewAnimation(null);
      setIsDragging(false);
      return;
    }

    console.log("Calculated Target Index:", targetIndex);
    console.log(
      "Original Items:",
      items.map((item) => ({ id: item.id, order: item.order }))
    );

    // Create new array with reordered items
    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update orders to ensure they are sequential
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    console.log(
      "Updated Items:",
      updatedItems.map((item) => ({ id: item.id, order: item.order }))
    );

    // Update state immediately
    setItems(updatedItems);
    setDragState(null);
    setPreviewAnimation(null);
    setIsDragging(false);

    // Save the new order to the database
    try {
      if (currentUser) {
        const taskUpdates = updatedItems.filter(isTask) as Task[];
        const sectionUpdates = updatedItems.filter(isSection) as SectionItem[];

        console.log("Saving to database:", {
          taskUpdates,
          sectionUpdates,
        });

        await Promise.all([
          taskService.updateTaskOrder(taskUpdates),
          taskService.updateSectionOrder(sectionUpdates),
        ]);

        console.log("Database update successful");
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      // Revert state changes if the database update fails
      setItems(items);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    };

    if (isSortMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isSortMenuOpen]);

  // Update the handleAddSection function
  const handleAddSection = async (title: string, time: string) => {
    if (!currentUser) return;

    try {
      // Get today's date in user's timezone
      const today = getTodayInUserTimezone();
      // Set to noon for better visibility
      today.setHours(12, 0, 0, 0);

      await taskService.createSection(currentUser.uid, {
        text: title,
        time: time,
        scheduledTime: today.toISOString(),
      });

      // Reload data to show the new section
      loadData();
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  // Update the time display in the section item
  const formatTime = (time: string | undefined) => {
    if (!time) return "";
    return time;
  };

  const handleSectionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSection(newSectionTitle, newSectionTime);
    } else if (e.key === "Escape") {
      setNewSectionTitle("");
      setNewSectionTime("");
    }
  };

  // Add handleDeleteSection function
  const handleDeleteSection = async (sectionId: string) => {
    try {
      await taskService.deleteSection(sectionId);
      setItems(
        items.filter((item) => !isSection(item) || item.id !== sectionId)
      );
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  // Add handleEditSection function
  const handleEditSection = async (
    sectionId: string,
    updates: Partial<SectionItem>
  ) => {
    try {
      await taskService.updateSection(sectionId, updates);
      setItems(
        items.map((item) =>
          isSection(item) && item.id === sectionId
            ? { ...item, ...updates }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  // Update the input click handler
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const input = e.currentTarget;
    // Only focus if not already focused
    if (document.activeElement !== input) {
      input.focus();
    }
  };

  // Update the section input
  const renderSection = (item: SectionItem) => (
    <div
      className={`p-4 ${
        item.backgroundColor || "bg-neu-900"
      } rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
      tabIndex={0}
      onClick={() => setSelectedSection(item)}
    >
      <div className="flex-1">
        <h3 className="text-lg font-inter font-semibold text-neu-300">
          {item.text}
        </h3>
      </div>
      <div className="mx-4">
        <h3 className="text-base font-inter font-semibold text-neu-400">
          {formatTime(item.time)}
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSection(item);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              setSelectedSection(item);
            }
          }}
          className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Edit section "${item.text}"`}
        >
          <Pen size={24} color="currentColor" autoSize={false} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSection(item.id);
          }}
          className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Delete section "${item.text}"`}
        >
          <TrashBinTrash size={24} color="currentColor" autoSize={false} />
        </button>
      </div>
    </div>
  );

  // Add new handler for saving tasks
  const handleSaveTask = async (taskId: string, isSaved: boolean) => {
    try {
      if (!isSaved) {
        // Get the task element
        const taskElement = document.querySelector(
          `[data-task-id="${taskId}"]`
        );
        if (taskElement) {
          // Add a class for the save animation
          taskElement.classList.add("task-saving");

          // Get the task library button position
          const taskLibraryButton = document.querySelector(
            ".task-library-button"
          );
          if (taskLibraryButton) {
            const buttonRect = taskLibraryButton.getBoundingClientRect();
            const taskRect = taskElement.getBoundingClientRect();

            // Create a floating element
            const floatingElement = document.createElement("div");
            floatingElement.className = "floating-task";
            floatingElement.style.position = "fixed";
            floatingElement.style.left = `${taskRect.left}px`;
            floatingElement.style.top = `${taskRect.top}px`;
            floatingElement.style.width = `${taskRect.width}px`;
            floatingElement.style.height = `${taskRect.height}px`;
            floatingElement.style.zIndex = "1000";
            floatingElement.style.transition = "all 0.5s ease-in-out";
            floatingElement.style.backgroundColor = "var(--pri-tea-500)";
            floatingElement.style.borderRadius = "0.5rem";
            floatingElement.style.opacity = "0.8";
            document.body.appendChild(floatingElement);

            // Animate to the task library button
            requestAnimationFrame(() => {
              floatingElement.style.left = `${buttonRect.left}px`;
              floatingElement.style.top = `${buttonRect.top}px`;
              floatingElement.style.width = `${buttonRect.width}px`;
              floatingElement.style.height = `${buttonRect.height}px`;
              floatingElement.style.opacity = "0";
            });

            // Remove the floating element after animation
            setTimeout(() => {
              document.body.removeChild(floatingElement);
              taskElement.classList.remove("task-saving");
            }, 500);
          }
        }

        await taskService.saveTask(taskId);
        toast.success("Task template saved to library");
        // Update local state
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === taskId ? { ...item, isSaved: true } : item
          )
        );

        // Log saved tasks
        if (currentUser) {
          const savedTasks = await taskService.getSavedTasks(currentUser.uid);
          console.log(
            "Task Library:",
            savedTasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
            }))
          );
        }
      } else {
        await taskService.unsaveTask(taskId);
        toast.success("Task template removed from library");
        // Update local state
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === taskId ? { ...item, isSaved: false } : item
          )
        );
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  // Update the renderTask function to include the save button
  const renderTask = (item: Task) => {
    const isNextTask =
      highlightNextTask &&
      !item.completed &&
      items.filter((i) => isTask(i) && !i.completed).indexOf(item) === 0;

    const handleTaskClick = (item: Task, e: React.MouseEvent) => {
      // Don't open modal if clicking on buttons, inputs, or if we're editing
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest("button") ||
          e.target.closest("input") ||
          editingTask?.id === item.id)
      ) {
        e.stopPropagation();
        return;
      }

      // Clear any existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
        // If we had a timeout, this is a double click
        setEditingTask(item);
        return;
      }

      // Set a new timeout
      const timeout = setTimeout(() => {
        setSelectedTask(item);
        setClickTimeout(null);
      }, 200); // 200ms delay to allow for double click

      setClickTimeout(timeout);
    };

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
        className={`task-item p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
          item.completed
            ? "bg-sup-suc-400 bg-opacity-50"
            : isTask(item) && item.backgroundColor
            ? item.backgroundColor
            : "bg-neu-gre-200"
        } ${
          isNextTask
            ? "highlighted-task ring-2 ring-pri-blue-500 ring-opacity-60"
            : ""
        } focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
        onClick={(e) => handleTaskClick(item, e)}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskCompletion(item.id, !item.completed, e);
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
                <CheckSquare size={32} color="currentColor" autoSize={false} />
              ) : (
                <Record
                  size={32}
                  color="currentColor"
                  autoSize={false}
                  className={isNextTask ? "animate-bounce-subtle" : ""}
                />
              )}
            </button>
          </div>
          <div className="flex-1 flex items-center">
            <div className="flex-1">
              <h3
                className={`text-base font-inter font-regular ${
                  editingTask?.id === item.id
                    ? ""
                    : "transition-all duration-300"
                } ${item.completed ? "text-neu-100 scale-95" : "text-neu-100"}`}
              >
                {editingTask?.id === item.id ? (
                  <input
                    ref={taskInputRef}
                    type="text"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        title: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEditTask(item.id, {
                          title: editingTask.title,
                        });
                      } else if (e.key === "Escape") {
                        setEditingTask(null);
                      }
                    }}
                    onBlur={() => {
                      handleEditTask(item.id, {
                        title: editingTask.title,
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-base font-inter font-regular text-neu-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-blue-500"
                    autoFocus
                  />
                ) : (
                  item.title
                )}
              </h3>
              {item.subtasks && item.subtasks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          subtask.completed ? "bg-sup-suc-500" : "bg-neu-500"
                        }`}
                      />
                      <span
                        className={`font-inter text-sm ${
                          subtask.completed
                            ? "line-through text-neu-400"
                            : "text-neu-400"
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveTask(item.id, item.isSaved || false);
                }}
                className={`p-2 flex items-center justify-center ${
                  item.isSaved
                    ? "text-pri-blue-500 hover:text-pri-blue-400"
                    : "text-neu-400 hover:text-pri-blue-500"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
                aria-label={`${item.isSaved ? "Unsave" : "Save"} task "${
                  item.title
                }"`}
              >
                <Bookmark size={24} color="currentColor" autoSize={false} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(item);
                }}
                className={`p-2 flex items-center justify-center ${
                  item.completed
                    ? "text-neu-100 hover:text-neu-100"
                    : "text-neu-400 hover:text-neu-100"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
                aria-label={`Edit task "${item.title}"`}
              >
                <Pen size={24} color="currentColor" autoSize={false} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(item.id);
                }}
                className={`p-2 flex items-center justify-center ${
                  item.completed
                    ? "text-neu-100 hover:text-neu-100"
                    : "text-neu-400 hover:text-red-500"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg`}
                aria-label={`Delete task "${item.title}"`}
              >
                <TrashBinTrash
                  size={24}
                  color="currentColor"
                  autoSize={false}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the globalStyles
  const globalStyles = `
    @keyframes bounce-subtle {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-2px);
      }
    }

    .animate-bounce-subtle {
      animation: bounce-subtle 1.5s ease-in-out infinite;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out forwards;
    }

    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out forwards;
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

    @keyframes pulse-ring {
      0% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
      }
    }

    .highlighted-task {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      background: linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -moz-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -webkit-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=#A78BFA,endColorstr=#6D28D9,GradientType=1);
      position: relative;
    }

    .highlighted-task::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(167, 139, 250, 0.3) 0%, rgba(109, 40, 217, 0.3) 100%);
      border-radius: 0.5rem;
      z-index: 0;
    }

    .highlighted-task > * {
      position: relative;
      z-index: 1;
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

    @keyframes deleteTask {
      0% {
        border-color: transparent;
      }
      50% {
        border-color: rgb(248, 113, 113);
      }
      100% {
        border-color: transparent;
      }
    }

    .task-deleting {
      animation: deleteTask 0.3s ease-out forwards;
      border: 2px solid transparent;
    }

    .task-saving {
      opacity: 0.5;
      transform: scale(0.95);
      transition: all 0.3s ease-in-out;
    }

    .floating-task {
      pointer-events: none;
      box-shadow: 0 4px 20px -4px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.08);
    }

    .task-library-button {
      position: relative;
    }

    .task-library-button::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 0.75rem;
      background: var(--pri-tea-500);
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }

    .task-library-button:active::after {
      opacity: 0.2;
    }
  `;

  // Update the moveItem function
  const moveItem = async (dragIndex: number, hoverIndex: number) => {
    // Get the actual indices in the original items array
    const draggedItem = filteredAndSortedItems[dragIndex];
    const originalDragIndex = items.findIndex(
      (item) => item.id === draggedItem.id
    );
    const targetItem = filteredAndSortedItems[hoverIndex];
    const originalHoverIndex = items.findIndex(
      (item) => item.id === targetItem.id
    );

    // Create new array with reordered items
    const newItems = [...items];
    const [movedItem] = newItems.splice(originalDragIndex, 1);
    newItems.splice(originalHoverIndex, 0, movedItem);

    // Update orders to ensure they are sequential
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    setItems(updatedItems);

    // Save to database
    try {
      if (currentUser) {
        const taskUpdates = updatedItems.filter(isTask) as Task[];
        const sectionUpdates = updatedItems.filter(isSection) as SectionItem[];

        await Promise.all([
          taskService.updateTaskOrder(taskUpdates),
          taskService.updateSectionOrder(sectionUpdates),
        ]);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      setItems(items); // Revert on error
    }
  };

  // Add handleUpdateSection function
  const handleUpdateSection = async (
    sectionId: string,
    updates: Partial<SectionItem>
  ) => {
    try {
      await taskService.updateSection(sectionId, updates);
      setItems(
        items.map((item) =>
          isSection(item) && item.id === sectionId
            ? { ...item, ...updates }
            : item
        )
      );
      // Only close the modal if explicitly requested
      if (updates.shouldClose) {
        setSelectedSection(null);
      }
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  // Add handleClearCompleted function
  const handleClearCompleted = async () => {
    const completedTasks = items
      .filter((item) => isTask(item) && item.completed)
      .map((item) => item.id);

    const updatedItems = items.filter(
      (item) => !isTask(item) || !item.completed
    );
    setItems(updatedItems);

    try {
      if (currentUser) {
        // Delete completed tasks from Firestore
        await Promise.all(
          completedTasks.map((taskId) => taskService.deleteTask(taskId))
        );
      }
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
      // Revert the state if the update fails
      setItems(items);
    }
  };

  const handleMoveItem = async (item: Task | SectionItem, targetDate: Date) => {
    if (!currentUser) return;

    try {
      const targetDateStr = targetDate.toISOString();
      const targetDateLocal = targetDate.toLocaleString();

      if ("title" in item) {
        // It's a task
        await taskService.updateTaskDate(item.id, targetDate);
      } else {
        // It's a section
        await taskService.updateSectionDate(item.id, targetDate);
      }

      // Refresh data
      await loadData();
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    if (!currentUser) return;

    try {
      await taskService.toggleTaskCompletion(taskId, true);
      await loadData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleTaskUncomplete = async (taskId: string) => {
    if (!currentUser) return;

    try {
      await taskService.toggleTaskCompletion(taskId, false);
      await loadData();
    } catch (error) {
      console.error("Error uncompleting task:", error);
    }
  };

  // Add handleTaskSelect function
  const handleTaskSelect = async (task: Task) => {
    // If the task is from the task library, add it to the items list
    if (task.isSaved === false) {
      try {
        // First reload the data to ensure we have the latest state
        await loadData();
        // Then add the new task to the items list
        const newTask = { ...task, type: "task" as const };
        setItems([newTask, ...items]);
      } catch (error) {
        console.error("Error handling new task:", error);
      }
    } else {
      setSelectedTask(task);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      // Just unsave the task, don't delete it
      await taskService.unsaveTask(taskId);
      toast.success("Task template removed from library");
    } catch (error) {
      console.error("Error removing task from library:", error);
      toast.error("Failed to remove task from library");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{globalStyles}</style>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <PageTransition>
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-16">
            <DashboardHeader
              dayOfWeek={dayOfWeek}
              currentDate={currentDate}
              temperature={temperature}
              weatherCondition={weatherCondition}
              onAddTask={handleAddTask}
              onAddSection={handleAddSection}
              onTimerClick={() => setIsTimerVisible(true)}
              isTimerActive={isTimerVisible}
            />

            <AnimatePresence mode="wait">
              {isTimerVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <PomodoroTimer onClose={() => setIsTimerVisible(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto rounded-5xl p-[4px] bg-gradient-to-r from-[rgba(239,112,155,0.5)] to-[rgba(250,147,114,0.5)]">
              <div className="bg-neu-whi-100 rounded-5xl pl-16 pr-16 pt-16 pb-16 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300">
                <TaskProgress
                  completionPercentage={completionPercentage}
                  completedPosition={completedPosition}
                  onCompletedPositionChange={setCompletedPosition}
                  onClearCompleted={handleClearCompleted}
                  onTaskSelect={handleTaskSelect}
                  onRemoveTask={handleRemoveTask}
                />

                <QuickActions onAddTask={handleAddTask} />

                {/* Tasks Box */}
                <div className="bg-neu-whi-100 rounded-xl pt-8 pb-8">
                  <TaskList
                    items={filteredAndSortedItems}
                    isLoading={isLoading}
                    highlightNextTask={highlightNextTask}
                    editingTask={editingTask}
                    onTaskCompletion={handleTaskCompletion}
                    onTaskSelect={setSelectedTask}
                    onTaskEdit={setEditingTask}
                    onTaskDelete={handleDeleteTask}
                    onTaskSave={handleSaveTask}
                    onSectionSelect={setSelectedSection}
                    onSectionDelete={handleDeleteSection}
                    onMoveItem={moveItem}
                    isTask={isTask}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
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
    </DndProvider>
  );
}
