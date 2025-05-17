import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import { TrashBinTrash, Pen, CheckSquare, Record } from "solar-icon-set";
import type { Task, SectionItem } from "../../types/task";
import { TaskItem } from "./TaskItem";
import { SectionItem as SectionItemComponent } from "./SectionItem";

type ListItem = Task | SectionItem;

type DragItem = {
  id: string;
  type: string;
  index: number;
  item: ListItem;
};

interface TaskListProps {
  items: ListItem[];
  isLoading: boolean;
  highlightNextTask: boolean;
  editingTask: Task | null;
  onTaskCompletion: (
    taskId: string,
    completed: boolean,
    event: React.MouseEvent
  ) => void;
  onTaskSelect: (task: Task) => void;
  onTaskEdit: (task: Task | null) => void;
  onTaskDelete: (taskId: string) => void;
  onSectionSelect: (section: SectionItem) => void;
  onSectionDelete: (sectionId: string) => void;
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
  isTask: (item: ListItem) => item is Task;
}

const DraggableItem = ({
  item,
  index,
  moveItem,
  isTaskItem,
  renderTask,
  renderSection,
  isTask,
}: {
  item: ListItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isTaskItem: boolean;
  renderTask: (task: Task) => JSX.Element;
  renderSection: (section: SectionItem) => JSX.Element;
  isTask: (item: ListItem) => item is Task;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: item.type, index, item },
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
        dropPosition = hoverClientY < hoverMiddleY * 0.8 ? "before" : "after";
      }

      return { isOver, canDrop, dropPosition };
    },
    canDrop: (draggedItem: DragItem) => {
      return !(draggedItem.id === item.id);
    },
    hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      const dropThreshold = hoverMiddleY * 0.8;

      if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
      if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const opacity = isDragging ? 0.4 : 1;

  const getDropZoneStyles = () => {
    if (!isOver || !canDrop) return {};

    const baseStyle = {
      position: "relative" as const,
      transition: "all 0.2s ease-in-out",
    };

    if (dropPosition === "before") {
      return {
        ...baseStyle,
        borderTop: "2px solid #3b82f6",
        marginTop: "2px",
      };
    } else if (dropPosition === "after") {
      return {
        ...baseStyle,
        borderBottom: "2px solid #3b82f6",
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
      } ${isOver && canDrop ? "bg-blue-500/5" : ""}`}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-dropeffect="move"
    >
      {item.type === "section"
        ? renderSection(item as SectionItem)
        : isTaskItem
        ? renderTask(item as Task)
        : null}
    </div>
  );
};

export const TaskList = ({
  items,
  isLoading,
  highlightNextTask,
  editingTask,
  onTaskCompletion,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,
  onSectionSelect,
  onSectionDelete,
  onMoveItem,
  isTask,
}: TaskListProps) => {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const renderTask = (task: Task) => {
    const isNextTask =
      highlightNextTask &&
      !task.completed &&
      items.filter((i) => isTask(i) && !i.completed).indexOf(task) === 0;

    return (
      <TaskItem
        key={task.id}
        task={task}
        isNextTask={isNextTask}
        isEditing={editingTask?.id === task.id}
        editingTitle={editingTask?.title || ""}
        onCompletion={onTaskCompletion}
        onSelect={onTaskSelect}
        onEdit={onTaskEdit}
        onDelete={onTaskDelete}
        onTitleChange={(title) => onTaskEdit({ ...task, title })}
      />
    );
  };

  const renderSection = (section: SectionItem) => (
    <SectionItemComponent
      key={section.id}
      section={section}
      onSelect={onSectionSelect}
      onDelete={onSectionDelete}
    />
  );

  if (isLoading) {
    return <div className="text-neu-400 text-md">Loading tasks...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center text-neu-400 py-8">
          <p className="text-lg mb-2">There are no tasks for today</p>
          <p className="text-sm">Add a task to get started</p>
        </div>
        <div className="p-4 rounded-lg border-2 border-dashed border-neu-700 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-neu-600"></div>
            </div>
            <div className="flex-1">
              <div className="h-6 w-48 bg-neu-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-neu-700"></div>
            <div className="w-8 h-8 rounded bg-neu-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={listContainerRef}>
      {items.map((item, index) => {
        const isTaskItem = isTask(item);

        return (
          <div key={item.id} className="relative task-item">
            <DraggableItem
              item={item}
              index={index}
              moveItem={onMoveItem}
              isTaskItem={isTaskItem}
              renderTask={renderTask}
              renderSection={renderSection}
              isTask={isTask}
            />
          </div>
        );
      })}
    </div>
  );
};
