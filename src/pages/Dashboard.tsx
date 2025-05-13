import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, SectionItem } from "../types/task";
import {
  TrashBinTrash,
  Pen,
  CheckSquare,
  Record,
  Eye,
  EyeClosed,
  AddSquare,
  ClockSquare,
  CheckCircle,
  Sort,
  AlignBottom,
  AlignTop,
  AlignVerticalCenter,
  Settings,
} from "solar-icon-set";
import confetti from "canvas-confetti";

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
};

export function Dashboard() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
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

  // Add new drag and drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Add new state for preview animation
  const [previewAnimation, setPreviewAnimation] = useState<{
    index: number;
    direction: "up" | "down";
  } | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Add state to track items that are being hidden
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set());

  // Add new state for highlight setting
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });

  const isTask = (item: ListItem): item is Task => {
    return item.type === "task";
  };

  const isSection = (item: ListItem): item is SectionItem => {
    return item.type === "section";
  };

  // Filter and sort items based on hideCompleted and completedPosition
  const filteredAndSortedItems = items
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

  // Calculate completion percentage
  const completionPercentage =
    items.length > 0
      ? Math.round(
          (items.filter((item) => isTask(item) && item.completed).length /
            items.filter(isTask).length) *
            100
        )
      : 0;

  // Update date on mount and every day
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const day = now.getDate().toString().padStart(2, "0");
      const month = now.toLocaleString("default", { month: "short" });
      setCurrentDate(`${day} ${month}`);
      setDayOfWeek(now.toLocaleString("default", { weekday: "long" }));
    };

    updateDate();
    // Update at midnight
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      updateDate();
      // Set up daily updates
      setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

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

        setItems(allItems);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleTaskCompletion = async (
    taskId: string,
    completed: boolean,
    event: React.MouseEvent
  ) => {
    try {
      // Get the absolute position of the click relative to the viewport
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;

      // Only add completing class if we're completing the task (not uncompleting)
      if (completed) {
        const taskElement = event.currentTarget.closest(".task-item");
        if (taskElement) {
          taskElement.classList.add("task-completing");
        }
        // Wait for the completion animation to finish
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await taskService.toggleTaskCompletion(taskId, completed);
      setItems(
        items.map((item) =>
          isTask(item) && item.id === taskId ? { ...item, completed } : item
        )
      );

      // If hide completed is enabled, add the hiding class after completion animation
      if (hideCompleted && completed) {
        setHidingItems((prev) => new Set([...prev, taskId]));
        // Wait for the hiding animation to finish before updating state
        setTimeout(() => {
          setHidingItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        }, 300);
      }

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

  const handleAddTask = async () => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    if (!newTaskTitle.trim()) return;

    try {
      // Add today's date at noon for the new task
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const newTask = await taskService.createTask(currentUser.uid, {
        type: "task",
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        scheduledTime: today.toLocaleString(),
        completed: false,
        date: today.toISOString(),
      });

      setItems((prevItems) => [newTask, ...prevItems]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    } else if (e.key === "Escape") {
      setIsCreatingTask(false);
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
    setIsDragging(true);
    setDragState({
      item,
      sourceIndex: index,
      currentIndex: index,
      position: "after",
    });

    // Add a semi-transparent effect to the dragged item
    (e.target as HTMLElement).style.opacity = "0.4";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseY = e.clientY;
    const position = mouseY < rect.top + rect.height / 2 ? "before" : "after";

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
      }

      return {
        ...prev,
        currentIndex: index,
        position,
      };
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDragState(null);
    setPreviewAnimation(null);
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState) return;

    const { item, sourceIndex, position } = dragState;
    const targetIndex = position === "before" ? index : index + 1;

    // Create new array with reordered items
    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update orders to ensure they are sequential
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    // Update state immediately
    setItems(updatedItems);
    setDragState(null);
    setPreviewAnimation(null);
    setIsDragging(false);

    // Save the new order to the database
    try {
      if (currentUser) {
        const taskUpdates = updatedItems.filter(isTask).map((task) => ({
          id: task.id,
          order: task.order,
        }));
        const sectionUpdates = updatedItems
          .filter(isSection)
          .map((section) => ({
            id: section.id,
            order: section.order,
          }));

        await Promise.all([
          taskService.updateTaskOrder(currentUser.uid, taskUpdates),
          taskService.updateSectionOrder(currentUser.uid, sectionUpdates),
        ]);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      // Revert state changes if the database update fails
      setItems(items);
    }
  };

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("State Changed:", {
      items: items.map((item) => ({ id: item.id, order: item.order })),
    });
  }, [items]);

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
  const handleAddSection = async () => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    const title = newSectionTitle.trim();
    const time = formatTimeFromInput(newSectionTime.trim());

    if (!title || !time) {
      console.error("Missing required fields:", { title, time });
      return;
    }

    try {
      const newSection = await taskService.createSection(currentUser.uid, {
        text: title,
        time: time,
      });

      setItems((prevItems) => [newSection, ...prevItems]);
      setNewSectionTitle("");
      setNewSectionTime("");

      // Keep focus on the title input field
      if (sectionInputRef.current) {
        sectionInputRef.current.focus();
      }
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const handleSectionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSection();
    } else if (e.key === "Escape") {
      setIsCreatingTask(false);
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

  // Add debug logging for allItems
  useEffect(() => {
    console.log("Current state:", {
      items: items,
      filteredItems: items.filter(
        (item) => !hideCompleted || !isTask(item) || !item.completed
      ),
    });
  }, [items, hideCompleted]);

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

  // Add useEffect for handling click events
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Only handle non-input clicks at the document level
      if (target.tagName !== "INPUT") {
        console.log("Click event:", {
          target: target.tagName,
          className: target.className,
          isInput: target.tagName === "INPUT",
          eventPhase: e.eventPhase,
          currentTarget: e.currentTarget as HTMLElement,
        });
      }
    };

    document.addEventListener("click", handleClick, false);
    return () => {
      document.removeEventListener("click", handleClick, false);
    };
  }, []);

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
    <div className="p-4 bg-neu-900 rounded-lg flex items-center justify-between">
      <div className="flex-1">
        {editingTitle === item.id ? (
          <input
            ref={sectionInputRef}
            type="text"
            defaultValue={item.text}
            onChange={(e) => {}}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleEditSection(item.id, { text: e.currentTarget.value });
                setEditingTitle(null);
              } else if (e.key === "Escape") {
                setEditingTitle(null);
              }
            }}
            onBlur={(e) => {
              handleEditSection(item.id, { text: e.target.value });
              setEditingTitle(null);
              setFocusedInput(null);
            }}
            onClick={handleInputClick}
            onFocus={() => {
              setFocusedInput("section");
              console.log("Section edit input focused");
            }}
            style={inputStyles}
            className="flex-1 bg-transparent text-lg font-semibold text-pri-blue-500 focus:outline-none cursor-text"
            autoFocus
            tabIndex={0}
          />
        ) : (
          <div
            className="flex-1 cursor-pointer flex items-center"
            onDoubleClick={() => {
              setEditingTitle(item.id);
              setEditingTime(null);
            }}
          >
            <h3 className="text-lg font-outfit font-semibold text-neu-300">
              {item.text}
            </h3>
          </div>
        )}
      </div>
      <div className="mx-4">
        {editingTime === item.id ? (
          <input
            type="text"
            defaultValue={item.time}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
              // Only update the current section's time
              handleEditSection(item.id, { time: cleaned });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const formattedTime = formatTimeFromInput(
                  e.currentTarget.value
                );
                handleEditSection(item.id, { time: formattedTime });
                setEditingTime(null);
              } else if (e.key === "Escape") {
                setEditingTime(null);
              }
            }}
            onBlur={(e) => {
              const formattedTime = formatTimeFromInput(e.target.value);
              handleEditSection(item.id, { time: formattedTime });
              setEditingTime(null);
            }}
            className="flex-1 bg-transparent text-md text-neu-200 font-semibold focus:outline-none w-16 text-center"
            autoFocus
          />
        ) : (
          <div
            className="flex-1 cursor-pointer flex items-center"
            onDoubleClick={() => {
              setEditingTime(item.id);
              setEditingTitle(null);
            }}
          >
            <h3 className="text-md text-neu-400 font-semibold">{item.time}</h3>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setEditingTitle(item.id);
            setEditingTime(null);
          }}
          className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center"
        >
          <Pen size={24} color="currentColor" autoSize={false} />
        </button>
        <button
          onClick={() => handleDeleteSection(item.id)}
          className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center"
        >
          <TrashBinTrash size={24} color="currentColor" autoSize={false} />
        </button>
      </div>
    </div>
  );

  // Modify the renderTask function
  const renderTask = (item: Task) => {
    const isNextTask =
      highlightNextTask &&
      !item.completed &&
      items.filter((i) => isTask(i) && !i.completed).indexOf(item) === 0;

    return (
      <div
        key={item.id}
        data-task-id={item.id}
        className={`task-item p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
          item.completed ? "bg-sup-suc-400 bg-opacity-50" : "bg-neu-800"
        } ${
          isNextTask
            ? "highlighted-task ring-2 ring-pri-blue-500 ring-opacity-60"
            : ""
        }`}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={(e) => handleTaskCompletion(item.id, !item.completed, e)}
              className={`transition-all duration-300 flex items-center justify-center ${
                item.completed
                  ? "text-neu-100 hover:text-neu-100 scale-95"
                  : "text-pri-blue-500 hover:text-sup-suc-500 hover:scale-95"
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
          {editingTask?.id === item.id ? (
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1">
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
                  onClick={handleInputClick}
                  style={inputStyles}
                  className="w-full bg-transparent text-base font-outfit font-semibold text-pri-blue-500 focus:outline-none cursor-text"
                  autoFocus
                  tabIndex={0}
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleEditTask(item.id, {
                      title: editingTask.title,
                    })
                  }
                  className={`p-2 ${
                    item.completed
                      ? "text-neu-100 hover:text-neu-100"
                      : "text-neu-400 hover:text-neu-100"
                  }`}
                >
                  <Pen size={24} color="currentColor" autoSize={false} />
                </button>
                <button
                  onClick={() => handleDeleteTask(item.id)}
                  className={`p-2 ${
                    item.completed
                      ? "text-neu-100 hover:text-neu-100"
                      : "text-neu-400 hover:text-red-500"
                  }`}
                >
                  <TrashBinTrash
                    size={24}
                    color="currentColor"
                    autoSize={false}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 cursor-pointer"
              onDoubleClick={() => setEditingTask(item)}
            >
              <h3
                className={`text-base font-outfit font-semibold transition-all duration-300 ${
                  item.completed ? "text-neu-100 scale-95" : "text-neu-100"
                }`}
              >
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs font-outfit text-neu-400">
                  {item.description}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {editingTask?.id !== item.id && (
            <>
              <button
                onClick={() => setEditingTask(item)}
                className={`p-2 flex items-center justify-center ${
                  item.completed
                    ? "text-neu-100 hover:text-neu-100"
                    : "text-neu-400 hover:text-neu-100"
                }`}
              >
                <Pen size={24} color="currentColor" autoSize={false} />
              </button>
              <button
                onClick={() => handleDeleteTask(item.id)}
                className={`p-2 flex items-center justify-center ${
                  item.completed
                    ? "text-neu-100 hover:text-neu-100"
                    : "text-neu-400 hover:text-red-500"
                }`}
              >
                <TrashBinTrash
                  size={24}
                  color="currentColor"
                  autoSize={false}
                />
              </button>
            </>
          )}
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

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .task-item {
      transition: all 0.3s ease-in-out;
    }

    .task-item.hiding {
      animation: slideOut 0.3s ease-in-out forwards;
    }

    .task-item.showing {
      animation: slideIn 0.3s ease-in-out forwards;
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
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
      }
      70% {
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }

    .highlighted-task {
      animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
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
    }

    .task-completing::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(34, 197, 94, 0.5);
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
  `;

  // Modify the hide completed handler
  const handleHideCompleted = () => {
    const completedTasks = items
      .filter((item) => isTask(item) && item.completed)
      .map((item) => item.id);

    setHidingItems(new Set(completedTasks));

    // Wait for animation to complete before updating state
    setTimeout(() => {
      const newState = !hideCompleted;
      setHideCompleted(newState);
      localStorage.setItem("hideCompleted", JSON.stringify(newState));
      setHidingItems(new Set());
    }, 300); // Match the animation duration
  };

  // Update the input styles to use explicit values instead of inherit
  const inputStyles = {
    width: "100%",
    height: "auto",
    minHeight: "24px",
  };

  // Add function to handle highlight setting change
  const handleHighlightNextTask = (value: boolean) => {
    setHighlightNextTask(value);
    localStorage.setItem("highlightNextTask", JSON.stringify(value));
  };

  // Add effect to listen for changes to the highlight setting
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem("highlightNextTask");
      setHighlightNextTask(savedState ? JSON.parse(savedState) : true);
    };

    const handleHighlightChange = () => {
      const savedState = localStorage.getItem("highlightNextTask");
      setHighlightNextTask(savedState ? JSON.parse(savedState) : true);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("highlightNextTaskChanged", handleHighlightChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "highlightNextTaskChanged",
        handleHighlightChange
      );
    };
  }, []);

  return (
    <>
      <style>{globalStyles}</style>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Box */}
          <div className="bg-neu-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold font-outfit text-neu-100">
                  {dayOfWeek}
                </h1>
                <span className="text-2xl font-outfit text-neu-400 uppercase">
                  {currentDate}
                </span>
              </div>
              {temperature !== null && (
                <div className="flex items-center gap-2">
                  {getWeatherIcon(weatherCondition)}
                  <span className="text-2xl font-outfit text-neu-100">
                    {temperature}°C
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
                  focusedInput === "task" ? "ring-2 ring-pri-blue-500" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-pri-blue-500 rounded-lg flex items-center justify-center">
                    <AddSquare
                      size={32}
                      color="#fff"
                      autoSize={false}
                      iconStyle="Broken"
                    />
                  </div>
                  <div className="text-left font-outfit text-md flex-1">
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onFocus={() => setFocusedInput("task")}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="Add new task..."
                      className="w-full bg-transparent font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-neu-400 text-sm font-outfit mt-2">
                      Press Enter to add
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
                  focusedInput === "section" ? "ring-2 ring-pri-blue-500" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-sup-war-500 rounded-lg flex items-center justify-center">
                    <ClockSquare
                      size={32}
                      color="#fff"
                      autoSize={false}
                      iconStyle="Broken"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center text-md font-outfit gap-4">
                      <input
                        ref={sectionInputRef}
                        type="text"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        onKeyDown={handleSectionKeyPress}
                        onFocus={() => setFocusedInput("section")}
                        onBlur={() => setFocusedInput(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        placeholder="Add a section..."
                        className="flex-1 bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newSectionTime}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(
                            /[^0-9.,:;-]/g,
                            ""
                          );
                          setNewSectionTime(cleaned);
                        }}
                        onKeyDown={handleSectionKeyPress}
                        placeholder="09.00"
                        className="w-32 bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                      />
                    </div>
                    <p className="text-neu-400 font-outfit text-sm mt-2">
                      Press Enter to add
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Box */}
          <div className="bg-neu-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-8">
                <h2 className="text-2xl font-outfit font-semibold text-neu-100">
                  Today
                </h2>
                <div className="hidden 2xl:flex items-center gap-2">
                  <div className="w-[300px] h-2 bg-neu-700 rounded-full">
                    <div
                      className="h-full bg-sup-suc-500 rounded-full"
                      style={{
                        width: `${completionPercentage}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-base font-outfit text-neu-400">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="px-4 py-2 bg-neu-900 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
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
                          className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 ${
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
                          className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 ${
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
                          className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 ${
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
                      className="px-4 py-2 bg-neu-900 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-within:ring-2 focus-within:ring-pri-blue-500 cursor-pointer"
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
                </div>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className="text-neu-400 text-md">Loading tasks...</div>
            ) : (
              <div className="space-y-4">
                {/* New Task Input */}
                {isCreatingTask && (
                  <div className="p-4 bg-neu-800 rounded-lg flex flex-col space-y-4">
                    <input
                      ref={taskInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Enter task title"
                      className="w-full p-2 bg-neu-700 rounded text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                      autoFocus
                    />
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Enter task description (optional)"
                      className="w-full p-2 bg-neu-700 rounded text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddTask}
                        className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingTask(false);
                          setNewTaskTitle("");
                          setNewTaskDescription("");
                        }}
                        className="px-4 py-2 bg-neu-700 text-neu-100 rounded hover:bg-neu-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* List of items */}
                <div className="space-y-4">
                  {filteredAndSortedItems.length === 0 ? (
                    <div className="space-y-6">
                      <div className="text-center text-neu-400 py-8">
                        <p className="text-lg mb-2">
                          There are no tasks for today
                        </p>
                        <p className="text-sm">Add a task to get started</p>
                      </div>
                      <div className="p-4 rounded-lg border-2 border-dashed border-neu-700 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-neu-600"></div>
                          </div>
                          <div className="flex-1">
                            <div className="h-6 w-48 bg-neu-700 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded bg-neu-700"></div>
                          <div className="w-8 h-8 rounded bg-neu-700"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredAndSortedItems.map((item, index) => {
                      const isTaskItem = isTask(item);
                      const isHidden =
                        hideCompleted && isTaskItem && item.completed;
                      const isHiding = hidingItems.has(item.id);

                      // Don't return null, let the animation handle visibility
                      return (
                        <div
                          key={item.id}
                          className={`relative task-item ${
                            isHiding ? "hiding" : "showing"
                          }`}
                          style={{
                            display: isHidden && !isHiding ? "none" : "block",
                          }}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          {/* Drop indicator */}
                          {dragState?.currentIndex === index && (
                            <div
                              className={`absolute left-0 right-0 h-1 bg-pri-blue-500 rounded-full transition-all duration-200 ${
                                dragState.position === "before"
                                  ? "-top-1"
                                  : "-bottom-1"
                              }`}
                              style={{
                                transform:
                                  dragState.position === "before"
                                    ? "translateY(-50%)"
                                    : "translateY(50%)",
                              }}
                            />
                          )}

                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item, index)}
                            onDragEnd={handleDragEnd}
                            className={`transition-all duration-200 ${
                              isDragging ? "cursor-grabbing" : "cursor-grab"
                            } ${
                              previewAnimation?.index === index
                                ? previewAnimation.direction === "up"
                                  ? "translate-y-[-100%]"
                                  : "translate-y-[100%]"
                                : ""
                            }`}
                          >
                            {isSection(item)
                              ? renderSection(item)
                              : isTaskItem
                              ? renderTask(item)
                              : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
