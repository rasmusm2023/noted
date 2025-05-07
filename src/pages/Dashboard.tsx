import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

export function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser) {
        try {
          const userTasks = await taskService.getUserTasks(currentUser.uid);
          setTasks(userTasks);
        } catch (error) {
          console.error("Error loading tasks:", error);
        } finally {
          setLoading(false);
        }
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
        description: newTaskDescription || "No description",
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
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-neu-100 mb-8">
          Today's Overview
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setIsCreatingTask(true)}
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

          <button className="p-6 bg-neu-800 rounded-lg hover:bg-neu-700 transition-colors">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-neu-100">
                  Track Habit
                </h3>
                <p className="text-neu-400">Log a habit completion</p>
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

        {/* Create Task Modal */}
        {isCreatingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-neu-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-neu-100 mb-4">
                Create New Task
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-neu-100 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full p-2 bg-neu-700 rounded text-neu-100"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-neu-100 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full p-2 bg-neu-700 rounded text-neu-100"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
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
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded hover:bg-pri-blue-600"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neu-100 mb-4">
            Today's Tasks
          </h2>
          {loading ? (
            <div className="text-neu-400">Loading tasks...</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-neu-800 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) =>
                        handleTaskCompletion(task.id, e.target.checked)
                      }
                      className="w-5 h-5 rounded border-neu-600 bg-neu-700 text-pri-blue-500 focus:ring-pri-blue-500"
                    />
                    {editingTask?.id === task.id ? (
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
                              handleEditTask(task.id, {
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
                        <h3 className="text-lg font-semibold text-neu-100">
                          {task.title}
                        </h3>
                        <p className="text-neu-400">{task.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neu-500">
                      {new Date(
                        task.scheduledTime || task.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {editingTask?.id !== task.id && (
                      <>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-2 text-neu-400 hover:text-neu-100"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-neu-400 hover:text-red-500"
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
                      </>
                    )}
                  </div>
                </div>
              ))}
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
