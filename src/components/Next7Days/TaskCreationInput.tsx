import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface TaskCreationInputProps {
  dayIndex: number;
  onAddTask: (dayIndex: number, title: string) => void;
}

export const TaskCreationInput = ({
  dayIndex,
  onAddTask,
}: TaskCreationInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalInput(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (localInput.trim()) {
        onAddTask(dayIndex, localInput);
        setLocalInput("");
      }
    } else if (e.key === "Escape") {
      setLocalInput("");
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div
        className={`flex items-center space-x-4 bg-neu-900/50 rounded-lg p-4 transition-all duration-200 ${
          isFocused ? "ring-2 ring-pri-blue-500" : ""
        }`}
      >
        <div className="p-2 bg-pri-blue-700 rounded-lg flex items-center justify-center">
          <Icon icon="mingcute:add-fill" className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add new task..."
            className="w-full bg-transparent text-base font-outfit font-semibold text-neu-100 placeholder-neu-400 focus:outline-none"
          />
          <p className="text-sm font-outfit text-neu-600 mt-2">
            Press Enter to add
          </p>
        </div>
      </div>
    </div>
  );
};
