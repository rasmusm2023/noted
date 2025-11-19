import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";
import { TaskDrawer } from "../components/TaskDrawer/TaskDrawer";
import { PageTransition } from "../components/PageTransition";
import { TaskList } from "../components/Dashboard/TaskList";
import { toast, Toaster } from "react-hot-toast";
import { usePageTitle } from "../hooks/usePageTitle";
import { Icon } from "@iconify/react";

export function Archive() {
  const { currentUser } = useAuth();
  usePageTitle("Archive");

  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load archived tasks
  useEffect(() => {
    const loadArchivedTasks = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const tasks = await taskService.getArchivedTasks(currentUser.uid);
        setArchivedTasks(tasks);
      } catch (error) {
        console.error("Error loading archived tasks:", error);
        toast.error("Failed to load archived tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadArchivedTasks();
  }, [currentUser]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDrawer = (task: Task) => {
    if (task.shouldClose) {
      setSelectedTask(null);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, updates);
      setArchivedTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setArchivedTasks((prevTasks) =>
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

  const handleUnarchiveTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      await taskService.unarchiveTask(taskId, currentUser.uid);
      setArchivedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
      toast.success("Task unarchived");
    } catch (error) {
      console.error("Error unarchiving task:", error);
      toast.error("Failed to unarchive task");
    }
  };

  return (
    <PageTransition>
      <div className="p-0 sm:p-6 md:p-8 mt-0 lg:mt-16 bg-pri-blue-50 dark:bg-neu-gre-800">
        <div className="max-w-[1920px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-4 sm:px-8 md:px-16 py-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Icon
                icon="mingcute:box-2-line"
                className="text-pri-pur-500 w-6 h-6 sm:w-8 sm:h-8"
                aria-hidden="true"
              />
              <h1 className="text-2xl sm:text-3xl font-medium text-neu-gre-800 dark:text-neu-gre-100 font-clash">
                Archive
              </h1>
            </div>
          </div>

          {/* Task List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-neu-gre-600 dark:text-neu-gre-300">
                Loading archived tasks...
              </p>
            </div>
          ) : archivedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Icon
                icon="mingcute:box-2-line"
                className="w-16 h-16 mx-auto mb-4 text-neu-gre-400 dark:text-neu-gre-600"
              />
              <p className="text-neu-gre-600 dark:text-neu-gre-300 text-lg">
                No archived tasks
              </p>
              <p className="text-neu-gre-500 dark:text-neu-gre-400 text-sm mt-2">
                Archive tasks to declutter your dashboard while keeping them for
                later
              </p>
            </div>
          ) : (
            <TaskList
              items={archivedTasks}
              onTaskClick={handleTaskClick}
              onTaskSave={handleUnarchiveTask}
              onTaskDelete={handleDeleteTask}
              isArchivePage={true}
              goals={[]}
            />
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
        />
      )}

      <Toaster position="top-right" />
    </PageTransition>
  );
}
