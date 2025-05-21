import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { goalService } from "../services/goalService";
import { taskService } from "../services/taskService";
import type { Goal } from "../services/goalService";
import type { Task } from "../types/task";
import { Icon } from "@iconify/react";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";

type ProgressType = "percentage" | "numerical";

export function Goals() {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    deadline: "",
    progressType: "percentage" as ProgressType,
    totalSteps: 10,
    currentStep: 0,
  });

  useEffect(() => {
    if (currentUser) {
      loadGoals();
    }
  }, [currentUser]);

  const loadGoals = async () => {
    if (!currentUser) return;
    try {
      const userGoals = await goalService.getUserGoals(currentUser.uid);
      setGoals(userGoals);

      // Load tasks for each goal
      const tasksByGoal: Record<string, Task[]> = {};
      for (const goal of userGoals) {
        const goalTasks = await taskService.getTasksByGoal(goal.id);
        tasksByGoal[goal.id] = goalTasks;
      }
      setTasks(tasksByGoal);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const goal = await goalService.createGoal(currentUser.uid, {
        ...newGoal,
        deadline: new Date(newGoal.deadline),
        progress:
          newGoal.progressType === "percentage"
            ? 0
            : (newGoal.currentStep / newGoal.totalSteps) * 100,
        status: "active",
      });
      setGoals([...goals, goal]);
      setTasks({ ...tasks, [goal.id]: [] });
      setNewGoal({
        title: "",
        description: "",
        deadline: "",
        progressType: "percentage",
        totalSteps: 10,
        currentStep: 0,
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleUpdateProgress = async (
    goalId: string,
    progress: number,
    progressType?: "percentage" | "numerical",
    currentStep?: number,
    totalSteps?: number
  ) => {
    try {
      await goalService.updateGoalProgress(
        goalId,
        progress,
        progressType,
        currentStep,
        totalSteps
      );
      setGoals(
        goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                progress,
                currentStep: currentStep ?? goal.currentStep,
                totalSteps: totalSteps ?? goal.totalSteps,
                status: progress >= 100 ? "completed" : "active",
              }
            : goal
        )
      );
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId);
      setGoals(goals.filter((goal) => goal.id !== goalId));
      const { [goalId]: removedTasks, ...remainingTasks } = tasks;
      setTasks(remainingTasks);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <PageTransition>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-neu-800">Goals</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors flex items-center space-x-2"
            >
              <Icon
                icon={showForm ? "mingcute:close-fill" : "mingcute:add-fill"}
                width={20}
                height={20}
              />
              <span>{showForm ? "Cancel" : "Add Goal"}</span>
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-neu-800 rounded-lg p-6"
              >
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-neu-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newGoal.title}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, title: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-neu-300 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newGoal.description}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, description: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="deadline"
                      className="block text-neu-300 mb-2"
                    >
                      Deadline
                    </label>
                    <input
                      type="date"
                      id="deadline"
                      value={newGoal.deadline}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, deadline: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                      required
                    />
                  </div>

                  {/* Progress Type Selection */}
                  <div>
                    <label className="block text-neu-300 mb-2">
                      Progress Type
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="percentage"
                          checked={newGoal.progressType === "percentage"}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              progressType: e.target.value as ProgressType,
                            })
                          }
                          className="text-pri-pur-500 focus:ring-pri-pur-500"
                        />
                        <span className="text-neu-100">Percentage</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="numerical"
                          checked={newGoal.progressType === "numerical"}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              progressType: e.target.value as ProgressType,
                            })
                          }
                          className="text-pri-pur-500 focus:ring-pri-pur-500"
                        />
                        <span className="text-neu-100">Numerical</span>
                      </label>
                    </div>
                  </div>

                  {/* Numerical Progress Inputs */}
                  {newGoal.progressType === "numerical" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="totalSteps"
                          className="block text-neu-300 mb-2"
                        >
                          Total Steps
                        </label>
                        <input
                          type="number"
                          id="totalSteps"
                          min="1"
                          value={newGoal.totalSteps}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              totalSteps: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="currentStep"
                          className="block text-neu-300 mb-2"
                        >
                          Current Step
                        </label>
                        <input
                          type="number"
                          id="currentStep"
                          min="0"
                          max={newGoal.totalSteps}
                          value={newGoal.currentStep}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              currentStep: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors"
                  >
                    Create Goal
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="text-neu-400">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="text-neu-400 text-center py-8">
              No goals yet. Add some to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neu-800 rounded-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-neu-100">
                        {goal.title}
                      </h3>
                      <p className="text-neu-400 mt-1">{goal.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-neu-400 hover:text-neu-200 transition-colors"
                    >
                      <Icon
                        icon="mingcute:delete-fill"
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-neu-400">
                      <span>Progress</span>
                      <span>
                        {goal.progressType === "numerical"
                          ? `${goal.currentStep}/${goal.totalSteps}`
                          : `${goal.progress}%`}
                      </span>
                    </div>
                    <div className="h-2 bg-neu-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pri-pur-500 transition-all duration-300"
                        style={{
                          width: `${
                            goal.progressType === "numerical"
                              ? (goal.currentStep / goal.totalSteps) * 100
                              : goal.progress
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neu-400">
                      Due: {goal.deadline.toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        goal.status === "completed"
                          ? "bg-sup-suc-500 text-white"
                          : "bg-neu-700 text-neu-300"
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {goal.progressType === "numerical" ? (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateProgress(
                              goal.id,
                              goal.progress,
                              "numerical",
                              Math.max(0, goal.currentStep - 1),
                              goal.totalSteps
                            )
                          }
                          className="px-3 py-1 bg-neu-700 text-neu-300 rounded hover:bg-neu-600 transition-colors"
                        >
                          -1 Step
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateProgress(
                              goal.id,
                              goal.progress,
                              "numerical",
                              Math.min(goal.totalSteps, goal.currentStep + 1),
                              goal.totalSteps
                            )
                          }
                          className="px-3 py-1 bg-neu-700 text-neu-300 rounded hover:bg-neu-600 transition-colors"
                        >
                          +1 Step
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateProgress(
                              goal.id,
                              Math.max(0, goal.progress - 10)
                            )
                          }
                          className="px-3 py-1 bg-neu-700 text-neu-300 rounded hover:bg-neu-600 transition-colors"
                        >
                          -10%
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateProgress(
                              goal.id,
                              Math.min(100, goal.progress + 10)
                            )
                          }
                          className="px-3 py-1 bg-neu-700 text-neu-300 rounded hover:bg-neu-600 transition-colors"
                        >
                          +10%
                        </button>
                      </>
                    )}
                  </div>

                  {/* Associated Tasks */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-neu-300 mb-2">
                      Associated Tasks
                    </h4>
                    {tasks[goal.id]?.length === 0 ? (
                      <p className="text-neu-400 text-sm">
                        No tasks associated with this goal yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {tasks[goal.id]?.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between bg-neu-700 rounded-lg p-2"
                          >
                            <span
                              className={`text-sm ${
                                task.completed
                                  ? "line-through text-neu-400"
                                  : "text-neu-100"
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                task.completed
                                  ? "bg-sup-suc-500 text-white"
                                  : "bg-neu-600 text-neu-300"
                              }`}
                            >
                              {task.completed ? "Done" : "In Progress"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
