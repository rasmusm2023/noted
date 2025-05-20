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
          <div className="flex flex-1 gap-4 items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-test-500 to-orange-test-500 bg-clip-text text-transparent">
              Habits
            </h1>
            <p className="text-4xl text-neu-gre-800">is not available yet.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
