import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { aiService } from "../services/aiService";
import { Icon } from "@iconify/react";
import { PageTransition } from "../components/PageTransition";

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  status: "active" | "completed" | "archived";
}

export function Goals() {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadGoals();
      loadAIAnalysis();
    }
  }, [currentUser]);

  const loadGoals = async () => {
    // TODO: Implement actual goal loading
    setIsLoading(false);
  };

  const loadAIAnalysis = async () => {
    if (!currentUser) return;
    try {
      const analysis = await aiService.analyzeGoals(currentUser.uid);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Error loading AI analysis:", error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!currentUser) return;
    try {
      const newSuggestions = await aiService.getGoalSuggestions(
        currentUser.uid
      );
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
  };

  return (
    <PageTransition>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-neu-100">Goals</h1>
            <button
              onClick={handleGetSuggestions}
              className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors flex items-center space-x-2"
            >
              <Icon icon="mingcute:magic-fill" width={20} height={20} />
              <span>Get AI Suggestions</span>
            </button>
          </div>

          {/* AI Analysis Panel */}
          {aiAnalysis && (
            <div className="bg-neu-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-neu-100">
                AI Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neu-300">
                    Progress Overview
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neu-400">Overall Progress</span>
                      <span className="text-neu-100">
                        {aiAnalysis.progress}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neu-400">Predicted Completion</span>
                      <span className="text-neu-100">
                        {aiAnalysis.predictedCompletion}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neu-300">
                    Suggestions
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {aiAnalysis.suggestions.map(
                      (suggestion: string, index: number) => (
                        <li key={index} className="text-neu-400">
                          {suggestion}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* Milestones Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-neu-300 mb-4">
                  Milestones
                </h3>
                <div className="space-y-3">
                  {aiAnalysis.milestones.map(
                    (milestone: any, index: number) => (
                      <div
                        key={index}
                        className="bg-neu-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-neu-100 font-medium">
                            {milestone.title}
                          </h4>
                          <p className="text-neu-400 text-sm">
                            Due: {milestone.deadline}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            milestone.status === "completed"
                              ? "bg-sup-suc-500 text-white"
                              : "bg-neu-600 text-neu-300"
                          }`}
                        >
                          {milestone.status}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions Panel */}
          {showSuggestions && (
            <div className="bg-neu-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-neu-100 mb-4">
                Suggested Goals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-neu-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <span className="text-neu-300">{suggestion}</span>
                    <button className="text-pri-blue-400 hover:text-pri-blue-300">
                      <Icon icon="mingcute:add-fill" width={20} height={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="bg-neu-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-neu-100 mb-4">
              Your Goals
            </h2>
            {isLoading ? (
              <div className="text-neu-400">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="text-neu-400">
                No goals yet. Add some to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {/* TODO: Implement goals list */}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
