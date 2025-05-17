import { useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface TaskManagementHeaderProps {
  onClearCompleted: () => void;
  onStatsClick: () => void;
  completedPosition: "top" | "bottom" | "custom";
  onCompletedPositionChange: (position: "top" | "bottom" | "custom") => void;
}

export const TaskManagementHeader = ({
  onClearCompleted,
  onStatsClick,
  completedPosition,
  onCompletedPositionChange,
}: TaskManagementHeaderProps) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside of sort menu
  const handleClickOutside = (event: MouseEvent) => {
    if (
      sortMenuRef.current &&
      !sortMenuRef.current.contains(event.target as Node)
    ) {
      setIsSortMenuOpen(false);
    }
  };

  // Add click outside listener
  useState(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleSortOptionClick = (position: "top" | "bottom" | "custom") => {
    onCompletedPositionChange(position);
    localStorage.setItem("completedPosition", position);
    setIsSortMenuOpen(false);
  };

  return (
    <div className="flex-none pt-8 pb-8 bg-neu-900/30 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between pl-8 pr-8">
          <h1 className="text-4xl font-bold font-outfit text-neu-100">
            Next 7 Days
          </h1>
          <div className="bg-neu-600/50 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center space-x-2">
              {/* Add Stats button */}
              <button
                onClick={onStatsClick}
                className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
              >
                <Icon
                  icon="mingcute:chart-fill"
                  className="w-5 h-5 text-gray-400"
                />
                <span className="text-base font-outfit">Stats</span>
              </button>

              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
                >
                  <Icon
                    icon="mingcute:sort-fill"
                    className="w-5 h-5 text-gray-400"
                  />
                  <span className="text-base font-outfit">Sort</span>
                </button>
                {isSortMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neu-800 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleSortOptionClick("top")}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "top"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <Icon
                          icon="mingcute:align-top-fill"
                          className="w-5 h-5 text-gray-400"
                        />
                        <span>Completed on Top</span>
                      </button>
                      <button
                        onClick={() => handleSortOptionClick("bottom")}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "bottom"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <Icon
                          icon="mingcute:align-bottom-fill"
                          className="w-5 h-5 text-gray-400"
                        />
                        <span>Completed on Bottom</span>
                      </button>
                      <button
                        onClick={() => handleSortOptionClick("custom")}
                        className={`w-full font-outfit text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 ${
                          completedPosition === "custom"
                            ? "text-pri-blue-500"
                            : "text-neu-400 hover:bg-neu-700"
                        }`}
                      >
                        <Icon
                          icon="mingcute:align-vertical-center-fill"
                          className="w-5 h-5 text-gray-400"
                        />
                        <span>Custom Order</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={onClearCompleted}
                className="px-4 py-2 bg-neu-800 text-neu-400 rounded-lg hover:bg-neu-700 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500"
              >
                <Icon
                  icon="mingcute:delete-fill"
                  className="w-4 h-4 text-gray-400"
                />
                <span className="text-base font-outfit">Clear completed</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
