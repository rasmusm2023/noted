import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

interface QuickActionsProps {
  onAddTask: (title: string, description: string) => void;
  onAddSection: (title: string, time: string) => void;
}

export const QuickActions = ({
  onAddTask,
  onAddSection,
}: QuickActionsProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionTime, setNewSectionTime] = useState("");
  const [focusedInput, setFocusedInput] = useState<"task" | "section" | null>(
    null
  );
  const taskInputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        onAddTask(newTaskTitle.trim(), newTaskDescription.trim());
        setNewTaskTitle("");
        setNewTaskDescription("");
        if (taskInputRef.current) {
          taskInputRef.current.focus();
        }
      }
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      setNewTaskDescription("");
    }
  };

  const handleSectionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newSectionTitle.trim() && newSectionTime.trim()) {
        // First format the time
        const formattedTime = formatTimeFromInput(newSectionTime);
        // Then send the formatted time to create the section
        onAddSection(newSectionTitle.trim(), formattedTime);
        // Finally clear both inputs
        setNewSectionTitle("");
        setNewSectionTime("");
        // Focus back on the section input
        if (sectionInputRef.current) {
          sectionInputRef.current.focus();
        }
      }
    } else if (e.key === "Escape") {
      setNewSectionTitle("");
      setNewSectionTime("");
    }
  };

  const formatTimeFromInput = (input: string): string => {
    // Allow only numbers and specific symbols
    const cleaned = input.replace(/[^0-9.,:;-]/g, "");

    if (cleaned.length === 0) return "";

    // Split by any of the allowed separators
    const parts = cleaned.split(/[.,:;-]/);
    const numbers = parts.join("").replace(/\D/g, "");

    if (numbers.length === 0) return "";

    // Handle different input lengths
    if (numbers.length <= 2) {
      // Just hours
      const hours = parseInt(numbers);
      if (hours > 23) return "23:00";
      return `${hours.toString().padStart(2, "0")}:00`;
    } else if (numbers.length <= 4) {
      // Hours and minutes
      const hours = parseInt(numbers.slice(0, -2));
      const minutes = parseInt(numbers.slice(-2));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else {
      // Too many digits, take first 4
      const hours = parseInt(numbers.slice(0, 2));
      const minutes = parseInt(numbers.slice(2, 4));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
  };

  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow numbers and specific symbols
    const cleaned = input.replace(/[^0-9.,:;-]/g, "");

    if (cleaned.length <= 5) {
      setNewSectionTime(cleaned);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        className={`p-6 bg-neu-whi-100 rounded-lg hover:bg-pri-tea-100 transition-colors border border-pri-tea-300 ${
          focusedInput === "task" ? "ring-2 ring-pri-tea-400" : ""
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-pri-tea-400 rounded-lg flex items-center justify-center">
            <Icon
              icon="mingcute:add-fill"
              width={32}
              height={32}
              color="#E0FAF7"
            />
          </div>
          <div className="text-left font-outfit text-base flex-1">
            <input
              ref={taskInputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleTaskKeyPress}
              onFocus={() => setFocusedInput("task")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Add new task..."
              className="w-full bg-transparent font-semibold text-pri-tea-900 placeholder-neu-gre-500 focus:outline-none"
              autoFocus
            />
            <p className="text-neu-gre-500 text-sm font-outfit mt-2">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>

      <div
        className={`p-6 bg-neu-whi-100 rounded-lg hover:bg-pri-tea-100 transition-colors border border-pri-tea-300 ${
          focusedInput === "section" ? "ring-2 ring-pri-tea-400" : ""
        }`}
      >
        <div className="flex items-center">
          <div className="p-2 bg-pri-tea-400 rounded-lg flex items-center justify-center">
            <Icon
              icon="mingcute:dividing-line-fill"
              width={32}
              height={32}
              color="#E0FAF7"
            />
          </div>
          <div className="flex-1 ml-4 mr-4">
            <div className="flex items-center text-base font-outfit">
              <input
                ref={sectionInputRef}
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={handleSectionKeyPress}
                onFocus={() => setFocusedInput("section")}
                onBlur={() => setFocusedInput(null)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add a section..."
                className="w-full bg-transparent text-base font-semibold text-pri-tea-900 placeholder-neu-gre-500 focus:outline-none"
              />
              <input
                type="text"
                value={newSectionTime}
                onChange={handleTimeInput}
                onKeyDown={handleSectionKeyPress}
                placeholder="09.00"
                maxLength={5}
                className="w-full bg-transparent text-md font-semibold text-pri-tea-900 placeholder-neu-gre-500 focus:outline-none text-right"
              />
            </div>
            <p className="text-neu-gre-500 font-outfit text-sm mt-2">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
