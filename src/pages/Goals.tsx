import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { goalService } from "../services/goalService";
import { taskService } from "../services/taskService";
import type { Goal } from "../services/goalService";
import type { Task } from "../types/task";
import { Icon } from "@iconify/react";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  format,
  isToday,
  parseISO,
  parse,
  getYear,
  getMonth,
  getDate,
} from "date-fns";

type ProgressType = "percentage" | "numerical";

const generateDateOptions = () => {
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return { years, months, days };
};

const DatePicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) => {
  const { years, months, days } = generateDateOptions();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    if (value) {
      try {
        const date = parse(value, "MMMM d, yyyy", new Date());
        setSelectedMonth(months[getMonth(date)]);
        setSelectedDay(getDate(date).toString());
        setSelectedYear(getYear(date).toString());
      } catch (e) {
        // If parsing fails, reset the fields
        setSelectedMonth("");
        setSelectedDay("");
        setSelectedYear("");
      }
    }
  }, [value]);

  const handleChange = (month: string, day: string, year: string) => {
    if (
      month &&
      day &&
      year &&
      month !== "Month" &&
      day !== "Day" &&
      year !== "Year"
    ) {
      const dateStr = `${month} ${day}, ${year}`;
      onChange(dateStr);
    } else {
      onChange("None, no stress");
    }
  };

  return (
    <div className="space-y-2" role="group" aria-label="Select deadline date">
      <div className="flex gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            handleChange(e.target.value, selectedDay, selectedYear);
          }}
          className="flex-1 px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:ring-offset-2 transition-all duration-200"
          aria-label="Select month"
        >
          <option value="Month">Month</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={selectedDay}
          onChange={(e) => {
            setSelectedDay(e.target.value);
            handleChange(selectedMonth, e.target.value, selectedYear);
          }}
          className="w-24 px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:ring-offset-2 transition-all duration-200"
          aria-label="Select day"
        >
          <option value="Day">Day</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            handleChange(selectedMonth, selectedDay, e.target.value);
          }}
          className="w-28 px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:ring-offset-2 transition-all duration-200"
          aria-label="Select year"
        >
          <option value="Year">Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-neu-gre-500" aria-live="polite">
        No rush, unless you want to! 😉
      </p>
    </div>
  );
};

const GOAL_PLACEHOLDERS = [
  "Move daily 🏃‍♂️",
  "Build a reading habit 📚",
  "Stick to a sleep routine 😴",
  "Keep my space tidy 🧹",
  "Limit screen time 📵",
  "Work on my side project 🛠️",
  "Practice mindfulness 🧘‍♀️",
  "Cook more at home 🍳",
  "Strengthen relationships ❤️",
  "Be more organized 🗂️",
  "Write something every day ✍️",
  "Level up my skills 🚀",
  "Stay hydrated 💧",
  "Track my spending 💸",
  "Spend more time outside 🌿",
];

