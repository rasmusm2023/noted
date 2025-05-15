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
  ClockSquare,
  Sort,
  AlignTop,
  AlignBottom,
  AlignVerticalCenter,
} from "solar-icon-set";
import confetti from "canvas-confetti";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TaskModal } from "../components/TaskModal/TaskModal";
import { SectionModal } from "../components/SectionModal/SectionModal";

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

// Add new types for drag and drop
type DragItem = {
  id: string;
  type: string;
  index: number;
  item: ListItem;
  dayIndex: number;
};

export function Next7Days() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(
    null
  );
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
    "top" | "bottom" | "custom"
  >(() => {
    const savedPosition = localStorage.getItem("completedPosition");
    return (savedPosition as "top" | "bottom" | "custom") || "custom";
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
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"task" | "section" | null>(
    null
  );
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });

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
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
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
        setIsLoading(false);
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
          completedPosition === "custom" &&
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
      setCompletedPosition(savedPosition as "top" | "bottom" | "custom");
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

  const renderTask = (item: Task, dayIndex: number) => {
    // Find the first uncompleted task across all days
    const firstUncompletedTask = days.reduce<Task | null>((found, day) => {
      if (found) return found; // If we already found a task, keep it
      return (day.items.find((i) => isTask(i) && !i.completed) as Task) || null;
    }, null);

    // A task is highlighted if it's the first uncompleted task and highlightNextTask is enabled
    const isNextTask =
      highlightNextTask && firstUncompletedTask?.id === item.id;

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
            : "bg-neu-800"
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
                className={`text-base font-outfit font-regular transition-all duration-300 ${
                  item.completed ? "text-neu-100 scale-95" : "text-neu-100"
                }`}
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
                    className="w-full bg-transparent text-base font-outfit font-semibold text-neu-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-blue-500 transition-colors duration-200"
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
                        className={`font-outfit text-sm ${
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
                  size={16}
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

  const renderSection = (item: SectionItem) => (
    <div
      className={`p-4 ${
        item.backgroundColor || "bg-neu-900"
      } rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pri-blue-500`}
      tabIndex={0}
      onClick={() => setSelectedSection(item)}
    >
      <div className="flex-1">
        <h3 className="text-md font-outfit font-semibold text-neu-300">
          {item.text}
        </h3>
      </div>
      <div className="mx-4">
        <h3 className="text-base font-outfit font-semibold text-neu-400">
          {item.time.replace(":", ".")}
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSection(item.id);
          }}
          className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Delete section "${item.text}"`}
        >
          <TrashBinTrash size={16} color="currentColor" autoSize={false} />
        </button>
      </div>
    </div>
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

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
            className="p-1 bg-pri-blue-700 rounded-sm hover:bg-pri-blue-600 transition-colors flex items-center justify-center"
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
              className="w-full bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-medium focus:outline-none"
            />
            <p className="text-xs font-outfit text-neu-600 mt-0.5">
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

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalTitle(e.target.value);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
      setLocalTime(cleaned);
    };

    const handleAddSection = async () => {
      if (isSubmitting) return;

      if (!currentUser) {
        console.error("No user logged in");
        return;
      }

      const title = localTitle.trim();
      const time = formatTimeFromInput(localTime.trim());

      if (!title || !time) {
        console.error("Missing required fields:", { title, time });
        return;
      }

      try {
        setIsSubmitting(true);
        const newSection = await taskService.createSection(currentUser.uid, {
          text: title,
          time: time,
        });

        setDays((prevDays) => {
          const newDays = prevDays.map((day, idx) => {
            if (idx === dayIndex) {
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
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddSection();
      } else if (e.key === "Escape") {
        setLocalTitle("");
        setLocalTime("");
      }
    };

    return (
      <div className="flex items-center space-x-2 bg-neu-900/50 rounded-md p-2">
        <button
          onClick={handleAddSection}
          disabled={isSubmitting}
          className="p-1 bg-sup-war-500 rounded-sm hover:bg-sup-war-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ClockSquare
            size={20}
            color="#fff"
            autoSize={false}
            iconStyle="Broken"
          />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <input
              ref={titleInputRef}
              type="text"
              value={localTitle}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a section..."
              className="w-[calc(100%-4rem)] bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-medium focus:outline-none"
            />
            <input
              ref={timeInputRef}
              type="text"
              value={localTime}
              onChange={handleTimeChange}
              onKeyDown={handleKeyDown}
              placeholder="09.00"
              className="w-12 bg-transparent text-sm font-outfit text-neu-100 placeholder-neu-400 placeholder:font-medium focus:outline-none text-right"
            />
          </div>
          <p className="text-xs font-outfit text-neu-600 mt-0.5">
            Press Enter to add
          </p>
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

  // Modify the hide completed handler
  const handleHideCompleted = () => {
    const completedTasks = days.flatMap((day) =>
      day.items
        .filter((item) => isTask(item) && item.completed)
        .map((item) => item.id)
    );

    setHidingItems(new Set(completedTasks));

    // Wait for animation to complete before updating state
    setTimeout(() => {
      const newState = !hideCompleted;
      setHideCompleted(newState);
      localStorage.setItem("hideCompleted", JSON.stringify(newState));
      setHidingItems(new Set());
    }, 300); // Match the animation duration
  };

  // Update the moveItem function
  const moveItem = async (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => {
    // Get the actual indices in the original items array
    const sourceItems = days[sourceDay].items;
    const targetItems = days[targetDay].items;
    const draggedItem = sourceItems[dragIndex];

    // If we're moving within the same day
    if (sourceDay === targetDay) {
      const newItems = [...sourceItems];
      const [movedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, movedItem);

      // Update orders to ensure they are sequential
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setDays((prevDays) => {
        const newDays = [...prevDays];
        newDays[sourceDay] = {
          ...newDays[sourceDay],
          items: updatedItems,
        };
        return newDays;
      });

      // Save to database
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
        // Revert on error
        setDays((prevDays) => {
          const newDays = [...prevDays];
          newDays[sourceDay] = {
            ...newDays[sourceDay],
            items: sourceItems,
          };
          return newDays;
        });
      }
    } else {
      // Moving between days
      try {
        if (isTask(draggedItem)) {
          const newDate = days[targetDay].date.toISOString();
          const updatedTask = {
            ...draggedItem,
            date: newDate,
          };

          // Update the database first
          await taskService.updateTask(draggedItem.id, updatedTask);

          // Then update the local state
          setDays((prevDays) => {
            const newDays = [...prevDays];
            // Remove from source day
            newDays[sourceDay] = {
              ...newDays[sourceDay],
              items: newDays[sourceDay].items.filter(
                (i) => i.id !== draggedItem.id
              ),
            };
            // Add to target day at the specified index
            newDays[targetDay] = {
              ...newDays[targetDay],
              items: [
                ...newDays[targetDay].items.slice(0, hoverIndex),
                updatedTask,
                ...newDays[targetDay].items.slice(hoverIndex),
              ],
            };
            return newDays;
          });
        }
      } catch (error) {
        console.error("Error moving task:", error);
        // Revert on error
        setDays((prevDays) => {
          const newDays = [...prevDays];
          newDays[sourceDay] = {
            ...newDays[sourceDay],
            items: sourceItems,
          };
          newDays[targetDay] = {
            ...newDays[targetDay],
            items: targetItems,
          };
          return newDays;
        });
      }
    }
  };

  // Add new component for draggable item
  const DraggableItem = ({
    item,
    index,
    dayIndex,
    moveItem,
    isTaskItem,
    renderTask,
    renderSection,
    hideCompleted,
    isTask,
  }: {
    item: ListItem;
    index: number;
    dayIndex: number;
    moveItem: (
      dragIndex: number,
      hoverIndex: number,
      sourceDay: number,
      targetDay: number
    ) => void;
    isTaskItem: boolean;
    renderTask: (task: Task, dayIndex: number) => JSX.Element;
    renderSection: (section: SectionItem) => JSX.Element;
    hideCompleted: boolean;
    isTask: (item: ListItem) => item is Task;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: "ITEM",
      item: { id: item.id, type: item.type, index, dayIndex, item },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        return !hideCompleted || !isTask(item) || !(item as Task).completed;
      },
    });

    type DropResult = {
      isOver: boolean;
      canDrop: boolean;
      dropPosition: "before" | "after" | null;
    };

    const [{ isOver, canDrop, dropPosition }, drop] = useDrop<
      DragItem,
      void,
      DropResult
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

        return {
          isOver,
          canDrop,
          dropPosition,
        };
      },
      canDrop: (draggedItem: DragItem) => {
        // Allow dropping if:
        // 1. The item is not hidden due to being completed
        // 2. The item is not being dragged onto itself
        if (hideCompleted && isTask(item) && (item as Task).completed) {
          return false;
        }
        if (draggedItem.id === item.id && draggedItem.dayIndex === dayIndex) {
          return false;
        }
        return true;
      },
      hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
        if (!ref.current) return;

        const dragIndex = draggedItem.index;
        const hoverIndex = index;
        const sourceDay = draggedItem.dayIndex;
        const targetDay = dayIndex;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex && sourceDay === targetDay) return;

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

        // Make the drop zones more forgiving by using 40% of the item height
        const dropThreshold = hoverMiddleY * 0.8;

        // Only perform the move when the mouse has crossed the threshold
        if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
        if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;

        // Call moveItem with the current positions
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Handle keyboard drag start
          }
        }}
      >
        {item.type === "section"
          ? renderSection(item as SectionItem)
          : isTaskItem
          ? renderTask(item as Task, dayIndex)
          : null}
      </div>
    );
  };

  // Add new component for droppable day container
  const DroppableDay = ({
    dayIndex,
    children,
    onDrop,
  }: {
    dayIndex: number;
    children: React.ReactNode;
    onDrop: (item: DragItem) => void;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: "ITEM",
      drop: (item: DragItem) => {
        onDrop(item);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    // Combine the refs
    drop(ref);

    return (
      <div
        ref={ref}
        className={`h-full ${
          isOver && canDrop ? "bg-blue-500/5 rounded-lg" : ""
        }`}
      >
        {children}
      </div>
    );
  };

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

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{globalStyles}</style>
      <div className="h-screen flex flex-col">
        <div className="flex-none p-4">
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
                      <div className="absolute right-0 mt-2 w-48 bg-neu-800 rounded-lg shadow-lg z-50">
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
                              localStorage.setItem(
                                "completedPosition",
                                "bottom"
                              );
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
                              setCompletedPosition("custom");
                              localStorage.setItem(
                                "completedPosition",
                                "custom"
                              );
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                              completedPosition === "custom"
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
                      <span className="text-base font-outfit">
                        Clear completed
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Days Container - Now with dynamic height */}
        <div className="flex-1 overflow-hidden">
          <div className="days-container h-full overflow-x-auto">
            <div className="flex space-x-8 p-4 pl-8 h-fit">
              {days.map((day, dayIndex) => (
                <div
                  key={day.date.toISOString()}
                  className={`flex-shrink-0 w-[280px] ${
                    dayIndex > 1 ? "mt-7" : ""
                  }`}
                >
                  {/* Add Today/Tomorrow label */}
                  {dayIndex === 0 && (
                    <div>
                      <span className="inline-block px-4 py-1 bg-pri-blue-500 text-neu-100 text-base font-outfit font-medium rounded-t-md">
                        Today
                      </span>
                    </div>
                  )}
                  {dayIndex === 1 && (
                    <div>
                      <span className="inline-block px-4 py-1 bg-pri-pur-500 text-neu-100 text-base font-outfit font-medium rounded-t-md">
                        Tomorrow
                      </span>
                    </div>
                  )}
                  <div
                    className={`bg-neu-800/90 p-4 h-fit ${
                      dayIndex <= 1
                        ? "rounded-tr-lg rounded-br-lg rounded-bl-lg"
                        : "rounded-lg"
                    }`}
                  >
                    <DroppableDay
                      dayIndex={dayIndex}
                      onDrop={(item) => {
                        // When dropping on an empty day, add the item at the beginning
                        moveItem(item.index, 0, item.dayIndex, dayIndex);
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-outfit font-semibold text-neu-100">
                            {day.date.toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </h2>
                          <p className="text-base font-outfit text-neu-400">
                            {day.date
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                              .toUpperCase()}
                          </p>
                        </div>

                        {/* Task creation */}
                        <div className="mb-2">
                          <TaskCreationInput dayIndex={dayIndex} />
                        </div>

                        {/* Section creation */}
                        <div className="mb-8 pb-8 border-b-2 border-neu-700/75">
                          <SectionCreationInput dayIndex={dayIndex} />
                        </div>

                        {/* Tasks and Sections */}
                        <div className="space-y-4">
                          {isLoading ? (
                            <div className="text-neu-400">Loading tasks...</div>
                          ) : day.items.length === 0 ? (
                            <div className="text-center text-neu-600 py-4">
                              <p className="text-sm font-outfit">
                                No tasks for this day
                              </p>
                            </div>
                          ) : (
                            sortItems(day.items).map((item, index) => {
                              const isTaskItem = isTask(item);
                              const isHidden =
                                hideCompleted && isTaskItem && item.completed;
                              const isHiding = hidingItems.has(item.id);

                              return (
                                <div
                                  key={item.id}
                                  className={`relative task-item ${
                                    isHiding ? "hiding" : "showing"
                                  }`}
                                  style={{
                                    display:
                                      isHidden && !isHiding ? "none" : "block",
                                  }}
                                >
                                  <DraggableItem
                                    item={item}
                                    index={index}
                                    dayIndex={dayIndex}
                                    moveItem={moveItem}
                                    isTaskItem={isTaskItem}
                                    renderTask={renderTask}
                                    renderSection={renderSection}
                                    hideCompleted={hideCompleted}
                                    isTask={isTask}
                                  />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </DroppableDay>
                  </div>
                </div>
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
      </div>
    </DndProvider>
  );
}
