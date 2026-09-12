"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { LIST_ICONS } from "../../lib/listIcons";

interface ListIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  onClose: () => void;
}

export function ListIconPicker({
  value,
  onChange,
  onClose,
}: ListIconPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-lg border border-neu-gre-200 bg-neu-whi-100 p-2 shadow-lg dark:border-neu-gre-600 dark:bg-neu-gre-800"
      role="listbox"
      aria-label="Choose list icon"
    >
      <div className="grid grid-cols-5 gap-1">
        {LIST_ICONS.map((icon) => {
          const isSelected = icon === value;
          return (
            <button
              key={icon}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={icon.replace("mingcute:", "").replace(/-/g, " ")}
              onClick={() => {
                onChange(icon);
                onClose();
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 ${
                isSelected
                  ? "bg-pri-blue-200 text-pri-blue-800 dark:bg-pri-pur-700 dark:text-neu-whi-100"
                  : "text-neu-gre-700 hover:bg-neu-gre-200 dark:text-neu-gre-300 dark:hover:bg-pri-pur-700/50"
              }`}
            >
              <Icon icon={icon} width={18} height={18} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
