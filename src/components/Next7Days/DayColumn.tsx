import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import type { Task } from "../../types/task";
import { TaskCreationInput } from "./TaskCreationInput";
import { TaskLibraryButton } from "../Buttons/TaskLibraryButton";
import { Icon } from "@iconify/react";

interface DayColumnProps {
  day: {
    id: string;
    date: Date;
    items: Task[];
  };
  dayIndex: number;
  isLoading: boolean;
  hidingItems: Set<string>;
  onAddTask: (dayIndex: number, title: string, task?: Task) => void;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => void;
  renderTask: (task: Task, dayIndex: number) => React.ReactElement;
  sortItems: (items: Task[]) => Task[];
}

type DragItem = {
  id: string;
  type: string;
  index: number;
  dayIndex: number;
  item: Task;
};

const DraggableItem = ({
  item,
  index,
  moveItem,
  renderTask,
  dayIndex,
}: {
  item: Task;
  index: number;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => void;
  renderTask: (task: Task, dayIndex: number) => React.ReactElement;
  dayIndex: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: "task", index, dayIndex, item },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true,
  });

  const [{ isOver, canDrop, dropPosition }, drop] = useDrop<
    DragItem,
    void,
    {
      isOver: boolean;
      canDrop: boolean;
      dropPosition: "before" | "after" | null;
    }
  >({
    accept: "ITEM",
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceDay = item.dayIndex;
      const targetDay = dayIndex;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceDay === targetDay) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      const isDraggingDown = dragIndex < hoverIndex;
      const isDraggingUp = dragIndex > hoverIndex;

      if (isDraggingDown && hoverClientY < hoverMiddleY) {
        return;
      }
      if (isDraggingUp && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex, sourceDay, targetDay);

      // Update the dragged item's index and day
      item.index = hoverIndex;
      item.dayIndex = targetDay;
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      dropPosition: monitor.isOver()
        ? monitor.getClientOffset()!.y <
          (ref.current?.getBoundingClientRect().top || 0) +
            (ref.current?.getBoundingClientRect().height || 0) / 2
          ? "before"
          : "after"
        : null,
    }),
  });

  // Combine drag and drop refs
  drag(drop(ref));

  const opacity = isDragging ? 0.4 : 1;

  // Enhanced visual feedback for drop zones
  const getDropZoneStyles = () => {
    if (!isOver || !canDrop) return {};

    const baseStyle = {
      position: "relative" as const,
      transition: "all 0.2s ease-in-out",
    };

    if (dropPosition === "before") {
      return {
        ...baseStyle,
        borderTop: "2px solid theme(colors.pri-pur.500)",
        marginTop: "2px",
      };
    } else if (dropPosition === "after") {
      return {
        ...baseStyle,
        borderBottom: "2px solid theme(colors.pri-pur.500)",
        marginBottom: "2px",
      };
    }

    return baseStyle;
  };

  return (
    <div
      ref={ref}
      style={{
        opacity,
        ...getDropZoneStyles(),
      }}
      className={`transition-all duration-200 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${isOver && canDrop ? "bg-pri-pur-500/5" : ""}`}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-dropeffect="move"
    >
      {renderTask(item, dayIndex)}
    </div>
  );
};

