import { Icon } from "@iconify/react";
import { useRef, useState, useEffect } from "react";

interface SortMenuButtonProps {
  completedPosition: "top" | "bottom" | "mixed";
  onCompletedPositionChange: (position: "top" | "bottom" | "mixed") => void;
}

export const SortMenuButton = ({
  completedPosition,
  onCompletedPositionChange,
}: SortMenuButtonProps) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={sortMenuRef}>
      <button
        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
        className="px-4 py-4 bg-sec-pea-500/25 text-neu-gre-700 border border-sec-rose-900 rounded-lg hover:bg-sec-pea-500/50 transition-colors flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sec-rose-500"
      >
        {completedPosition === "mixed" ? (
          <Icon
            icon="mingcute:align-vertical-center-fill"
            width={20}
            height={20}
            color="currentColor"
          />
        ) : completedPosition === "top" ? (
          <Icon
            icon="mingcute:align-top-fill"
            width={20}
            height={20}
            color="currentColor"
          />
        ) : (
          <Icon
            icon="mingcute:align-bottom-fill"
            width={20}
            height={20}
            color="currentColor"
          />
        )}
        <span className="text-base font-inter">
          {completedPosition === "mixed"
            ? "Custom Order"
            : completedPosition === "top"
            ? "Completed on Top"
            : "Completed on Bottom"}
        </span>
      </button>
      {isSortMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neu-whi-100 border border-neu-bla-800 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onCompletedPositionChange("mixed");
                localStorage.setItem("completedPosition", "mixed");
                setIsSortMenuOpen(false);
              }}
              className={`w-full font-inter text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-tea-500 ${
                completedPosition === "mixed"
                  ? "text-pri-tea-500"
                  : "text-neu-bla-800 hover:bg-pri-tea-100"
              }`}
            >
              <Icon
                icon="mingcute:align-vertical-center-fill"
                width={20}
                height={20}
                color="currentColor"
              />
              <span>Custom Order</span>
            </button>
            <button
              onClick={() => {
                onCompletedPositionChange("top");
                localStorage.setItem("completedPosition", "top");
                setIsSortMenuOpen(false);
              }}
              className={`w-full font-inter text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-tea-500 ${
                completedPosition === "top"
                  ? "text-pri-tea-500"
                  : "text-neu-bla-800 hover:bg-pri-tea-100"
              }`}
            >
              <Icon
                icon="mingcute:align-top-fill"
                width={20}
                height={20}
                color="currentColor"
              />
              <span>Completed on Top</span>
            </button>
            <button
              onClick={() => {
                onCompletedPositionChange("bottom");
                localStorage.setItem("completedPosition", "bottom");
                setIsSortMenuOpen(false);
              }}
              className={`w-full font-inter text-left px-4 py-2 text-base flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-tea-500 ${
                completedPosition === "bottom"
                  ? "text-pri-tea-500"
                  : "text-neu-bla-800 hover:bg-pri-tea-100"
              }`}
            >
              <Icon
                icon="mingcute:align-bottom-fill"
                width={20}
                height={20}
                color="currentColor"
              />
              <span>Completed on Bottom</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
