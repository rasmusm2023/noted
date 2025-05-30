import { useRef, useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import type { Task, SectionItem as SectionItemType } from "../../types/task";

type ListItem = Task | SectionItemType;

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
  renderSection: (section: SectionItemType) => JSX.Element;
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
  const lastMoveRef = useRef<{
    dragIndex: number;
    hoverIndex: number;
    sourceDay: number;
    targetDay: number;
  } | null>(null);
  const lastPositionRef = useRef<number | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: () => {
      console.log("Starting drag:", {
        itemId: item.id,
        itemType: item.type,
        index,
        dayIndex,
        title: isTask(item) ? item.title : "Section",
      });
      return { id: item.id, type: item.type, index, dayIndex, item };
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true,
  });

  const calculateDropPosition = useCallback(
    (hoverClientY: number, itemHeight: number, isFirstItem: boolean) => {
      // For first item, use a larger top zone to make it easier to drop at the start
      const topThreshold = isFirstItem ? itemHeight * 0.45 : itemHeight * 0.35;
      const bottomThreshold = isFirstItem
        ? itemHeight * 0.55
        : itemHeight * 0.65;

      // For first item, we want to make it easier to drop at the start
      if (isFirstItem) {
        if (hoverClientY < topThreshold) {
          return { position: "before" as const, targetIndex: 0 };
        } else if (hoverClientY > bottomThreshold) {
          return { position: "after" as const, targetIndex: 1 };
        }
      } else {
        // For other items, use standard thresholds
        if (hoverClientY < topThreshold) {
          return { position: "before" as const, targetIndex: index };
        } else if (hoverClientY > bottomThreshold) {
          return { position: "after" as const, targetIndex: index + 1 };
        }
      }

      // If we're in the middle zone, maintain the current position
      return { position: null, targetIndex: index };
    },
    [index]
  );

  const handleHover = useCallback(
    (draggedItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      const sourceDay = draggedItem.dayIndex;
      const targetDay = dayIndex;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceDay === targetDay) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Calculate relative position, ensuring it's within bounds
      const hoverClientY = Math.max(
        0,
        Math.min(
          clientOffset.y - hoverBoundingRect.top,
          hoverBoundingRect.height
        )
      );

      // Get the mouse position relative to the item
      const itemHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
      const { position, targetIndex } = calculateDropPosition(
        hoverClientY,
        itemHeight,
        index === 0
      );

      // Check if we've moved enough to trigger a new position
      const hasMovedEnough =
        lastPositionRef.current === null ||
        Math.abs(hoverClientY - lastPositionRef.current) > 10; // Increased threshold for more stability

      // Only perform the move if we've crossed the threshold and it's a new position
      if (
        position !== null &&
        hasMovedEnough &&
        (targetIndex !== dragIndex || sourceDay !== targetDay)
      ) {
        // Prevent duplicate moves
        const lastMove = lastMoveRef.current;
        if (
          lastMove &&
          lastMove.dragIndex === dragIndex &&
          lastMove.hoverIndex === targetIndex &&
          lastMove.sourceDay === sourceDay &&
          lastMove.targetDay === targetDay
        ) {
          return;
        }

        console.log("Performing move:", {
          draggedId: draggedItem.id,
          targetId: item.id,
          fromIndex: dragIndex,
          toIndex: targetIndex,
          fromDay: sourceDay,
          toDay: targetDay,
          relativeY: hoverClientY,
          itemHeight,
          isFirstItem: index === 0,
          isLastItem: index === hoverIndex,
          position,
        });

        moveItem(dragIndex, targetIndex, sourceDay, targetDay);

        // Update the dragged item's index and day
        draggedItem.index = targetIndex;
        draggedItem.dayIndex = targetDay;

        // Store the last move and position
        lastMoveRef.current = {
          dragIndex,
          hoverIndex: targetIndex,
          sourceDay,
          targetDay,
        };
        lastPositionRef.current = hoverClientY;
      }
    },
    [index, dayIndex, item.id, moveItem, calculateDropPosition]
  );

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
        // Calculate relative position, ensuring it's within bounds
        const hoverClientY = Math.max(
          0,
          Math.min(
            clientOffset.y - hoverBoundingRect.top,
            hoverBoundingRect.height
          )
        );

        const itemHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
        const { position } = calculateDropPosition(
          hoverClientY,
          itemHeight,
          index === 0
        );
        dropPosition = position;
      }

      if (isOver && canDrop) {
        console.log("Drop state:", {
          targetId: item.id,
          targetType: item.type,
          targetTitle: isTask(item) ? item.title : "Section",
          isOver,
          canDrop,
          dropPosition,
          isFirstItem: index === 0,
          relativeY: clientOffset
            ? Math.max(
                0,
                Math.min(
                  clientOffset.y - (hoverBoundingRect?.top || 0),
                  hoverBoundingRect?.height || 0
                )
              )
            : 0,
        });
      }

      return { isOver, canDrop, dropPosition };
    },
    canDrop: (draggedItem: DragItem) => {
      return !(draggedItem.id === item.id);
    },
    hover: handleHover,
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
      draggable={true}
    >
      {item.type === "section"
        ? renderSection(item as SectionItemType)
        : isTaskItem
        ? renderTask(item as Task, dayIndex)
        : null}
    </div>
  );
};