const EmptyDayDropZone = ({
  dayIndex,
  moveItem,
}: {
  dayIndex: number;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    drop: (item: DragItem) => {
      moveItem(item.index, 0, item.dayIndex, dayIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`text-center text-neu-600 dark:text-neu-whi-100/70 py-4 min-h-[100px] border-2 border-dashed border-neu-gre-300 dark:border-neu-gre-600 rounded-lg transition-all duration-200 
        ${
          isOver && canDrop
            ? "border-pri-pur-500 dark:border-pri-pur-400 bg-pri-pur-500/5 dark:bg-pri-pur-500/10 shadow-lg scale-[1.02]"
            : "hover:border-pri-pur-500 dark:hover:border-pri-pur-400 hover:bg-pri-pur-500/5 dark:hover:bg-pri-pur-500/10"
        }`}
      role="status"
    >
      <div className="flex flex-col items-center justify-center h-full space-y-2">
        <Icon
          icon="mingcute:add-fill"
          className="w-6 h-6 text-pri-pur-300 dark:text-pri-pur-400"
          aria-hidden="true"
        />
        <p className="text-sm font-inter">No tasks for this day yet.</p>
      </div>
    </div>
  );
};

export const DayColumn = ({
  day,
  dayIndex,
  isLoading,
  hidingItems,
  onAddTask,
  moveItem,
  renderTask,
  sortItems,
}: DayColumnProps) => {
  const isToday = dayIndex === 0;
  const isTomorrow = dayIndex === 1;

  return (
    <div
      key={day.date.toISOString()}
      className={`flex-shrink-0 w-[380px] lg:w-[320px] ${
        dayIndex > 1 ? "mt-7" : ""
      }`}
      role="region"
      aria-label={`Tasks for ${day.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}`}
    >
      {/* Add Today/Tomorrow label */}
      {isToday && (
        <div>
          <span
            className="inline-block px-4 py-1 bg-sec-pea-500 text-neu-whi-100 text-base font-inter font-medium rounded-t-lg shadow-lg dark:bg-sec-pea-600"
            role="status"
          >
            Today
          </span>
        </div>
      )}
      {isTomorrow && (
        <div>
          <span
            className="inline-block px-4 py-1 bg-pri-pur-500 text-neu-whi-100 text-base font-inter font-medium rounded-t-lg shadow-lg dark:bg-pri-pur-600"
            role="status"
          >
            Tomorrow
          </span>
        </div>
      )}
      <div
        className={`py-4 px-2 h-fit shadow-lg ${
          dayIndex <= 1
            ? dayIndex === 0
              ? "bg-gradient-to-b from-sec-pea-500/15 to-neu-gre-300/70 dark:from-sec-pea-500/10 dark:to-neu-gre-700/50 rounded-tr-xl rounded-br-xl rounded-bl-xl"
              : "bg-gradient-to-b from-pri-pur-500/15 to-neu-gre-300/70 dark:from-pri-pur-500/10 dark:to-neu-gre-700/50 rounded-tr-xl rounded-br-xl rounded-bl-xl"
            : "bg-neu-gre-300/50 dark:bg-neu-gre-700/50 rounded-xl"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-neu-gre-800 dark:text-neu-whi-100">
                {day.date.toLocaleDateString("en-US", { weekday: "long" })}
              </h2>
              <span
                className="text-sm text-neu-gre-600 dark:text-neu-whi-100/70"
                aria-label={`Date: ${day.date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}`}
              >
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
              onRemoveTask={async () => {
                // Handle task removal if needed
              }}
              variant="next7days"
              selectedDate={day.date}
              aria-label={`Add task from library for ${day.date.toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" }
              )}`}
            />
          </div>

          {/* Task creation */}
          <div className="mb-4 px-4">
            <TaskCreationInput
              dayIndex={dayIndex}
              onAddTask={onAddTask}
              aria-label={`Add new task for ${day.date.toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" }
              )}`}
            />
          </div>

          {/* Tasks and Sections */}
          <div
            className="space-y-4 px-4 mb-4"
            role="list"
            aria-label={`Task list for ${day.date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}`}
          >
            {isLoading ? (
              <div
                className="text-neu-400 dark:text-neu-whi-100/70"
                role="status"
              >
                Loading tasks...
              </div>
            ) : day.items.length === 0 ? (
              <EmptyDayDropZone dayIndex={dayIndex} moveItem={moveItem} />
            ) : (
              sortItems(day.items).map((item, index) => {
                const isHiding = hidingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`relative task-item transition-all duration-300 ${
                      isHiding ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    }`}
                    role="listitem"
                  >
                    <DraggableItem
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      renderTask={renderTask}
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
