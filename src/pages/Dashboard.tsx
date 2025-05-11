import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, Timestamp, TitleItem, SectionItem } from "../types/task";
import { TrashBinTrash, Pen, CheckCircle, Record } from "solar-icon-set";

type ListItem = Task | Timestamp | TitleItem | SectionItem;

type DragState = {
  item: ListItem;
  sourceIndex: number;
  currentIndex: number;
  position: "before" | "after";
};

export function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
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
  const [currentDate, setCurrentDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const [hideCompleted, setHideCompleted] = useState(false);
  const [completedPosition, setCompletedPosition] = useState<
    "top" | "bottom" | "mixed"
  >("mixed");
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

  // Add allItems state
  const [allItems, setAllItems] = useState<ListItem[]>([]);

  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  const isTask = (item: ListItem): item is Task => {
    return "completed" in item;
  };

  // Filter tasks based on hideCompleted state
  const filteredTasks = tasks.filter(
    (task) => !hideCompleted || !task.completed
  );

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
        console.log(
          "Fetching temperature for coordinates:",
          latitude,
          longitude
        );
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

        console.log("Fetching from URL:", url.toString());

        const response = await fetch(url);
        const data = await response.json();
        console.log("Weather API response:", data);

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
      console.log("Geolocation is available");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got position:", position);
          fetchTemperature(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.log("Geolocation is not available");
    }
  }, []);

  const getWeatherIcon = (condition: string | null) => {
    if (!condition) return null;

    const iconMap: { [key: string]: JSX.Element } = {
      Clear: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      Clouds: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      ),
      Rain: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
      Snow: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l-2 2m0 0l-2-2m2 2V10"
          />
        </svg>
      ),
      Thunderstorm: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      Drizzle: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
      Mist: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
    };

    return iconMap[condition] || null;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        console.log("No user logged in, skipping data load");
        setLoading(false);
        return;
      }

      console.log("Starting data load for user:", currentUser.uid);
      try {
        setLoading(true);
        const [userTasks, userSections] = await Promise.all([
          taskService.getUserTasks(currentUser.uid),
          taskService.getUserSections(currentUser.uid),
        ]);

        console.log("Raw data loaded:", {
          tasks: userTasks,
          sections: userSections,
        });

        // Sort tasks by order or creation date
        const sortedTasks = [...userTasks].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        // Sort sections by order
        const sortedSections = [...userSections].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        console.log("Sorted data:", {
          tasks: sortedTasks,
          sections: sortedSections,
        });

        setTasks(sortedTasks);
        setSections(sortedSections);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await taskService.toggleTaskCompletion(taskId, completed);
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAddTask = async () => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    if (!newTaskTitle.trim()) return;

    try {
      console.log("Attempting to create new task for user:", currentUser.uid);
      const newTask = await taskService.createTask(currentUser.uid, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        scheduledTime: new Date().toLocaleString(),
        completed: false,
      });
      console.log("Task created successfully:", newTask);
      setTasks((prevTasks) => [newTask, ...prevTasks]);
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
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
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
      console.log("Attempting to delete task:", taskId);
      await taskService.deleteTask(taskId);
      console.log("Task deleted successfully");
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
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

  const handleAddTimestamp = async () => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    const formattedTime = formatTimeFromInput(newTimestampTime);
    if (!formattedTime) {
      console.error("Invalid time format");
      return;
    }

    try {
      console.log("Creating new timestamp:", formattedTime);
      const newTimestamp = await taskService.createTimestamp(
        currentUser.uid,
        formattedTime
      );
      console.log("Timestamp created:", newTimestamp);
      setTimestamps((prev) => [...prev, newTimestamp]);
      setNewTimestampTime("");
    } catch (error) {
      console.error("Error creating timestamp:", error);
    }
  };

  const handleDeleteTimestamp = async (timestampId: string) => {
    try {
      await taskService.deleteTimestamp(timestampId);
      setTimestamps(timestamps.filter((ts) => ts.id !== timestampId));
      setIsCreatingTimestamp(false);
    } catch (error) {
      console.error("Error deleting timestamp:", error);
    }
  };

  const handleAddTitle = async (text: string) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    try {
      console.log("Creating new title:", text);
      const newTitle = await taskService.createTitle(currentUser.uid, text);
      console.log("Title created:", newTitle);
      setTitles((prev) => [...prev, newTitle]);
      setNewTitleText("");
    } catch (error) {
      console.error("Error creating title:", error);
    }
  };

  const handleTitleEdit = async (titleId: string, newText: string) => {
    try {
      await taskService.updateTitle(titleId, { text: newText });
      setTitles(
        titles.map((title) =>
          title.id === titleId ? { ...title, text: newText } : title
        )
      );
      setEditingTitle(null);
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const handleTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    titleId: string
  ) => {
    if (e.key === "Enter") {
      handleTitleEdit(titleId, e.currentTarget.value);
    } else if (e.key === "Escape") {
      setEditingTitle(null);
    }
  };

  const handleTitleBlur = (titleId: string, currentText: string) => {
    handleTitleEdit(titleId, currentText);
  };

  const handleDeleteTitle = async (titleId: string) => {
    try {
      await taskService.deleteTitle(titleId);
      setTitles(titles.filter((title) => title.id !== titleId));
    } catch (error) {
      console.error("Error deleting title:", error);
    }
  };

  const [focusedInput, setFocusedInput] = useState<
    "task" | "timestamp" | "title" | "section" | null
  >(null);

  const handleDragStart = (
    e: React.DragEvent,
    item: ListItem,
    index: number
  ) => {
    console.log("Drag Start:", {
      item,
      index,
      itemType:
        "time" in item ? "timestamp" : "type" in item ? "title" : "task",
    });
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

    console.log("Drag Over:", {
      index,
      position,
      mouseY,
      rectTop: rect.top,
      rectHeight: rect.height,
      currentDragState: dragState,
    });

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

    console.log("Drop:", {
      sourceIndex,
      targetIndex,
      position,
      item,
      itemType: isSection(item) ? "section" : isTask(item) ? "task" : "other",
    });

    // Create new array with reordered items
    const newItems = [...allItems];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update local state immediately
    const newSections = newItems
      .filter(
        (item): item is SectionItem =>
          "type" in item &&
          item.type === "section" &&
          "text" in item &&
          "time" in item
      )
      .map((section, index) => ({ ...section, order: index }));
    const newTasks = newItems
      .filter(
        (item): item is Task =>
          "title" in item &&
          "description" in item &&
          "scheduledTime" in item &&
          "completed" in item
      )
      .map((task, index) => ({ ...task, order: index }));

    // Update state with the correct types
    setSections(newSections);
    setTasks(newTasks);
    setDragState(null);
    setPreviewAnimation(null);
    setIsDragging(false);

    // Save the new order to the database
    try {
      if (currentUser) {
        const taskUpdates = newTasks.map((task) => ({
          id: task.id,
          order: task.order,
        }));
        const sectionUpdates = newSections.map((section) => ({
          id: section.id,
          order: section.order,
        }));

        console.log("Updating Orders:", {
          tasks: taskUpdates,
          sections: sectionUpdates,
        });

        await Promise.all([
          taskService.updateTaskOrder(currentUser.uid, taskUpdates),
          taskService.updateSectionOrder(currentUser.uid, sectionUpdates),
        ]);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      // Revert state changes if the database update fails
      setSections(sections);
      setTasks(tasks);
    }
  };

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("State Changed:", {
      timestamps: timestamps.map((t) => ({ id: t.id, order: t.order })),
      titles: titles.map((t) => ({ id: t.id, order: t.order })),
      sections: sections.map((s) => ({ id: s.id, order: s.order })),
      tasks: tasks.map((t) => ({ id: t.id, order: t.order })),
    });
  }, [timestamps, titles, sections, tasks]);

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

    const title = newTitleText.trim();
    const time = formatTimeFromInput(newTimestampTime.trim());

    if (!title || !time) {
      console.log("Missing required fields:", { title, time });
      return;
    }

    try {
      console.log(
        "Attempting to create new section for user:",
        currentUser.uid
      );
      const newSection = await taskService.createSection(currentUser.uid, {
        text: title,
        time: time,
      });
      console.log("Section created successfully:", newSection);

      // Update sections state immediately
      setSections((prevSections) => {
        const updatedSections = [
          newSection,
          ...prevSections.map((section) => ({
            ...section,
            order: (section.order ?? 0) + 1,
          })),
        ];
        console.log("Updated sections:", updatedSections);
        return updatedSections;
      });

      // Update allItems state to include the new section
      setAllItems((prevItems) => {
        const updatedItems = [
          newSection,
          ...prevItems.map((item) => ({
            ...item,
            order: (item.order ?? 0) + 1,
          })),
        ];
        console.log("Updated allItems:", updatedItems);
        return updatedItems;
      });

      // Clear input fields
      setNewTitleText("");
      setNewTimestampTime("");

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
      // Format the time before adding the section
      const formattedTime = formatTimeFromInput(newTimestampTime);
      setNewTimestampTime(formattedTime);
      handleAddSection();
    } else if (e.key === "Escape") {
      setIsCreatingSection(false);
      setNewTitleText("");
      setNewTimestampTime("");
    }
  };

  // Add handleDeleteSection function
  const handleDeleteSection = async (sectionId: string) => {
    try {
      await taskService.deleteSection(sectionId);
      setSections(sections.filter((section) => section.id !== sectionId));
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  // Add type guard for SectionItem
  const isSection = (item: ListItem): item is SectionItem => {
    return "type" in item && item.type === "section";
  };

  // Add debug logging for allItems
  useEffect(() => {
    console.log("Current state:", {
      tasks: tasks,
      sections: sections,
      filteredTasks: tasks.filter((task) => !hideCompleted || !task.completed),
    });
  }, [tasks, sections, hideCompleted]);

  // Update the allItems calculation
  useEffect(() => {
    console.log("Calculating allItems with:", {
      tasks: tasks,
      sections: sections,
      hideCompleted: hideCompleted,
    });

    // Filter tasks based on hideCompleted state
    const filteredTasks = hideCompleted
      ? tasks.filter((task) => !task.completed)
      : tasks;

    // Combine and sort all items
    const sortedItems = [...filteredTasks, ...sections].sort((a, b) => {
      // If both items have order, use that
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // If only one has order, prioritize the one with order
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // If neither has order, maintain relative positions
      return 0;
    });

    // Update orders to ensure they are sequential
    const updatedItems = sortedItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    console.log("Final sorted items:", updatedItems);
    setAllItems(updatedItems);
  }, [tasks, sections, hideCompleted]);

  // Add handleEditSection function
  const handleEditSection = async (
    sectionId: string,
    updates: Partial<SectionItem>
  ) => {
    try {
      await taskService.updateSection(sectionId, updates);
      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, ...updates } : section
        )
      );
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const formatTimeDisplay = (time: string): string => {
    // Convert HH:mm to HH.mm
    return time.replace(":", ".");
  };

  // Update section rendering
  const renderSection = (item: SectionItem) => (
    <div className="p-4 bg-neu-800 rounded-lg flex items-center justify-between">
      <div className="flex-1">
        {editingTitle === item.id ? (
          <input
            ref={titleInputRef}
            type="text"
            defaultValue={item.text}
            className="flex-1 bg-transparent text-xl font-semibold text-neu-100 focus:outline-none"
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
            }}
            autoFocus
          />
        ) : (
          <div
            className="flex-1 cursor-pointer flex items-center"
            onDoubleClick={() => {
              setEditingTitle(item.id);
              setEditingTime(null);
            }}
          >
            <h3 className="text-xl font-semibold text-neu-100">{item.text}</h3>
          </div>
        )}
      </div>
      <div className="mx-4">
        {editingTime === item.id ? (
          <input
            type="text"
            value={item.time}
            onChange={(e) => {
              // Allow any input while typing, just clean invalid characters
              const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
              setSections(
                sections.map((section) =>
                  section.id === item.id
                    ? { ...section, time: cleaned }
                    : section
                )
              );
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
              const formattedTime = formatTimeFromInput(e.currentTarget.value);
              handleEditSection(item.id, { time: formattedTime });
              setEditingTime(null);
            }}
            className="flex-1 bg-transparent text-xl font-semibold text-neu-100 focus:outline-none w-20 text-center"
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
            <h3 className="text-xl font-semibold text-neu-100">{item.time}</h3>
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-neu-100">{dayOfWeek}</h1>
            <span className="text-2xl text-neu-400 uppercase">
              {currentDate}
            </span>
          </div>
          {temperature !== null && (
            <div className="flex items-center gap-2">
              {getWeatherIcon(weatherCondition)}
              <span className="text-2xl text-neu-100">{temperature}°C</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
              focusedInput === "task" ? "ring-2 ring-pri-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pri-blue-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-neu-100"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <input
                  ref={taskInputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setFocusedInput("task")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Add new task..."
                  className="w-full bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                  autoFocus
                />
                <p className="text-neu-400 text-sm">Press Enter to add</p>
              </div>
            </div>
          </div>

          <div
            className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
              focusedInput === "section" ? "ring-2 ring-pri-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sup-war-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-neu-100"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-4">
                  <input
                    ref={sectionInputRef}
                    type="text"
                    value={newTitleText}
                    onChange={(e) => setNewTitleText(e.target.value)}
                    onKeyDown={handleSectionKeyPress}
                    onFocus={() => setFocusedInput("section")}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Add a section..."
                    className="flex-1 bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newTimestampTime}
                    onChange={(e) => {
                      // Allow any input while typing, just clean invalid characters
                      const cleaned = e.target.value.replace(
                        /[^0-9.,:;-]/g,
                        ""
                      );
                      setNewTimestampTime(cleaned);
                    }}
                    onKeyDown={handleSectionKeyPress}
                    placeholder="Time"
                    className="w-32 bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                  />
                </div>
                <p className="text-neu-400 text-sm mt-1">Press Enter to add</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Tasks with Timestamps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-8">
              <h2 className="text-2xl font-semibold text-neu-100">
                Todays tasks
              </h2>
              <div className="hidden 2xl:flex items-center gap-2">
                <div className="w-[300px] h-2 bg-neu-700 rounded-full">
                  <div
                    className="h-full bg-sup-suc-500 rounded-full"
                    style={{
                      width: `${
                        tasks.length > 0
                          ? (tasks.filter((task) => task.completed).length /
                              tasks.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-neu-400">
                  {tasks.length > 0
                    ? Math.round(
                        (tasks.filter((task) => task.completed).length /
                          tasks.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
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
              <button
                onClick={() => setHideCompleted(!hideCompleted)}
                className="px-4 py-2 bg-neu-800 text-neu-100 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2"
              >
                {hideCompleted ? (
                  <>
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>Show Completed</span>
                  </>
                ) : (
                  <>
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                    <span>Hide Completed</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-neu-400">Loading tasks...</div>
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

              {/* Add Timestamp Input */}
              {isCreatingTimestamp && (
                <div className="p-4 bg-neu-800 rounded-lg flex items-center space-x-4">
                  <input
                    type="time"
                    value={newTimestampTime}
                    onChange={(e) => setNewTimestampTime(e.target.value)}
                    className="p-2 bg-neu-700 rounded text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                  />
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      try {
                        const newTimestamp = await taskService.createTimestamp(
                          currentUser.uid,
                          newTimestampTime || "09:00"
                        );
                        setTimestamps([...timestamps, newTimestamp]);
                        setNewTimestampTime("");
                        setIsCreatingTimestamp(false);
                      } catch (error) {
                        console.error("Error creating timestamp:", error);
                      }
                    }}
                    className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingTimestamp(false);
                      setNewTimestampTime("");
                    }}
                    className="px-4 py-2 bg-neu-700 text-neu-100 rounded hover:bg-neu-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* List of items */}
              <div className="space-y-4">
                {allItems.length === 0 ? (
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
                  allItems.map((item, index) => {
                    const isHidden =
                      hideCompleted && isTask(item) && item.completed;
                    return (
                      <div
                        key={item.id}
                        className="relative"
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
                          {isSection(item) ? (
                            renderSection(item)
                          ) : "time" in item ? (
                            // Timestamp
                            <div className="flex items-center space-x-4 p-4 bg-neu-800 rounded-lg">
                              <div className="flex-1 h-px bg-neu-700 transition-all duration-300"></div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={item.time}
                                  onChange={(e) => {
                                    setTimestamps(
                                      timestamps.map((ts) =>
                                        ts.id === item.id
                                          ? { ...ts, time: e.target.value }
                                          : ts
                                      )
                                    );
                                  }}
                                  onBlur={async (e) => {
                                    try {
                                      await taskService.updateTimestamp(
                                        item.id,
                                        { time: e.target.value }
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error updating timestamp:",
                                        error
                                      );
                                      // Revert to original value on error
                                      setTimestamps(
                                        timestamps.map((ts) =>
                                          ts.id === item.id
                                            ? { ...ts, time: item.time }
                                            : ts
                                        )
                                      );
                                    }
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      try {
                                        await taskService.updateTimestamp(
                                          item.id,
                                          { time: e.currentTarget.value }
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Error updating timestamp:",
                                          error
                                        );
                                        // Revert to original value on error
                                        setTimestamps(
                                          timestamps.map((ts) =>
                                            ts.id === item.id
                                              ? { ...ts, time: item.time }
                                              : ts
                                          )
                                        );
                                      }
                                    }
                                  }}
                                  className="p-2 bg-neu-700 rounded text-neu-100"
                                />
                                <button
                                  onClick={() => handleDeleteTimestamp(item.id)}
                                  className="p-2 text-neu-400 hover:text-red-500 transition-colors duration-200"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex-1 h-px bg-neu-700 transition-all duration-300"></div>
                            </div>
                          ) : "type" in item && item.type === "title" ? (
                            // Title rendering
                            <div className="p-4 bg-neu-800 rounded-lg flex items-center justify-between">
                              {editingTitle === item.id ? (
                                <input
                                  ref={titleInputRef}
                                  type="text"
                                  defaultValue={item.text}
                                  className="flex-1 bg-transparent text-xl font-semibold text-neu-100 focus:outline-none"
                                  onKeyDown={(e) =>
                                    handleTitleKeyDown(e, item.id)
                                  }
                                  onBlur={(e) =>
                                    handleTitleBlur(item.id, e.target.value)
                                  }
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="flex-1 cursor-pointer flex items-center"
                                  onDoubleClick={() => setEditingTitle(item.id)}
                                >
                                  <h3 className="text-xl font-semibold text-neu-100">
                                    {item.text}
                                  </h3>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingTitle(item.id)}
                                  className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center"
                                >
                                  <Pen
                                    size={24}
                                    color="currentColor"
                                    autoSize={false}
                                  />
                                </button>
                                <button
                                  onClick={() => handleDeleteTitle(item.id)}
                                  className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center"
                                >
                                  <TrashBinTrash
                                    size={24}
                                    color="currentColor"
                                    autoSize={false}
                                  />
                                </button>
                              </div>
                            </div>
                          ) : isTask(item) ? (
                            // Task rendering
                            <div
                              className={`p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
                                item.completed
                                  ? "bg-sup-suc-300 bg-opacity-75"
                                  : "bg-neu-800 text-neu-900"
                              }`}
                            >
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="flex items-center justify-center h-full">
                                  <button
                                    onClick={() =>
                                      handleTaskCompletion(
                                        item.id,
                                        !item.completed
                                      )
                                    }
                                    className={`transition-colors duration-200 flex items-center justify-center ${
                                      item.completed
                                        ? "text-sup-suc-900 hover:text-sup-suc-800"
                                        : "text-pri-blue-500 hover:text-sup-suc-500"
                                    }`}
                                  >
                                    {item.completed ? (
                                      <CheckCircle
                                        size={32}
                                        color="currentColor"
                                        autoSize={false}
                                      />
                                    ) : (
                                      <Record
                                        size={32}
                                        color="currentColor"
                                        autoSize={false}
                                      />
                                    )}
                                  </button>
                                </div>
                                {editingTask?.id === item.id ? (
                                  <div className="flex-1 flex items-center justify-between">
                                    <div className="flex-1">
                                      <input
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
                                        className="w-full bg-transparent text-lg font-semibold text-neu-100 focus:outline-none"
                                        autoFocus
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
                                            ? "text-sup-suc-900 hover:text-sup-suc-800"
                                            : "text-neu-400 hover:text-neu-100"
                                        }`}
                                      >
                                        <Pen
                                          size={24}
                                          color="currentColor"
                                          autoSize={false}
                                        />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteTask(item.id)
                                        }
                                        className={`p-2 ${
                                          item.completed
                                            ? "text-sup-suc-900 hover:text-sup-suc-800"
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
                                      className={`text-lg font-semibold ${
                                        item.completed
                                          ? "text-sup-suc-900 line-through"
                                          : "text-neu-100"
                                      }`}
                                    >
                                      {item.title}
                                    </h3>
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
                                          ? "text-sup-suc-900 hover:text-sup-suc-800"
                                          : "text-neu-400 hover:text-neu-100"
                                      }`}
                                    >
                                      <Pen
                                        size={24}
                                        color="currentColor"
                                        autoSize={false}
                                      />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(item.id)}
                                      className={`p-2 flex items-center justify-center ${
                                        item.completed
                                          ? "text-sup-suc-900 hover:text-sup-suc-800"
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
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Habit Progress */}
        <div>
          <h2 className="text-2xl font-semibold text-neu-100 mb-4">
            Habit Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-neu-800 rounded-lg">
              <h3 className="text-lg font-semibold text-neu-100 mb-2">
                Morning Exercise
              </h3>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1 h-2 bg-neu-700 rounded-full">
                  <div className="h-2 bg-pri-blue-500 rounded-full w-3/4"></div>
                </div>
                <span className="text-sm text-neu-400">75%</span>
              </div>
              <p className="text-neu-400">5/7 days this week</p>
            </div>

            <div className="p-6 bg-neu-800 rounded-lg">
              <h3 className="text-lg font-semibold text-neu-100 mb-2">
                Meditation
              </h3>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1 h-2 bg-neu-700 rounded-full">
                  <div className="h-2 bg-pri-blue-500 rounded-full w-[85%]"></div>
                </div>
                <span className="text-sm text-neu-400">85%</span>
              </div>
              <p className="text-neu-400">6/7 days this week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
