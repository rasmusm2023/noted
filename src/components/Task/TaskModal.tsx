import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { goalService } from "../../services/goalService";
import type { Goal } from "../../services/goalService";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    goalId?: string;
  }) => void;
}

export const TaskModal = ({ isOpen, onClose, onSave }: TaskModalProps) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadGoals();
    }
  }, [isOpen, currentUser]);

  const loadGoals = async () => {
    if (!currentUser) return;
    try {
      const userGoals = await goalService.getUserGoals(currentUser.uid);
      setGoals(userGoals.filter((goal) => goal.status === "active"));
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      goalId: selectedGoalId,
    });
    setTitle("");
    setDescription("");
    setSelectedGoalId(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-neu-800 rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neu-100">Add Task</h2>
          <button
            onClick={onClose}
            className="text-neu-400 hover:text-neu-200 transition-colors"
          >
            <Icon icon="mingcute:close-fill" width={24} height={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-neu-300 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-neu-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="goal" className="block text-neu-300 mb-2">
              Related Goal
            </label>
            <select
              id="goal"
              value={selectedGoalId || ""}
              onChange={(e) => setSelectedGoalId(e.target.value || undefined)}
              className="w-full px-4 py-2 bg-neu-700 rounded-lg text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
            >
              <option value="">No goal selected</option>
              {isLoading ? (
                <option value="" disabled>
                  Loading goals...
                </option>
              ) : goals.length === 0 ? (
                <option value="" disabled>
                  No active goals
                </option>
              ) : (
                goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neu-300 hover:text-neu-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors"
            >
              Save Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
