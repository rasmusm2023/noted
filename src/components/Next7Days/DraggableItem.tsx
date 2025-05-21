import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import type { Task, SectionItem } from "../../types/task";

type ListItem = Task | SectionItem;

type DragItem = {
  id: string;
  type: string;
  index: number;
  dayIndex: number;
  item: ListItem;
};

interface DraggableItemProps {
  item: ListItem;
  index: number;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceDay: number,
    targetDay: number
  ) => void;
  isTaskItem: boolean;
  renderTask: (task: Task, dayIndex: number) => JSX.Element;
  renderSection: (section: SectionItem) => JSX.Element;
  isTask: (item: ListItem) => item is Task;
  dayIndex: number;
}

export const DraggableItem = ({
  item,
  index,
  moveItem,
  isTaskItem,
  renderTask,
  renderSection,
  isTask,
  dayIndex,
}: DraggableItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: item.type, index, dayIndex, item },
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
    collect: (monitor: DropTargetMonitor) => {
      const isOver = monitor.isOver();
      const canDrop = monitor.canDrop();
      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      let dropPosition: "before" | "after" | null = null;
      if (isOver && hoverBoundingRect && clientOffset) {
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        // Make the top 40% of the item a "before" drop zone
        dropPosition = hoverClientY < hoverMiddleY * 0.8 ? "before" : "after";
      }

      return { isOver, canDrop, dropPosition };
    },
    canDrop: (draggedItem: DragItem) => {
      return !(draggedItem.id === item.id && draggedItem.dayIndex === dayIndex);
    },
    hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      const sourceDay = draggedItem.dayIndex;
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

      // Make the drop zones more forgiving by using 40% of the item height
      const dropThreshold = hoverMiddleY * 0.8;

      // For same-day moves, only perform the move when the mouse has crossed the threshold
      if (sourceDay === targetDay) {
        // If we're moving an item down, only move when we've crossed the threshold
        if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
        // If we're moving an item up, only move when we've crossed the threshold
        if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;
      }

      // For cross-day moves, always allow the move
      moveItem(dragIndex, hoverIndex, sourceDay, targetDay);

      // Update the dragged item's index and day
      draggedItem.index = hoverIndex;
      draggedItem.dayIndex = targetDay;
    },
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
      {item.type === "section"
        ? renderSection(item as SectionItem)
        : isTaskItem
        ? renderTask(item as Task, dayIndex)
        : null}
    </div>
  );
};
