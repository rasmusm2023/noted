import {
  Sort,
  AlignTop,
  AlignBottom,
  AlignVerticalCenter,
  TrashBinTrash,
} from "solar-icon-set";
import { useRef, useState } from "react";

interface TaskProgressProps {
  completionPercentage: number;
  completedPosition: "top" | "bottom" | "mixed";
  onCompletedPositionChange: (position: "top" | "bottom" | "mixed") => void;
  onClearCompleted: () => void;
}

export const TaskProgress = ({
  completionPercentage,
  completedPosition,
  onCompletedPositionChange,
  onClearCompleted,
}: TaskProgressProps) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-8">
        <h2 className="text-2xl font-outfit font-semibold text-neu-100">
          Today
        </h2>
        <div className="hidden 2xl:flex items-center gap-2">
          <div className="w-[300px] h-2 bg-sup-suc-900 rounded-full">
            <div
              className="h-full bg-sup-suc-500 rounded-full"
              style={{
                width: `${completionPercentage}%`,
              }}
            ></div>
          </div>
          <span className="text-base font-outfit text-neu-400">
            {completionPercentage}%
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="px-4 py-2 bg-neu-700 text-neu-400 rounded-lg hover:bg-neu-600 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
          >
            <Sort
              size={20}
              color="currentColor"
              autoSize={false}
              iconStyle="Broken"
            />
            <span className="text-base font-outfit">Sort</span>
          </button>
          {isSortMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-neu-700 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onCompletedPositionChange("top");
                    localStorage.setItem("completedPosition", "top");
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                    completedPosition === "top"
                      ? "text-pri-blue-500"
                      : "text-neu-400 hover:bg-neu-600"
                  }`}
                >
                  <AlignTop
                    size={20}
                    color="currentColor"
                    autoSize={false}
                    iconStyle="Broken"
                  />
                  <span>Completed on Top</span>
                </button>
                <button
                  onClick={() => {
                    onCompletedPositionChange("bottom");
                    localStorage.setItem("completedPosition", "bottom");
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                    completedPosition === "bottom"
                      ? "text-pri-blue-500"
                      : "text-neu-400 hover:bg-neu-600"
                  }`}
                >
                  <AlignBottom
                    size={20}
                    color="currentColor"
                    autoSize={false}
                    iconStyle="Broken"
                  />
                  <span>Completed on Bottom</span>
                </button>
                <button
                  onClick={() => {
                    onCompletedPositionChange("mixed");
                    localStorage.setItem("completedPosition", "mixed");
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                    completedPosition === "mixed"
                      ? "text-pri-blue-500"
                      : "text-neu-400 hover:bg-neu-600"
                  }`}
                >
                  <AlignVerticalCenter
                    size={20}
                    color="currentColor"
                    autoSize={false}
                    iconStyle="Broken"
                  />
                  <span>Custom Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClearCompleted}
          className="px-4 py-2 bg-neu-700 text-neu-400 rounded-lg hover:bg-neu-600 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
        >
          <TrashBinTrash size={20} color="currentColor" autoSize={false} />
          <span className="text-base font-outfit">Clear completed</span>
        </button>
      </div>
    </div>
  );
};
