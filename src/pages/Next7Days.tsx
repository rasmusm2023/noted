import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import { goalService } from "../services/goalService";
import type { Task } from "../types/task";
import type { Goal } from "../services/goalService";
import { Icon } from "@iconify/react";
import confetti from "canvas-confetti";
import { TaskModal } from "../components/TaskModal/TaskModal";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { StatsModal } from "../components/Next7Days/StatsModal";
import { TaskManagementHeader } from "../components/Next7Days/TaskManagementHeader";
import { DayColumn } from "../components/Next7Days/DayColumn";
import { TaskItem } from "../components/Next7Days/TaskItem";
import { toast } from "react-hot-toast";
import { ClearCompletedButton } from "../components/Buttons/ClearCompletedButton";

type DayData = {
  id: string;
  date: Date;
  items: Task[];
};

// Add cache types
type Cache<T> = {
  data: Map<string, T>;
  lastUpdated: number;
};

// Add offline queue type
type QueuedOperation = {
  operation: "create" | "update" | "delete";
  data: any;
  timestamp: number;
  type: "task"; // Add type field
};

export function Next7Days() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [completedPosition] = useState<"top" | "bottom" | "mixed">(() => {
    const savedPosition = localStorage.getItem("completedPosition");
    return (savedPosition as "top" | "bottom" | "mixed") || "mixed";
  });
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set());
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Add caches
  const [taskCache, setTaskCache] = useState<Cache<Task>>({
    data: new Map(),
    lastUpdated: 0,
  });

  // Add offline queue
  const [offlineQueue, setOfflineQueue] = useState<QueuedOperation[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Add this near the top with other state declarations
  const hasLoadedData = useRef(false);

  // Add this near the top with other state declarations
  const [pendingUpdates, setPendingUpdates] = useState<{
    sourceDay: number;
    targetDay: number;
    items: Task[];
  } | null>(null);

  const daysContainerRef = useRef<HTMLDivElement>(null);

  // Add scroll handler for updating current day index
  useEffect(() => {
    const container = daysContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const dayWidth = containerWidth - 32; // Account for padding
      const newIndex = Math.round(scrollLeft / dayWidth);
      setCurrentDayIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Add indicator dots component
  const DayIndicators = () => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 lg:hidden">
      <div className="bg-neu-whi-100/80 dark:bg-neu-gre-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-neu-gre-200/50 dark:border-neu-gre-700/50">
        <div className="flex items-center space-x-3">
          {days.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const container = daysContainerRef.current;
                if (container) {
                  const containerWidth = container.clientWidth;
                  const dayWidth = containerWidth - 32;
                  container.scrollTo({
                    left: index * dayWidth,
                    behavior: "smooth",
                  });
                }
              }}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentDayIndex === index
                  ? "w-8 bg-gradient-to-r from-task-orange-400 to-task-orange-600 dark:from-task-orange-500 dark:to-task-orange-700 shadow-lg"
                  : "w-3 bg-neu-gre-300 dark:bg-neu-gre-500 hover:bg-neu-gre-400 dark:hover:bg-neu-gre-400"
              }`}
              aria-label={`Go to day ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

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

  const getFromCache = (id: string, type: "task") => {
    return taskCache.data.get(id);
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
      const [tasks, userGoals] = await Promise.all([
        taskService.getUserTasks(currentUser.uid),
        goalService.getUserGoals(currentUser.uid),
      ]);
      setGoals(userGoals);

      // Group tasks by day
      const tasksByDay = tasks.reduce(
        (acc: Record<number, Task[]>, task: Task) => {
          // Parse the date from the task's date field (not scheduledTime)
          const taskDate = parseDateString(task.date);

          const dayIndex = days.findIndex((day) => {
            const dayDate = new Date(day.date);
            dayDate.setHours(0, 0, 0, 0);
            const taskDateCopy = new Date(taskDate);
            taskDateCopy.setHours(0, 0, 0, 0);

            // Compare dates using time values to avoid timezone issues
            const dayTime = dayDate.getTime();
            const taskTime = taskDateCopy.getTime();
            return dayTime === taskTime;
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
              date: task.date, // Use the original date field
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

      // Update days with tasks
      setDays((prevDays) => {
        const newDays = prevDays.map((day, index) => {
          const updatedDay = {
            ...day,
            items: [...(tasksByDay[index] || [])],
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
      const date = new Date(dateStr);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      return date;
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

  const isTask = (item: Task): item is Task => {
    return item.type === "task";
  };

  const sortItems = (items: Task[]) => {
    return items.sort((a, b) => {
      // If both items have order, use that for custom sorting
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      // For completed on top/bottom sorting
      if (completedPosition === "top") {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
      } else if (completedPosition === "bottom") {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }

      // If both items are in the same completion state, maintain their relative order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    });
  };

  const handleAddTask = async (
    dayIndex: number,
    title: string,
    task?: Task
  ) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    if (!title.trim()) return;

    try {
      const taskDate = new Date(days[dayIndex].date);
      taskDate.setHours(12, 0, 0, 0);

      console.log("Creating task for date:", taskDate.toLocaleString());

      const taskData: Omit<
        Task,
        "id" | "userId" | "createdAt" | "updatedAt" | "order"
      > = {
        type: "task" as const,
        title: title.trim(),
        description: task?.description || "",
        scheduledTime: taskDate.toISOString(), // Store in ISO format
        completed: false,
        date: taskDate.toISOString(), // Store in ISO format
        subtasks:
          task?.subtasks?.map((subtask) => ({
            ...subtask,
            completed: false,
          })) || [],
      };

      console.log("Task data being created:", taskData);

      const newTask = await taskService.createTask(currentUser.uid, taskData);
      console.log("New task created:", newTask);

      updateTaskCache(newTask);

      // Update UI - only add to the selected day
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
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
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
                  item.id === taskId ? { ...item, completed } : item
                ),
              }
            : day
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleEditTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.map((item) =>
            item.id === taskId ? { ...item, ...updates } : item
          );
        });
        return newDays;
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleSaveTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      // Get the task from days
      const task = days
        .flatMap((day) => day.items)
        .find((item) => item.id === taskId) as Task;
      if (!task) return;

      // Get all saved tasks first
      const savedTasks = await taskService.getSavedTasks(currentUser.uid);

      // Check if this task is already saved (by matching originalTaskId)
      const existingSavedTask = savedTasks.find(
        (savedTask) => savedTask.originalTaskId === taskId
      );

      if (existingSavedTask) {
        // If task is already saved, unsave it
        await taskService.unsaveTask(existingSavedTask.id);

        // Update local state
        setDays((prevDays) =>
          prevDays.map((day) => ({
            ...day,
            items: day.items.map((item) =>
              item.id === taskId ? { ...item, isSaved: false } : item
            ),
          }))
        );

        toast.success("Task removed from library");
        return;
      }

      // If task is not saved, save it
      await taskService.saveTask(taskId);

      // Update local state
      setDays((prevDays) =>
        prevDays.map((day) => ({
          ...day,
          items: day.items.map((item) =>
            item.id === taskId ? { ...item, isSaved: true } : item
          ),
        }))
      );

      toast.success("Task saved to library");
    } catch (error) {
      console.error("Error saving/unsaving task:", error);
      toast.error("Failed to update task library");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays.forEach((day) => {
          day.items = day.items.filter((item) => item.id !== taskId);
        });
        return newDays;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
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
        goals={goals}
        dayIndex={dayIndex}
        isNextTask={isNextTask}
        editingTask={editingTask}
        onTaskClick={handleTaskClick}
        onTaskCompletion={handleTaskCompletion}
        onTaskDelete={handleDeleteTask}
        onTaskEdit={handleEditTask}
        onEditingTaskChange={setEditingTask}
        onTaskSave={handleSaveTask}
      />
    );
  };

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
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
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
      background-color: rgb(74, 222, 128, 0.5);
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

    .highlighted-task {
      animation: none;
      background: linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -moz-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -webkit-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=#A78BFA,endColorstr=#6D28D9,GradientType=1);
      position: relative;
      transition: all 0.3s ease-in-out;
    }

    .highlighted-task:hover {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
      z-index: 10;
    }

    /* Mobile and tablet specific styles */
    @media (max-width: 1023px) {
      .days-container {
        scroll-padding: 0 1rem;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .days-container::-webkit-scrollbar {
        display: none;
      }
    }
  `;

  // Add this after other useEffect hooks
  useEffect(() => {
    if (pendingUpdates) {
      const timeoutId = setTimeout(async () => {
        try {
          const { sourceDay, targetDay, items } = pendingUpdates;
          const targetDate = new Date(days[targetDay].date);
          targetDate.setHours(12, 0, 0, 0);

          // Only update the moved item's date and order
          const movedItem = items[0]; // The first item is always the moved item
          if (isTask(movedItem)) {
            await taskService.updateTask(movedItem.id, {
              order: movedItem.order,
              scheduledTime: targetDate.toLocaleString(),
              date: targetDate.toISOString(),
            });
          }

          // Update orders for other items that changed
          const otherItems = items.slice(1); // Skip the moved item
          const updatePromises = otherItems.map((item) => {
            if (isTask(item)) {
              return taskService.updateTask(item.id, {
                order: item.order,
              });
            }
            return Promise.resolve();
          });

          await Promise.all(updatePromises);
          console.log("Debounced database update completed:", {
            sourceDay,
            targetDay,
            itemsCount: items.length,
          });
        } catch (error) {
          console.error("Error in debounced update:", error);
          // Revert the state if the update fails
          setDays(days);
        } finally {
          setPendingUpdates(null);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [pendingUpdates, days]);

  // Update the moveItem function
  const moveItem = async (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => {
    console.log("=== DRAG AND DROP DEBUG START ===");
    console.log("Initial State:", {
      dragIndex,
      hoverIndex,
      sourceDay,
      targetDay,
      sourceDayItems: days[sourceDay].items,
      targetDayItems: days[targetDay].items,
    });

    // Create a new array of days to avoid mutating state directly
    const newDays = [...days];
    const sourceItems = [...newDays[sourceDay].items];
    const [movedItem] = sourceItems.splice(dragIndex, 1);

    console.log("After removing item:", {
      movedItem,
      sourceItems,
      sourceDayItemsLength: sourceItems.length,
    });

    if (sourceDay === targetDay) {
      console.log("Same day reordering");
      // Same day reordering
      sourceItems.splice(hoverIndex, 0, movedItem);

      // Update the order of all items in the day
      const updatedItems = sourceItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      console.log("Updated items for same day:", {
        updatedItems,
        itemsLength: updatedItems.length,
      });

      // Update the state immediately for smooth UI
      setDays((prevDays) => {
        const updatedDays = [...prevDays];
        updatedDays[sourceDay] = {
          ...updatedDays[sourceDay],
          items: updatedItems,
        };
        return updatedDays;
      });

      // Queue the database update
      setPendingUpdates({
        sourceDay,
        targetDay,
        items: updatedItems,
      });
      console.log("=== DRAG AND DROP DEBUG END (SAME DAY) ===");
      return;
    }

    console.log("Cross-day move");
    // Cross-day move
    const targetItems = [...newDays[targetDay].items];
    targetItems.splice(hoverIndex, 0, movedItem);

    console.log("After inserting item:", {
      targetItems,
      targetDayItemsLength: targetItems.length,
    });

    // Update both source and target days with new orders
    setDays((prevDays) => {
      const updatedDays = [...prevDays];

      // Update source day items with new orders
      const updatedSourceItems = sourceItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Update target day items with new orders
      const updatedTargetItems = targetItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      console.log("Items with updated orders:", {
        updatedSourceItems,
        updatedTargetItems,
        sourceItemsLength: updatedSourceItems.length,
        targetItemsLength: updatedTargetItems.length,
      });

      updatedDays[sourceDay] = {
        ...updatedDays[sourceDay],
        items: updatedSourceItems,
      };

      updatedDays[targetDay] = {
        ...updatedDays[targetDay],
        items: updatedTargetItems,
      };

      return updatedDays;
    });

    // Queue the database update for both days
    // Only include the moved item and items that had their order changed
    const changedItems = [
      // Include the moved item with its new order
      { ...movedItem, order: hoverIndex },
      // Include source day items that had their order changed
      ...sourceItems.map((item, index) => ({ ...item, order: index })),
      // Include target day items that had their order changed
      ...targetItems
        .filter((item) => item.id !== movedItem.id)
        .map((item, index) => ({ ...item, order: index })),
    ];

    console.log("Final state for database update:", {
      changedItems,
      totalItemsLength: changedItems.length,
    });

    setPendingUpdates({
      sourceDay,
      targetDay,
      items: changedItems,
    });

    console.log("=== DRAG AND DROP DEBUG END (CROSS-DAY) ===");
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
      <div className="h-screen flex flex-col bg-bg-white-50 dark:bg-neu-gray-800">
        {/* Desktop Header */}
        <div className="fixed top-0 left-[var(--sidebar-width)] right-0 z-50 hidden lg:block">
          <div className="bg-bg-white-50/95 dark:bg-neu-gray-800/95 backdrop-blur-sm border-b-1 dark:border-neu-gray-700">
            <TaskManagementHeader onClearCompleted={handleClearCompleted}>
              <div className="flex items-center space-x-3">
                <Icon
                  icon="mingcute:trello-board-fill"
                  className="text-pri-pur-500 w-6 h-6 sm:w-8 sm:h-8"
                  aria-hidden="true"
                />
                <h1 className="text-2xl sm:text-3xl font-medium text-neu-gre-800 dark:text-neu-whi-100 font-clash">
                  Next 7 Days
                </h1>
              </div>
            </TaskManagementHeader>
            <div className="border-b border-neu-gray-300/50 dark:border-neu-gray-700/50"></div>
          </div>
        </div>

        {/* Days Container - Now with dynamic height */}
        <div className="flex-1 overflow-y-auto relative pt-0 lg:pt-20">
          {/* Mobile/Tablet Header */}
          <div className="lg:hidden bg-neu-whi-100/95 dark:bg-neu-gre-800/95 backdrop-blur-sm border-b border-neu-gre-300/50 dark:border-neu-gre-700/50">
            <div className="flex items-center justify-between px-4 py-8">
              <div className="flex items-center space-x-3">
                <Icon
                  icon="mingcute:trello-board-fill"
                  className="text-pri-pur-500 w-6 h-6"
                  aria-hidden="true"
                />
                <h1 className="text-3xl font-medium text-neu-gre-800 dark:text-neu-whi-100 font-clash">
                  Next 7 Days
                </h1>
              </div>
              <ClearCompletedButton onClearCompleted={handleClearCompleted} />
            </div>
          </div>

          <div
            ref={daysContainerRef}
            className="days-container h-full overflow-x-auto"
          >
            <div className="flex space-x-6 p-4 px-6 lg:px-8 h-fit min-h-[calc(100vh-12rem)] lg:min-h-[calc(100vh-8rem)] pb-[200px] lg:pb-[1000px] w-fit lg:w-auto lg:flex-nowrap lg:overflow-x-visible">
              {days.map((day, dayIndex) => (
                <div
                  key={day.date.toISOString()}
                  className="flex-none w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] lg:w-auto snap-center snap-always"
                >
                  <DayColumn
                    day={day}
                    dayIndex={dayIndex}
                    isLoading={isLoading}
                    hidingItems={hidingItems}
                    onAddTask={handleAddTask}
                    moveItem={moveItem}
                    renderTask={renderTask}
                    sortItems={sortItems}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Add Day Indicators */}
          <DayIndicators />
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

        {/* Add Stats Modal */}
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
        />
      </div>
    </DndProvider>
  );
}
