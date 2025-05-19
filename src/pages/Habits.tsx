import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { aiService } from "../services/aiService";
import { Icon } from "@iconify/react";
import { PageTransition } from "../components/PageTransition";

interface Habit {
  id: string;
  name: string;
  frequency: string;
  streak: number;
  lastCompleted: string;
}

export function Habits() {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadHabits();
      loadAIInsights();
    }
  }, [currentUser]);

  const loadHabits = async () => {
    // TODO: Implement actual habit loading
    setIsLoading(false);
  };

  const loadAIInsights = async () => {
    if (!currentUser) return;
    try {
      const analysis = await aiService.analyzeHabits(currentUser.uid);
      setAiInsights(analysis);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!currentUser) return;
    try {
      const newSuggestions = await aiService.getHabitSuggestions(
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
            <h1 className="text-3xl font-bold text-neu-100">Habits</h1>
            <button
              onClick={handleGetSuggestions}
              className="px-4 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors flex items-center space-x-2"
            >
              <Icon icon="mingcute:magic-fill" width={20} height={20} />
              <span>Get AI Suggestions</span>
            </button>
          </div>

          {/* AI Insights Panel */}
          {aiInsights && (
            <div className="bg-neu-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-neu-100">
                AI Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neu-300">Patterns</h3>
                  <div className="space-y-2">
                    <p className="text-neu-400">
                      {aiInsights.patterns.frequency}
                    </p>
                    <p className="text-neu-400">
                      {aiInsights.patterns.consistency}
                    </p>
                    <p className="text-neu-400">{aiInsights.patterns.impact}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neu-300">
                    Recommendations
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {aiInsights.recommendations.map(
                      (rec: string, index: number) => (
                        <li key={index} className="text-neu-400">
                          {rec}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions Panel */}
          {showSuggestions && (
            <div className="bg-neu-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-neu-100 mb-4">
                Suggested Habits
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

          {/* Habits List */}
          <div className="bg-neu-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-neu-100 mb-4">
              Your Habits
            </h2>
            {isLoading ? (
              <div className="text-neu-400">Loading habits...</div>
            ) : habits.length === 0 ? (
              <div className="text-neu-400">
                No habits yet. Add some to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {/* TODO: Implement habit list */}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
