import type { Task, SectionItem } from "../../types/task";
import { TaskCreationInput } from "./TaskCreationInput";
import { SectionCreationInput } from "./SectionCreationInput";
import { DraggableItem } from "./DraggableItem";

interface DayColumnProps {
  day: {
    id: string;
    date: Date;
    items: (Task | SectionItem)[];
  };
  dayIndex: number;
  isLoading: boolean;
  hidingItems: Set<string>;
  onAddTask: (dayIndex: number, title: string) => void;
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

  return (
    <div
      key={day.date.toISOString()}
      className={`flex-shrink-0 w-[280px] ${dayIndex > 1 ? "mt-7" : ""}`}
    >
      {/* Add Today/Tomorrow label */}
      {isToday && (
        <div>
          <span className="inline-block px-4 py-1 bg-pri-blue-500 text-neu-100 text-base font-inter font-medium rounded-t-md">
            Today
          </span>
        </div>
      )}
      {isTomorrow && (
        <div>
          <span className="inline-block px-4 py-1 bg-pri-pur-500 text-neu-100 text-base font-inter font-medium rounded-t-md">
            Tomorrow
          </span>
        </div>
      )}
      <div
        className={`bg-neu-800/90 p-4 h-fit ${
          dayIndex <= 1
            ? "rounded-tr-lg rounded-br-lg rounded-bl-lg"
            : "rounded-lg"
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-inter font-semibold text-neu-100">
              {day.date.toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </h2>
            <p className="text-base font-inter text-neu-400">
              {day.date
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
                .toUpperCase()}
            </p>
          </div>

          {/* Task creation */}
          <div className="mb-2">
            <TaskCreationInput dayIndex={dayIndex} onAddTask={onAddTask} />
          </div>

          {/* Section creation */}
          <div className="mb-8 pb-8 border-b-2 border-neu-700/75">
            <SectionCreationInput
              dayIndex={dayIndex}
              onSectionAdded={onSectionAdded}
            />
          </div>

          {/* Tasks and Sections */}
          <div className="space-y-4">
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
                    className={`relative task-item ${
                      isHiding ? "hiding" : "showing"
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
