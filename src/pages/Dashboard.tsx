import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, SectionItem } from "../types/task";
import confetti from "canvas-confetti";
import { TaskModal } from "../components/TaskModal/TaskModal";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PageTransition } from "../components/PageTransition";
import { DashboardHeader } from "../components/Dashboard/DashboardHeader";
import { TaskProgress } from "../components/Dashboard/TaskProgress";
import { TaskList } from "../components/Dashboard/TaskList";
import { QuickActions } from "../components/Dashboard/QuickActions";
import { timeIntervals } from "../components/Pomodoro/PomodoroTimer";
import type { TimeInterval } from "../components/Pomodoro/PomodoroTimer";
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

export function Dashboard() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);

  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });

  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const savedState = localStorage.getItem("pomodoroTimerState");
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.isRunning && state.startTime) {
        const elapsedSeconds = Math.floor(
          (Date.now() - state.startTime) / 1000
        );
        return Math.max(0, state.timeLeft - elapsedSeconds);
      }
      return state.timeLeft;
    }
    return 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    const savedState = localStorage.getItem("pomodoroTimerState");
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.isRunning;
    }
    return false;
  });
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(() => {
    const savedState = localStorage.getItem("pomodoroTimerState");
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.selectedInterval || timeIntervals[0];
    }
    return timeIntervals[0];
  });

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

  const isTask = (item: Task | SectionItem): item is Task => {
    return (
      "title" in item &&
      "description" in item &&
      "completed" in item &&
      "date" in item
    );
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
      const itemDate = parseDateString(item.date);
      const today = getTodayInUserTimezone();

      // Compare dates by their date parts only (ignoring time)
      const itemDateStr = itemDate.toLocaleDateString();
      const todayStr = today.toLocaleDateString();

      return itemDateStr === todayStr;
    })
    .sort((a, b) => {
      // Sort by order property
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
        const tasks = await taskService.getUserTasks(currentUser.uid);
        setItems(tasks);
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

  // Add weather cache types
  type WeatherCache = {
    temperature: number;
    condition: string;
    timestamp: number;
  };

  // Add temperature fetching with cache
  useEffect(() => {
    const fetchTemperature = async (latitude: number, longitude: number) => {
      try {
        // Check cache first
        const cachedWeather = localStorage.getItem("weatherCache");
        if (cachedWeather) {
          const {
            temperature: cachedTemp,
            condition: cachedCondition,
            timestamp,
          } = JSON.parse(cachedWeather) as WeatherCache;
          const cacheAge = Date.now() - timestamp;

          // Use cache if it's less than 15 minutes old
          if (cacheAge < 15 * 60 * 1000) {
            setTemperature(cachedTemp);
            setWeatherCondition(cachedCondition);
            return;
          }
        }

        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

        if (!apiKey) {
          console.error("OpenWeather API key is not configured");
          return;
        }

        const url = new URL("https://api.openweathermap.org/data/2.5/weather");
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

        const newTemp = Math.round(data.main.temp);

        // Update state
        setTemperature(newTemp);
        setWeatherCondition(data.weather[0]?.main || null);

        // Update cache
        const weatherCache: WeatherCache = {
          temperature: newTemp,
          condition: data.weather[0]?.main || null,
          timestamp: Date.now(),
        };
        localStorage.setItem("weatherCache", JSON.stringify(weatherCache));
      } catch (error) {
        console.error("Error fetching temperature:", error);
      }
    };

    // Function to get current position and fetch weather
    const getPositionAndFetchWeather = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchTemperature(
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }
    };

    // Initial fetch
    getPositionAndFetchWeather();

    // Set up background refresh every 15 minutes
    const refreshInterval = setInterval(
      getPositionAndFetchWeather,
      15 * 60 * 1000
    );

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
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
      setItems(tasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listContainerRef.current &&
        !listContainerRef.current.contains(event.target as Node)
      ) {
        setIsCreatingTask(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreatingTask(false);
      }
    };

    if (isCreatingTask) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isCreatingTask]);

  // Update the moveItem function
  const moveItem = async (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;

    try {
      // Create new array with reordered items
      const newItems = [...filteredAndSortedItems];
      const [movedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, movedItem);

      // Update orders to ensure they are sequential
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Update local state immediately for smooth UI
      setItems(updatedItems);

      // Save to database
      if (currentUser) {
        await taskService.updateTaskOrder(updatedItems);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      // Reload items from database on error
      if (currentUser) {
        const tasks = await taskService.getUserTasks(currentUser.uid);
        setItems(tasks);
      }
    }
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
      animation: none;
      background: linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -moz-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      background: -webkit-linear-gradient(90deg, theme(colors.pri-pur-400) 0%, theme(colors.pri-pur-700) 100%);
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=#A78BFA,endColorstr=#6D28D9,GradientType=1);
      position: relative;
      transition: all 0.3s ease-in-out;
      border: 2px solid theme(colors.pri-pur-500);
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

  // Save timer state whenever it changes
  useEffect(() => {
    if (timeLeft > 0) {
      localStorage.setItem(
        "pomodoroTimerState",
        JSON.stringify({
          selectedInterval,
          timeLeft,
          isRunning: isTimerRunning,
          startTime: isTimerRunning
            ? Date.now() - (selectedInterval.minutes * 60 - timeLeft) * 1000
            : undefined,
        })
      );
    } else {
      localStorage.removeItem("pomodoroTimerState");
    }
  }, [timeLeft, isTimerRunning, selectedInterval]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            localStorage.removeItem("pomodoroTimerState");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleTimerStart = (interval: TimeInterval) => {
    setSelectedInterval(interval);
    setTimeLeft(interval.minutes * 60);
    setIsTimerRunning(true);
    setIsTimerVisible(false);
  };

  const handleTimerPauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleTimerCancel = () => {
    setTimeLeft(0);
    setIsTimerRunning(false);
    localStorage.removeItem("pomodoroTimerState");
  };

  const handleClearCompleted = async () => {
    const completedTasks = items
      .filter((item) => item.completed)
      .map((item) => item.id);

    const updatedItems = items.filter((item) => !item.completed);
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

  const handleTaskSelect = async (task: Task) => {
    setSelectedTask(task);
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setItems(items.filter((item) => item.id !== taskId));
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const handleSaveTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      // Get the task from items
      const task = items.find((item) => item.id === taskId);
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
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === taskId ? { ...item, isSaved: false } : item
          )
        );

        toast.success("Task removed from library");
        return;
      }

      // If task is not saved, save it
      await taskService.saveTask(taskId);

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === taskId ? { ...item, isSaved: true } : item
        )
      );

      toast.success("Task saved to library");
    } catch (error) {
      console.error("Error saving/unsaving task:", error);
      toast.error("Failed to update task library");
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
        <div className="min-h-screen bg-neu-whi-100 dark:bg-neu-gre-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <DashboardHeader
                currentDate={currentDate}
                dayOfWeek={dayOfWeek}
                temperature={temperature}
                getWeatherIcon={getWeatherIcon}
                isTimerVisible={isTimerVisible}
                setIsTimerVisible={setIsTimerVisible}
                timeLeft={timeLeft}
                isTimerRunning={isTimerRunning}
                selectedInterval={selectedInterval}
                onTimerStart={handleTimerStart}
                onTimerPauseResume={handleTimerPauseResume}
                onTimerCancel={handleTimerCancel}
                weatherCondition={weatherCondition}
              />
              <div className="max-w-4xl mx-auto rounded-5xl pl-0 sm:pl-8 lg:pl-0 pr-0 sm:pr-8 lg:pr-0 pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16 transition-all duration-300 bg-neu-whi-100 dark:bg-transparent">
                <TaskProgress
                  completionPercentage={completionPercentage}
                  completedPosition="mixed"
                  onCompletedPositionChange={() => {}}
                  onClearCompleted={handleClearCompleted}
                  onTaskSelect={handleTaskSelect}
                  onRemoveTask={handleRemoveTask}
                  totalTasks={filteredAndSortedItems.length}
                  completedTasks={
                    filteredAndSortedItems.filter((task) => task.completed)
                      .length
                  }
                />

                <QuickActions onAddTask={handleAddTask} />

                {/* Tasks Box */}
                <div className="rounded-xl pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8">
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
                    onMoveItem={moveItem}
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
    </DndProvider>
  );
}
