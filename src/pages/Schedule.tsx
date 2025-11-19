import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";
import { Icon } from "@iconify/react";
import { PageTransition } from "../components/PageTransition";
import { TaskDrawer } from "../components/TaskDrawer/TaskDrawer";
import { toast, Toaster } from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, getDate, parse } from "date-fns";

export function Schedule() {
  const { currentUser } = useAuth();
  usePageTitle("Schedule");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate, setTaskDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taskTime, setTaskTime] = useState("");
  const [taskDuration, setTaskDuration] = useState("");

  // Load scheduled tasks
  useEffect(() => {
    const loadScheduledTasks = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const tasks = await taskService.getUserTasks(currentUser.uid);
        // Filter out archived tasks and only show tasks with dates
        const scheduled = tasks.filter(
          (task) => !task.isArchived && task.date
        );
        setScheduledTasks(scheduled);
      } catch (error) {
        console.error("Error loading scheduled tasks:", error);
        toast.error("Failed to load scheduled tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadScheduledTasks();
  }, [currentUser]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return scheduledTasks.filter((task) => {
      const taskDate = new Date(task.date);
      return isSameDay(taskDate, date);
    });
  };

  // Calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of month to pad calendar
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setTaskDate(format(date, "yyyy-MM-dd"));
    setShowTaskForm(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !taskTitle.trim()) return;

    try {
      const selectedDate = new Date(taskDate);
      selectedDate.setHours(12, 0, 0, 0); // Set to noon

      // Combine date and time if time is provided
      let scheduledTime = selectedDate.toISOString();
      if (taskTime) {
        const [hours, minutes] = taskTime.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);
        scheduledTime = selectedDate.toISOString();
      }

      const taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt"> = {
        type: "task",
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        date: selectedDate.toISOString(),
        scheduledTime,
        completed: false,
        time: taskTime || undefined,
        duration: taskDuration ? parseInt(taskDuration) : undefined,
      };

      const newTask = await taskService.createTask(currentUser.uid, taskData);
      setScheduledTasks([...scheduledTasks, newTask]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskTime("");
      setTaskDuration("");
      setShowTaskForm(false);
      toast.success("Task scheduled successfully!");
    } catch (error) {
      console.error("Error creating scheduled task:", error);
      toast.error("Failed to schedule task");
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      setScheduledTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setScheduledTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    if (!currentUser) return;
    try {
      await taskService.archiveTask(taskId);
      setScheduledTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
      toast.success("Task archived");
    } catch (error) {
      console.error("Error archiving task:", error);
      toast.error("Failed to archive task");
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDrawer = (task: Task) => {
    if (task.shouldClose) {
      setSelectedTask(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskDate(format(new Date(task.date), "yyyy-MM-dd"));
    setTaskTime(task.time || "");
    setTaskDuration(task.duration?.toString() || "");
    setShowTaskForm(true);
  };

  const handleUpdateScheduledTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !taskTitle.trim()) return;

    try {
      const selectedDate = new Date(taskDate);
      selectedDate.setHours(12, 0, 0, 0);

      let scheduledTime = selectedDate.toISOString();
      if (taskTime) {
        const [hours, minutes] = taskTime.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);
        scheduledTime = selectedDate.toISOString();
      }

      await handleUpdateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        date: selectedDate.toISOString(),
        scheduledTime,
        time: taskTime || undefined,
        duration: taskDuration ? parseInt(taskDuration) : undefined,
      });

      setEditingTask(null);
      setTaskTitle("");
      setTaskDescription("");
      setTaskTime("");
      setTaskDuration("");
      setShowTaskForm(false);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <PageTransition>
      <div className="p-0 sm:p-6 md:p-8 mt-0 lg:mt-16 bg-pri-blue-50 dark:bg-neu-gre-800">
        <div className="max-w-[1920px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-4 sm:px-8 md:px-16 py-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Icon
                icon="mingcute:calendar-add-line"
                className="text-pri-pur-500 w-6 h-6 sm:w-8 sm:h-8"
                aria-hidden="true"
              />
              <h1 className="text-2xl sm:text-3xl font-medium text-neu-gre-800 dark:text-neu-gre-100 font-clash">
                Schedule
              </h1>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setTaskTitle("");
                setTaskDescription("");
                setTaskDate(format(new Date(), "yyyy-MM-dd"));
                setTaskTime("");
                setTaskDuration("");
                setShowTaskForm(true);
              }}
              className="px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-inter font-semibold bg-pri-pur-500 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 transition-colors flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md min-h-[44px]"
            >
              <Icon icon="mingcute:add-fill" width={20} height={20} />
              <span>New Task</span>
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-neu-gre-800 rounded-xl shadow-lg p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 rounded-md transition-colors"
                aria-label="Previous month"
              >
                <Icon icon="mingcute:left-line" className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 rounded-md transition-colors"
                aria-label="Next month"
              >
                <Icon icon="mingcute:right-line" className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-neu-gre-600 dark:text-neu-gre-400 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Padding days */}
              {paddingDays.map((_, index) => (
                <div key={`pad-${index}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayTasks = getTasksForDate(day);
                const isCurrentDay = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all hover:bg-neu-gre-50 dark:hover:bg-neu-gre-700 ${
                      isCurrentDay
                        ? "border-pri-pur-500 bg-pri-pur-50 dark:bg-pri-pur-900/20"
                        : "border-transparent"
                    } ${
                      !isCurrentMonth
                        ? "opacity-30"
                        : ""
                    }`}
                  >
                    <div className="text-sm font-medium text-neu-gre-800 dark:text-neu-gre-100 mb-1">
                      {format(day, "d")}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                            className="text-xs p-1 rounded bg-pri-pur-100 dark:bg-pri-pur-900/30 text-pri-pur-800 dark:text-pri-pur-200 truncate cursor-pointer hover:bg-pri-pur-200 dark:hover:bg-pri-pur-900/50"
                            title={task.title}
                          >
                            {task.time && (
                              <span className="font-semibold">
                                {formatTime(task.time)}{" "}
                              </span>
                            )}
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-neu-gre-500 dark:text-neu-gre-400">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheduled Tasks Overview */}
          <div className="bg-white dark:bg-neu-gre-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-4">
              Scheduled Tasks
            </h2>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  Loading scheduled tasks...
                </p>
              </div>
            ) : scheduledTasks.length === 0 ? (
              <div className="text-center py-8">
                <Icon
                  icon="mingcute:calendar-add-line"
                  className="w-16 h-16 mx-auto mb-4 text-neu-gre-400 dark:text-neu-gre-600"
                />
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  No scheduled tasks yet
                </p>
                <p className="text-neu-gre-500 dark:text-neu-gre-400 text-sm mt-2">
                  Click on a date in the calendar or use "New Task" to schedule
                  a task
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledTasks
                  .sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                    if (a.time && b.time) {
                      return a.time.localeCompare(b.time);
                    }
                    return a.time ? -1 : b.time ? 1 : 0;
                  })
                  .map((task) => {
                    const taskDate = new Date(task.date);
                    return (
                      <div
                        key={task.id}
                        className="p-4 bg-neu-gre-50 dark:bg-neu-gre-700 rounded-lg hover:bg-neu-gre-100 dark:hover:bg-neu-gre-600 transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                                {task.title}
                              </h3>
                              {task.completed && (
                                <Icon
                                  icon="mingcute:check-2-fill"
                                  className="w-5 h-5 text-acc-green-500"
                                />
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-neu-gre-600 dark:text-neu-gre-400">
                              <span className="flex items-center gap-1">
                                <Icon icon="mingcute:calendar-line" className="w-4 h-4" />
                                {format(taskDate, "MMM d, yyyy")}
                              </span>
                              {task.time && (
                                <span className="flex items-center gap-1">
                                  <Icon icon="mingcute:time-line" className="w-4 h-4" />
                                  {formatTime(task.time)}
                                </span>
                              )}
                              {task.duration && (
                                <span className="flex items-center gap-1">
                                  <Icon icon="mingcute:clock-line" className="w-4 h-4" />
                                  {formatDuration(task.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                              }}
                              className="p-2 hover:bg-neu-gre-200 dark:hover:bg-neu-gre-500 rounded-md transition-colors"
                              aria-label="Edit task"
                            >
                              <Icon
                                icon="mingcute:edit-line"
                                className="w-5 h-5 text-neu-gre-600 dark:text-neu-gre-300"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Task Form Modal */}
          {showTaskForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-neu-gre-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                      {editingTask ? "Edit Scheduled Task" : "Schedule New Task"}
                    </h2>
                    <button
                      onClick={() => {
                        setShowTaskForm(false);
                        setEditingTask(null);
                        setTaskTitle("");
                        setTaskDescription("");
                        setTaskTime("");
                        setTaskDuration("");
                      }}
                      className="p-2 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 rounded-md transition-colors"
                      aria-label="Close form"
                    >
                      <Icon
                        icon="mingcute:close-line"
                        className="w-6 h-6 text-neu-gre-600 dark:text-neu-gre-300"
                      />
                    </button>
                  </div>

                  <form
                    onSubmit={editingTask ? handleUpdateScheduledTask : handleCreateTask}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md text-neu-gre-800 dark:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                        required
                        placeholder="Enter task title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md text-neu-gre-800 dark:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                        rows={3}
                        placeholder="Enter task description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        className="w-full px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md text-neu-gre-800 dark:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300 mb-2">
                          Time (optional)
                        </label>
                        <input
                          type="time"
                          value={taskTime}
                          onChange={(e) => setTaskTime(e.target.value)}
                          className="w-full px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md text-neu-gre-800 dark:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300 mb-2">
                          Duration (minutes, optional)
                        </label>
                        <input
                          type="number"
                          value={taskDuration}
                          onChange={(e) => setTaskDuration(e.target.value)}
                          className="w-full px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md text-neu-gre-800 dark:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                          min="1"
                          placeholder="e.g., 30"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTaskForm(false);
                          setEditingTask(null);
                          setTaskTitle("");
                          setTaskDescription("");
                          setTaskTime("");
                          setTaskDuration("");
                        }}
                        className="px-4 py-2 text-neu-gre-700 dark:text-neu-gre-300 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-pri-pur-500 text-white rounded-md hover:bg-pri-pur-600 transition-colors font-semibold"
                      >
                        {editingTask ? "Update Task" : "Schedule Task"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={handleCloseDrawer}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onArchive={handleArchiveTask}
        />
      )}

      <Toaster position="top-right" />
    </PageTransition>
  );
}

