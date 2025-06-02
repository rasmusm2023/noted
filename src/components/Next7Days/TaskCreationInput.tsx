import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import type { Task } from "../../types/task";

interface TaskCreationInputProps {
  dayIndex: number;
  onAddTask: (dayIndex: number, title: string, task?: Task) => void;
}

export const TaskCreationInput = ({
  dayIndex,
  onAddTask,
}: TaskCreationInputProps) => {
  const [localInput, setLocalInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        className={`p-4 bg-pri-pur-500/10 dark:bg-pri-pur-500/20 rounded-md hover:bg-neu-whi-100 dark:hover:bg-neu-gre-800 transition-colors border-2 ${
          isFocused
            ? "border-solid border-pri-pur-500 dark:border-pri-pur-400 bg-pri-pur-500/20 dark:bg-pri-pur-500/30"
            : "border-dashed border-pri-pur-500/75 dark:border-pri-pur-500/50"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-1 bg-pri-pur-500 dark:bg-pri-pur-400 rounded-sm flex items-center justify-center">
            <Icon
              icon="mingcute:add-fill"
              width={16}
              height={16}
              color="#FFF5F8"
            />
          </div>
          <div className="text-left font-inter text-sm flex-1">
            <input
              ref={inputRef}
              type="text"
              value={localInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="New task"
              className="w-full bg-transparent font-semibold text-neu-gre-800 dark:text-neu-gre-100 placeholder-neu-gre-600 dark:placeholder-neu-gre-400 focus-visible:outline-none"
            />
            <p className="text-neu-gre-500 dark:text-neu-gre-400 text-xs font-inter mt-2">
              Press Enter to add
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
