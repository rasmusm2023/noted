import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";

interface SectionCreationInputProps {
  dayIndex: number;
  onSectionAdded: () => void;
}

export const SectionCreationInput = ({
  dayIndex,
  onSectionAdded,
}: SectionCreationInputProps) => {
  const { currentUser } = useAuth();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [localTime, setLocalTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
    if (cleaned.length <= 5) {
      setLocalTime(cleaned);
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

  const handleAddSection = async () => {
    if (isSubmitting) return;

    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    const title = localTitle.trim();
    const time = formatTimeFromInput(localTime.trim());

    if (!title || !time) {
      console.error("Missing required fields:", { title, time });
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate the date for this section based on dayIndex
      const date = new Date();
      date.setDate(date.getDate() + dayIndex);
      date.setHours(12, 0, 0, 0);

      console.log("Creating section for date:", date.toLocaleString());

      // Create section in database
      await taskService.createSection(currentUser.uid, {
        text: title,
        time: time,
        scheduledTime: date.toLocaleString(),
      });

      // Reset form
      setLocalTitle("");
      setLocalTime("");
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }

      // Notify parent
      onSectionAdded();
    } catch (error) {
      console.error("Error creating section:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSection();
    } else if (e.key === "Escape") {
      setLocalTitle("");
      setLocalTime("");
    }
  };

  return (
    <div
      className={`flex items-center space-x-4 bg-neu-900/50 rounded-lg p-4 transition-all duration-200 ${
        isFocused ? "ring-2 ring-pri-blue-500" : ""
      }`}
    >
      <div className="p-2 bg-pri-pur-500 rounded-lg flex items-center justify-center">
        <Icon
          icon="mingcute:dividing-line-fill"
          className="w-5 h-5 text-white"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <input
            ref={titleInputRef}
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add a section..."
            className="w-[calc(100%-4rem)] bg-transparent text-base font-inter font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
          />
          <input
            ref={timeInputRef}
            type="text"
            value={localTime}
            onChange={handleTimeChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="09.00"
            maxLength={5}
            className="w-16 bg-transparent text-base font-outfit font-semibold text-neu-100 placeholder-neu-400 focus:outline-none text-right"
          />
        </div>
        <p className="text-sm font-outfit text-neu-600 mt-2">
          Press Enter to add
        </p>
      </div>
    </div>
  );
};
