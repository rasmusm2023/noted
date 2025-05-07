import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, Timestamp } from "../types/task";
import { TrashBinTrash, Pen, CheckCircle, Record } from "solar-icon-set";

type TitleItem = {
  id: string;
  type: "title";
  text: string;
};

type ListItem = Task | Timestamp | TitleItem;

export function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [titles, setTitles] = useState<
    { id: string; type: "title"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTimestamp, setIsCreatingTimestamp] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTimestampTime, setNewTimestampTime] = useState("");
  const [newTitleText, setNewTitleText] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<ListItem | null>(null);
  const [dropShadow, setDropShadow] = useState<{
    index: number;
    position: "before" | "after";
  } | null>(null);

  // Combine tasks, timestamps, and titles into a single array
  const allItems: ListItem[] = [...timestamps, ...titles, ...tasks];

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

  const handleDragStart = (e: React.DragEvent, item: ListItem) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(item);
    // Add a semi-transparent effect to the dragged item
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset the dragged item's opacity
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItem(null);
    setDropShadow(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position =
      e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDropShadow({ index, position });
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = allItems.findIndex(
      (item) => item.id === draggedItem.id
    );
    if (draggedIndex === -1) return;

    // Create new array with reordered items
    const newItems = [...allItems];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, movedItem);

    // Update the appropriate states
    const newTimestamps = newItems.filter(
      (item): item is Timestamp => "time" in item
    );
    const newTitles = newItems.filter(
      (item): item is TitleItem => "type" in item && item.type === "title"
    );
    const newTasks = newItems.filter(
      (item): item is Task => !("time" in item) && !("type" in item)
    );

    // Update local state
    setTimestamps(newTimestamps);
    setTitles(newTitles);
    setTasks(newTasks);
    setDraggedItem(null);
    setDropShadow(null);

    // Save the new order to the database
    try {
      if (currentUser) {
        // Save tasks order
        const taskOrder = newTasks.map((task, index) => ({
          id: task.id,
          order: index,
        }));
        await taskService.updateTaskOrder(currentUser.uid, taskOrder);

        // Save timestamps order
        const timestampOrder = newTimestamps.map((ts, index) => ({
          id: ts.id,
          order: index,
        }));
        await taskService.updateTimestampOrder(currentUser.uid, timestampOrder);

        // Save titles order
        const titleOrder = newTitles.map((title, index) => ({
          id: title.id,
          order: index,
        }));
        await taskService.updateTitleOrder(currentUser.uid, titleOrder);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser) {
        try {
          console.log("Loading tasks for user:", currentUser.uid);
          const userTasks = await taskService.getUserTasks(currentUser.uid);
          console.log("Loaded tasks:", userTasks);
          // Sort tasks by their order
          const sortedTasks = userTasks.sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          setTasks(sortedTasks);
        } catch (error) {
          console.error("Error loading tasks:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No user logged in, skipping task load");
        setLoading(false);
      }
    };

    loadTasks();
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
    // Remove any non-digit characters
    const numbers = input.replace(/\D/g, "");

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

  const handleAddTimestamp = () => {
    const formattedTime = formatTimeFromInput(newTimestampTime);
    if (!formattedTime) return;

    const newTimestamp: Timestamp = {
      id: Date.now().toString(),
      time: formattedTime,
      isExpanded: true,
      tasks: [],
    };
    setTimestamps([...timestamps, newTimestamp]);
    setNewTimestampTime("");
  };

  const handleDeleteTimestamp = (timestampId: string) => {
    setTimestamps(timestamps.filter((ts) => ts.id !== timestampId));
    setIsCreatingTimestamp(false);
  };

  const handleAddTitle = () => {
    if (!newTitleText.trim()) return;
    const newTitle = {
      id: Date.now().toString(),
      type: "title" as const,
      text: newTitleText.trim(),
    };
    setTitles([...titles, newTitle]);
    setNewTitleText("");
    setEditingTitle(newTitle.id);
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 0);
  };

  const handleTitleEdit = (titleId: string, newText: string) => {
    setTitles(
      titles.map((title) =>
        title.id === titleId ? { ...title, text: newText } : title
      )
    );
    setEditingTitle(null);
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

  const handleDeleteTitle = (titleId: string) => {
    setTitles(titles.filter((title) => title.id !== titleId));
  };

  const isTask = (item: ListItem): item is Task => {
    return !("time" in item) && !("type" in item);
  };

  const [focusedInput, setFocusedInput] = useState<
    "task" | "timestamp" | "title" | null
  >(null);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-neu-100">Today</h1>
          <span className="text-2xl text-neu-400 uppercase">{currentDate}</span>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div
            className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
              focusedInput === "task" ? "ring-2 ring-pri-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-pri-blue-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-neu-100"
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
              focusedInput === "timestamp" ? "ring-2 ring-pri-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sup-suc-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-neu-100"
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
                <input
                  type="text"
                  value={newTimestampTime}
                  onChange={(e) => setNewTimestampTime(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTimestamp();
                    }
                  }}
                  onKeyPress={(e) => {
                    // Allow numbers and specific symbols
                    if (!/[0-9.:;-]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onFocus={() => setFocusedInput("timestamp")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Add a timestamp..."
                  className="w-full bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                />
                <p className="text-neu-400 text-sm">Example: 09:00</p>
              </div>
            </div>
          </div>

          <div
            className={`p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors ${
              focusedInput === "title" ? "ring-2 ring-pri-blue-500" : ""
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sup-war-500 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-neu-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <input
                  type="text"
                  value={newTitleText}
                  onChange={(e) => setNewTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitleText.trim()) {
                      handleAddTitle();
                    }
                  }}
                  onFocus={() => setFocusedInput("title")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Add a title..."
                  className="w-full bg-transparent text-md font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
                />
                <p className="text-neu-400 text-sm">Press Enter to add</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Tasks with Timestamps */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neu-100 mb-4">
            {dayOfWeek} Tasks
          </h2>
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
                    onClick={() => {
                      const newTimestamp: Timestamp = {
                        id: Date.now().toString(),
                        time: newTimestampTime || "09:00",
                        isExpanded: true,
                        tasks: [],
                      };
                      setTimestamps([...timestamps, newTimestamp]);
                      setNewTimestampTime("");
                      setIsCreatingTimestamp(false);
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
                {allItems.map((item, index) => (
                  <div key={item.id}>
                    {/* Drop position indicators */}
                    {dropShadow?.index === index &&
                      dropShadow.position === "before" && (
                        <div className="h-1 bg-pri-blue-500 rounded-full my-2 transition-all duration-150" />
                      )}

                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`transition-all duration-200 ${
                        draggedItem?.id === item.id ? "opacity-50" : ""
                      }`}
                    >
                      {"time" in item ? (
                        // Timestamp
                        <div className="flex items-center space-x-4 mb-2">
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
                              className="p-2 bg-neu-700 rounded text-neu-100"
                            />
                            <button
                              onClick={() => handleDeleteTimestamp(item.id)}
                              className="p-2 text-neu-400 hover:text-red-500 transition-colors duration-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                              onKeyDown={(e) => handleTitleKeyDown(e, item.id)}
                              onBlur={(e) =>
                                handleTitleBlur(item.id, e.target.value)
                              }
                              autoFocus
                            />
                          ) : (
                            <div
                              className="flex-1 cursor-pointer"
                              onDoubleClick={() => setEditingTitle(item.id)}
                            >
                              <h3 className="text-xl font-semibold text-neu-100">
                                {item.text}
                              </h3>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteTitle(item.id)}
                            className="p-2 text-neu-400 hover:text-red-500 transition-colors"
                          >
                            <TrashBinTrash size={24} color="currentColor" />
                          </button>
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
                                  handleTaskCompletion(item.id, !item.completed)
                                }
                                className={`transition-colors duration-200 flex items-center justify-center ${
                                  item.completed
                                    ? "text-sup-suc-900 hover:text-sup-suc-800"
                                    : "text-pri-blue-500 hover:text-sup-suc-500"
                                }`}
                              >
                                {item.completed ? (
                                  <CheckCircle size={32} color="currentColor" />
                                ) : (
                                  <Record size={32} color="currentColor" />
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
                                    <Pen size={24} color="currentColor" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(item.id)}
                                    className={`p-2 ${
                                      item.completed
                                        ? "text-sup-suc-900 hover:text-sup-suc-800"
                                        : "text-neu-400 hover:text-red-500"
                                    }`}
                                  >
                                    <TrashBinTrash
                                      size={24}
                                      color="currentColor"
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
                                  className={`p-2 ${
                                    item.completed
                                      ? "text-sup-suc-900 hover:text-sup-suc-800"
                                      : "text-neu-400 hover:text-neu-100"
                                  }`}
                                >
                                  <Pen size={24} color="currentColor" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(item.id)}
                                  className={`p-2 ${
                                    item.completed
                                      ? "text-sup-suc-900 hover:text-sup-suc-800"
                                      : "text-neu-400 hover:text-red-500"
                                  }`}
                                >
                                  <TrashBinTrash
                                    size={24}
                                    color="currentColor"
                                  />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Drop position indicator */}
                    {dropShadow?.index === index &&
                      dropShadow.position === "after" && (
                        <div className="h-1 bg-pri-blue-500 rounded-full my-2 transition-all duration-150" />
                      )}
                  </div>
                ))}
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
                  <div
                    className="h-2 bg-pri-blue-500 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
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
                  <div
                    className="h-2 bg-pri-blue-500 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
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