export function Goals() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    deadline: "",
    progressType: "percentage" as ProgressType,
    totalSteps: 10,
  });
  const [titlePlaceholder, setTitlePlaceholder] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadGoals();
    }
  }, [currentUser]);

  useEffect(() => {
    // Set initial placeholder when component mounts
    setTitlePlaceholder(
      GOAL_PLACEHOLDERS[Math.floor(Math.random() * GOAL_PLACEHOLDERS.length)]
    );
  }, []);

  // Update placeholder when form is shown
  useEffect(() => {
    if (showForm) {
      setTitlePlaceholder(
        GOAL_PLACEHOLDERS[Math.floor(Math.random() * GOAL_PLACEHOLDERS.length)]
      );
    }
  }, [showForm]);

  useEffect(() => {
    if (showForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showForm]);

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
      let parsedDate: Date | null = null;
      if (newGoal.deadline && newGoal.deadline !== "None, no stress") {
        try {
          parsedDate = parse(newGoal.deadline, "MMMM d, yyyy", new Date());
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      }

      const goal = await goalService.createGoal(currentUser.uid, {
        ...newGoal,
        currentStep: 0,
        deadline: parsedDate,
        progress:
          newGoal.progressType === "percentage"
            ? 0
            : (0 / newGoal.totalSteps) * 100,
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
      });
      setShowForm(false);
      toast.success("Goal created successfully!");
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
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

      // Check if goal is completed after updating progress
      const isCompleted =
        progress >= 100 ||
        (currentStep !== undefined &&
          totalSteps !== undefined &&
          currentStep >= totalSteps);

      // Update the goal's status in the database
      if (isCompleted) {
        await goalService.updateGoal(goalId, { status: "completed" });
      }

      setGoals(
        goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                progress,
                currentStep: currentStep ?? goal.currentStep,
                totalSteps: totalSteps ?? goal.totalSteps,
                status: isCompleted ? "completed" : "active",
              }
            : goal
        )
      );

      if (isCompleted) {
        toast.success("Goal completed! 🎉");
      }
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId);
      setGoals(goals.filter((goal) => goal.id !== goalId));
      const { [goalId]: removedTasks, ...remainingTasks } = tasks;
      setTasks(remainingTasks);
      toast.success("Goal deleted successfully");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleTaskClick = (task: Task) => {
    if (isToday(task.date)) {
      navigate("/dashboard");
    } else {
      navigate("/next7days");
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingGoalId) return;

    try {
      const goalToUpdate = goals.find((g) => g.id === editingGoalId);
      if (!goalToUpdate) return;

      let parsedDate: Date | null = null;
      if (newGoal.deadline && newGoal.deadline !== "None, no stress") {
        try {
          parsedDate = parse(newGoal.deadline, "MMMM d, yyyy", new Date());
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      }

      await goalService.updateGoal(editingGoalId, {
        ...newGoal,
        deadline: parsedDate,
      });

      setGoals(
        goals.map((goal) =>
          goal.id === editingGoalId
            ? { ...goal, ...newGoal, deadline: parsedDate }
            : goal
        )
      );

      setEditingGoalId(null);
      setNewGoal({
        title: "",
        description: "",
        deadline: "",
        progressType: "percentage",
        totalSteps: 10,
      });
      toast.success("Goal updated successfully!");
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      deadline: goal.deadline ? format(goal.deadline, "MMMM d, yyyy") : "",
      progressType: goal.progressType,
      totalSteps: goal.totalSteps,
    });
    // Use setTimeout to ensure the input is rendered before focusing
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <PageTransition>
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
      <div className="p-8 mt-16">
        <div className="max-w-[1920px] mx-auto space-y-8 px-16 pb-[1000px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon
                icon="mingcute:target-fill"
                className="text-pri-pur-500 w-8 h-8"
                aria-hidden="true"
              />
              <h1 className="text-3xl font-bold text-neu-gre-800">Goals</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-4 text-base font-inter font-semibold bg-pri-pur-500 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md"
              aria-expanded={showForm}
              aria-controls="goal-form"
              aria-label="Add new goal"
            >
              <Icon
                icon="mingcute:add-fill"
                width={20}
                height={20}
                aria-hidden="true"
              />
              <span>Add Goal</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-neu-gre-600 text-center py-8">
              Loading goals...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-neu-gre-300/50 ${
                    goal.status === "completed"
                      ? "bg-sup-suc-100/75"
                      : "bg-neu-gre-200/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-neu-gre-800">
                        {goal.title}
                      </h3>
                      <p className="text-neu-gre-600 mt-1">
                        {goal.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(goal)}
                        className="text-neu-gre-600 hover:text-pri-pur-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md p-1"
                        aria-label={`Edit goal: ${goal.title}`}
                      >
                        <Icon
                          icon="mingcute:pencil-fill"
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-neu-gre-600 hover:text-sup-err-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md p-1"
                        aria-label={`Delete goal: ${goal.title}`}
                      >
                        <Icon
                          icon="mingcute:delete-2-fill"
                          width={20}
                          height={20}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>

                  {editingGoalId === goal.id ? (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      onSubmit={handleEditGoal}
                      className="space-y-4 mt-4"
                    >
                      <div>
                        <label
                          htmlFor={`title-${goal.id}`}
                          className="block text-neu-gre-800 mb-1 font-medium"
                        >
                          Title
                        </label>
                        <input
                          type="text"
                          id={`title-${goal.id}`}
                          ref={titleInputRef}
                          value={newGoal.title}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, title: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:ring-offset-2 transition-all duration-200"
                          required
                          aria-required="true"
                          aria-label="Goal title"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`description-${goal.id}`}
                          className="block text-neu-gre-800 mb-1 font-medium"
                        >
                          Description{" "}
                          <span className="text-sm font-normal text-neu-gre-600">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          id={`description-${goal.id}`}
                          value={newGoal.description}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:ring-offset-2 transition-all duration-200"
                          rows={3}
                          aria-label="Goal description"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`deadline-${goal.id}`}
                          className="block text-neu-gre-800 mb-1 font-medium"
                        >
                          Deadline{" "}
                          <span className="text-sm font-normal text-neu-gre-600">
                            (optional)
                          </span>
                        </label>
                        <DatePicker
                          value={newGoal.deadline}
                          onChange={(date) =>
                            setNewGoal({ ...newGoal, deadline: date })
                          }
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-4 text-base font-inter font-semibold bg-pri-pur-500 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGoalId(null);
                            setNewGoal({
                              title: "",
                              description: "",
                              deadline: "",
                              progressType: "percentage",
                              totalSteps: 10,
                            });
                          }}
                          className="px-4 py-2 text-base font-inter font-semibold bg-neu-gre-300 text-neu-gre-800 rounded-md hover:bg-neu-gre-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-neu-gre-800 font-inter font-medium">
                          <span className="flex items-center space-x-2 gap-2">
                            <Icon
                              icon="mingcute:loading-fill"
                              className="w-4 h-4"
                            />
                            Progress
                          </span>
                          <span>
                            {goal.progressType === "numerical"
                              ? `${goal.currentStep}/${goal.totalSteps}`
                              : `${goal.progress}%`}
                          </span>
                        </div>
                        <div className="h-2 bg-neu-gre-300 rounded-full overflow-hidden">
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
                              className="px-3 py-1 text-base font-inter font-semibold bg-neu-gre-300 text-neu-gre-800 rounded-md hover:bg-sup-err-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                              aria-label={`Decrease progress for ${goal.title} by 1 step`}
                            >
                              -1 Step
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateProgress(
                                  goal.id,
                                  goal.progress,
                                  "numerical",
                                  Math.min(
                                    goal.totalSteps,
                                    goal.currentStep + 1
                                  ),
                                  goal.totalSteps
                                )
                              }
                              className="px-3 py-1 text-base font-inter font-semibold bg-pri-pur-100 text-neu-gre-800 rounded-md hover:bg-pri-pur-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                              aria-label={`Increase progress for ${goal.title} by 1 step`}
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
                              className="px-3 py-1 text-base font-inter font-semibold bg-neu-gre-300 text-neu-gre-800 rounded-md hover:bg-sup-err-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                              aria-label={`Decrease progress for ${goal.title} by 10%`}
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
                              className="px-3 py-1 text-base font-inter font-semibold bg-pri-pur-100 text-neu-gre-800 rounded-md hover:bg-pri-pur-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                              aria-label={`Increase progress for ${goal.title} by 10%`}
                            >
                              +10%
                            </button>
                          </>
                        )}
                      </div>

                      {/* Associated Tasks */}
                      <div className="mt-4">
                        <h4 className="text-sm gap-2 mt-16 font-inter font-medium text-neu-gre-800 mb-2 flex items-center space-x-2">
                          <Icon icon="mingcute:link-fill" className="w-4 h-4" />
                          Associated Tasks
                        </h4>
                        {tasks[goal.id]?.length === 0 ? (
                          <p className="text-neu-gre-600 text-sm">
                            No tasks associated with this goal yet.
                          </p>
                        ) : (
                          <ul
                            className="space-y-2"
                            role="list"
                            aria-label={`Tasks for goal: ${goal.title}`}
                          >
                            {tasks[goal.id]?.map((task) => (
                              <li
                                key={task.id}
                                className="flex items-center justify-between bg-sec-rose-200 rounded-md p-2 cursor-pointer hover:bg-sec-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                                onClick={() => handleTaskClick(task)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleTaskClick(task);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`${task.title} - ${
                                  task.completed ? "Completed" : "In Progress"
                                }`}
                              >
                                <span
                                  className={`text-sm ml-2 font-inter font-regular ${
                                    task.completed
                                      ? "line-through text-neu-gre-500"
                                      : "text-neu-gre-800"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold mr-2 ${
                                    task.completed
                                      ? "bg-sup-suc-500 text-neu-whi-100"
                                      : "bg-neu-gre-200 text-neu-gre-800"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {task.completed ? "Done" : "In Progress"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-neu-gre-200">
                        <span className="text-neu-gre-600">
                          Deadline:{" "}
                          {goal.deadline instanceof Date
                            ? format(goal.deadline, "MMMM d, yyyy")
                            : "None, no stress"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            goal.status === "completed"
                              ? "bg-sup-suc-500 text-neu-whi-100"
                              : "bg-sup-sys-100 text-neu-gre-800"
                          }`}
                        >
                          {goal.status}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              <AnimatePresence mode="wait">
                {goals.length === 0 && !showForm && (
                  <motion.div
                    key="no-goals-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-neu-gre-600 font-inter text-center py-8 col-span-full"
                  >
                    There are no goals yet. Click the button below to get
                    started.
                  </motion.div>
                )}
                <motion.div
                  key="form-container"
                  initial={false}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="overflow-hidden"
                >
                  {showForm ? (
                    <div className="bg-pri-pur-100/30 rounded-xl p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-pri-pur-300/25">
                      <form onSubmit={handleCreateGoal} className="space-y-4">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-neu-gre-800 mb-1 font-medium"
                          >
                            Title
                          </label>
                          <input
                            type="text"
                            id="title"
                            ref={titleInputRef}
                            value={newGoal.title}
                            onChange={(e) =>
                              setNewGoal({ ...newGoal, title: e.target.value })
                            }
                            placeholder={titlePlaceholder}
                            className="w-full px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 transition-all duration-200"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-neu-gre-800 mb-1 font-medium"
                          >
                            Description{" "}
                            <span className="text-sm font-normal text-neu-gre-600">
                              (optional)
                            </span>
                          </label>
                          <textarea
                            id="description"
                            value={newGoal.description}
                            onChange={(e) =>
                              setNewGoal({
                                ...newGoal,
                                description: e.target.value,
                              })
                            }
                            placeholder="What's your game plan? Break it down into bite-sized pieces. 🎯"
                            className="w-full px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 transition-all duration-200"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="deadline"
                            className="block text-neu-gre-800 mb-1 font-medium"
                          >
                            Deadline{" "}
                            <span className="text-sm font-normal text-neu-gre-600">
                              (optional)
                            </span>
                          </label>
                          <DatePicker
                            value={newGoal.deadline}
                            onChange={(date) =>
                              setNewGoal({ ...newGoal, deadline: date })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-neu-gre-800 mb-1 font-medium">
                            Track progress as
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
                                    progressType: e.target
                                      .value as ProgressType,
                                  })
                                }
                                className="w-4 h-4 text-pri-pur-500 border-2 border-neu-gre-300 focus:ring-2 focus:ring-pri-focus-500 transition-all duration-200 accent-pri-pur-500"
                                aria-label="Track progress as percentage"
                              />
                              <span className="text-neu-gre-800">
                                Percentage
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                value="numerical"
                                checked={newGoal.progressType === "numerical"}
                                onChange={(e) =>
                                  setNewGoal({
                                    ...newGoal,
                                    progressType: e.target
                                      .value as ProgressType,
                                  })
                                }
                                className="w-4 h-4 text-pri-pur-500 border-2 border-neu-gre-300 focus:ring-2 focus:ring-pri-focus-500 transition-all duration-200 accent-pri-pur-500"
                                aria-label="Track progress as steps"
                              />
                              <span className="text-neu-gre-800">Steps</span>
                            </label>
                          </div>
                        </div>

                        {newGoal.progressType === "numerical" && (
                          <div>
                            <div>
                              <label
                                htmlFor="totalSteps"
                                className="block text-neu-gre-800 mb-1 font-medium"
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
                                placeholder="How many steps to greatness? 🚀"
                                className="w-full px-4 py-2 bg-neu-whi-100 rounded-md text-neu-gre-800 ring-2 ring-neu-gre-300 focus:outline-none focus:ring-2 focus:ring-pri-focus-500 transition-all duration-200"
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-4 text-base font-inter font-semibold bg-pri-pur-500 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                          >
                            Create Goal
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-4 text-base font-inter font-semibold bg-neu-gre-100 text-neu-gre-800 rounded-md hover:bg-neu-gre-300 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div
                      className="bg-pri-pur-100/25 rounded-5xl p-6 space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-dashed border-pri-pur-500/50 cursor-pointer"
                      onClick={() => setShowForm(!showForm)}
                    >
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-neu-gre-600 hover:text-pri-pur-500 transition-colors">
                        <Icon
                          icon="mingcute:add-fill"
                          className="w-12 h-12 mb-4"
                        />
                        <span className="text-lg font-medium">Add Goal</span>
                        <span className="text-sm mt-2">
                          Click to create a new goal
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
