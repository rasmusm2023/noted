import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task, Timestamp } from "../types/task";
import { TrashBinTrash, Pen } from "solar-icon-set";

type ListItem = Task | Timestamp;

export function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingTimestamp, setIsCreatingTimestamp] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTimestampTime, setNewTimestampTime] = useState("");

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<ListItem | null>(null);
  const [dropShadow, setDropShadow] = useState<{
    index: number;
    position: "before" | "after";
  } | null>(null);

  // Combine tasks and timestamps into a single array
  const allItems: ListItem[] = [...timestamps, ...tasks];

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

  const handleDrop = (e: React.DragEvent, index: number) => {
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
    const newTasks = newItems.filter((item): item is Task => !("time" in item));

    setTimestamps(newTimestamps);
    setTasks(newTasks);
    setDraggedItem(null);
    setDropShadow(null);
  };

  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser) {
        try {
          console.log("Loading tasks for user:", currentUser.uid);
          const userTasks = await taskService.getUserTasks(currentUser.uid);
          console.log("Loaded tasks:", userTasks);
          setTasks(userTasks);
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

    try {
      console.log("Attempting to create new task for user:", currentUser.uid);
      const newTask = await taskService.createTask(currentUser.uid, {
        title: newTaskTitle || "Untitled Task",
        description: newTaskDescription || "",
        scheduledTime: new Date().toLocaleString(),
        completed: false,
      });
      console.log("Task created successfully:", newTask);
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setIsCreatingTask(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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

  const handleAddTimestamp = () => {
    setIsCreatingTimestamp(true);
    const newTimestamp: Timestamp = {
      id: Date.now().toString(),
      time: "09:00",
      isExpanded: true,
      tasks: [],
    };
    setTimestamps([...timestamps, newTimestamp]);
    // Focus the time input after a short delay to ensure the element is rendered
    setTimeout(() => {
      const timeInput = document.querySelector(
        `[data-id="${newTimestamp.id}"] input[type="time"]`
      ) as HTMLInputElement;
      if (timeInput) {
        timeInput.focus();
        timeInput.select();
      }
    }, 0);
  };

  const handleDeleteTimestamp = (timestampId: string) => {
    setTimestamps(timestamps.filter((ts) => ts.id !== timestampId));
    setIsCreatingTimestamp(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-neu-100 mb-8">
          Today's Overview
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => {
              setIsCreatingTask(true);
              // Focus the input after a short delay to ensure it's rendered
              setTimeout(() => {
                const input = document.querySelector(
                  "[data-task-input]"
                ) as HTMLInputElement;
                if (input) {
                  input.focus();
                  input.select();
                }
              }, 0);
            }}
            className="p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors"
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
              <div className="text-left">
                <h3 className="text-lg font-semibold text-neu-100">Add Task</h3>
                <p className="text-neu-400">Create a new task</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleAddTimestamp}
            className="p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors"
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
              <div className="text-left">
                <h3 className="text-lg font-semibold text-neu-100">
                  Add Timestamp
                </h3>
                <p className="text-neu-400">Add a time marker</p>
              </div>
            </div>
          </button>

          <button className="p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-neu-100">Schedule</h3>
                <p className="text-neu-400">Plan your day</p>
              </div>
            </div>
          </button>
        </div>

        {/* Today's Tasks with Timestamps */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neu-100 mb-4">
            Today's Tasks
          </h2>
          {loading ? (
            <div className="text-neu-400">Loading tasks...</div>
          ) : (
            <div className="space-y-4">
              {/* New Task Input */}
              {isCreatingTask && (
                <div className="p-4 bg-neu-800 rounded-lg flex flex-col space-y-4">
                  <input
                    data-task-input
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
                    {/* Drop position indicator */}
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
                      ) : (
                        // Task
                        <div
                          className={`p-4 rounded-lg flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 ${
                            item.completed
                              ? "bg-sup-suc-300 bg-opacity-75"
                              : "bg-neu-800 text-neu-900"
                          }`}
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <button
                              onClick={() =>
                                handleTaskCompletion(item.id, !item.completed)
                              }
                              className={`transition-colors duration-200 ${
                                item.completed
                                  ? "text-sup-suc-900 hover:text-sup-suc-800"
                                  : "text-neu-400 hover:text-pri-blue-500"
                              }`}
                            >
                              {item.completed ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                  <path d="m9 12 2 2 4-4" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                </svg>
                              )}
                            </button>
                            {editingTask?.id === item.id ? (
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full p-2 bg-neu-700 rounded text-neu-100"
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
                                  className="w-full p-2 bg-neu-700 rounded text-neu-100"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleEditTask(item.id, {
                                        title: editingTask.title,
                                        description: editingTask.description,
                                      })
                                    }
                                    className="px-3 py-1 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTask(null)}
                                    className="px-3 py-1 bg-neu-700 text-neu-100 rounded hover:bg-neu-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <h3
                                  className={`text-lg font-semibold ${
                                    item.completed
                                      ? "text-sup-suc-900 line-through"
                                      : "text-neu-100"
                                  }`}
                                >
                                  {item.title}
                                </h3>
                                <p
                                  className={`${
                                    item.completed
                                      ? "text-sup-suc-900 line-through"
                                      : "text-neu-400"
                                  }`}
                                >
                                  {item.description}
                                </p>
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
                                  <Pen size={20} color="currentColor" />
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
                                    size={20}
                                    color="currentColor"
                                  />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
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
