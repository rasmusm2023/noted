import type { Task, SectionItem } from "../../types/task";
import { TaskCreationInput } from "./TaskCreationInput";
import { DraggableItem } from "./DraggableItem";
import { TaskLibraryButton } from "../Buttons/TaskLibraryButton";

interface DayColumnProps {
  day: {
    id: string;
    date: Date;
    items: (Task | SectionItem)[];
  };
  dayIndex: number;
  isLoading: boolean;
  hidingItems: Set<string>;
  onAddTask: (dayIndex: number, title: string, task?: Task) => void;
  onSectionAdded: () => void;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => void;
  renderTask: (task: Task, dayIndex: number) => JSX.Element;
  renderSection: (section: SectionItem) => JSX.Element;
  isTask: (item: Task | SectionItem) => item is Task;
  sortItems: (items: (Task | SectionItem)[]) => (Task | SectionItem)[];
}

export const DayColumn = ({
  day,
  dayIndex,
  isLoading,
  hidingItems,
  onAddTask,
  onSectionAdded,
  moveItem,
  renderTask,
  renderSection,
  isTask,
  sortItems,
}: DayColumnProps) => {
  const isToday = dayIndex === 0;
  const isTomorrow = dayIndex === 1;

  const handleTaskSelect = (task: Task) => {
    onAddTask(dayIndex, task.title, task);
  };

  const handleRemoveTask = async (taskId: string) => {
    // This will be handled by the TaskLibraryButton component
  };

  return (
    <div
      key={day.date.toISOString()}
      className={`flex-shrink-0 w-[320px] ${dayIndex > 1 ? "mt-7" : ""}`}
    >
      {/* Add Today/Tomorrow label */}
      {isToday && (
        <div>
          <span className="inline-block px-4 py-1 bg-pri-pur-500 text-neu-whi-100 text-base font-inter font-medium rounded-t-lg shadow-lg">
            Today
          </span>
        </div>
      )}
      {isTomorrow && (
        <div>
          <span className="inline-block px-4 py-1 bg-sec-rose-500 text-neu-whi-100 text-base font-inter font-medium rounded-t-lg shadow-lg">
            Tomorrow
          </span>
        </div>
      )}
      <div
        className={`py-4 px-2 h-fit shadow-lg ${
          dayIndex <= 1
            ? dayIndex === 0
              ? "bg-gradient-to-b from-pri-pur-500/10 to-neu-gre-300/75 rounded-tr-xl rounded-br-xl rounded-bl-xl"
              : "bg-gradient-to-b from-sec-rose-500/10 to-neu-gre-300/75 rounded-tr-xl rounded-br-xl rounded-bl-xl"
            : "bg-neu-gre-300/75 rounded-xl"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-neu-gre-800">
                {day.date.toLocaleDateString("en-US", { weekday: "long" })}
              </h2>
              <span className="text-sm text-neu-gre-600">
                {day.date
                  .toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </span>
            </div>
            <TaskLibraryButton
              onTaskSelect={(task) => onAddTask(dayIndex, task.title, task)}
              onRemoveTask={async (taskId) => {
                // Handle task removal if needed
              }}
              variant="next7days"
              selectedDate={day.date}
            />
          </div>

          {/* Task creation */}
          <div className="mb-4 px-4">
            <TaskCreationInput dayIndex={dayIndex} onAddTask={onAddTask} />
          </div>

          {/* Tasks and Sections */}
          <div className="space-y-4 px-4 mb-4">
            {isLoading ? (
              <div className="text-neu-400">Loading tasks...</div>
            ) : day.items.length === 0 ? (
              <div className="text-center text-neu-600 py-4">
                <p className="text-sm font-inter">No tasks for this day</p>
              </div>
            ) : (
              sortItems(day.items).map((item, index) => {
                const isTaskItem = isTask(item);
                const isHiding = hidingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`relative task-item transition-all duration-300 ${
                      isHiding ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    }`}
                  >
                    <DraggableItem
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      isTaskItem={isTaskItem}
                      renderTask={renderTask}
                      renderSection={renderSection}
                      isTask={isTask}
                      dayIndex={dayIndex}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
