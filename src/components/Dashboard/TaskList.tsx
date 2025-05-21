import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import type { Task, SectionItem } from "../../types/task";
import { TaskItem } from "./TaskItem";
import { SectionItem as SectionItemComponent } from "./SectionItem";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";

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
  onTaskSave: (taskId: string, isSaved: boolean) => void;
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
}: {
  item: ListItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isTaskItem: boolean;
  renderTask: (task: Task) => JSX.Element;
  renderSection: (section: SectionItem) => JSX.Element;
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
      } ${isOver && canDrop ? "bg-sec-rose-500/5" : ""}`}
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
  onTaskSave,
  onSectionSelect,
  onSectionDelete,
  onMoveItem,
  isTask,
}: TaskListProps) => {
  const { currentUser } = useAuth();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "SAVED_TASK",
    drop: async (item: Task) => {
      if (!currentUser) return;

      try {
        // Get today's date in user's timezone
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Set to noon for better visibility

        // Create a new task with the saved task's properties
        const { id, userId, createdAt, updatedAt, isSaved, ...taskData } = item;
        const newTask = await taskService.createTask(currentUser.uid, {
          ...taskData,
          scheduledTime: today.toISOString(),
          completed: false,
          date: today.toISOString(),
          isSaved: false, // Ensure the new task is not marked as saved
        });

        // Notify parent component to refresh the task list
        onTaskSelect(newTask);
      } catch (error) {
        console.error("Error creating task from saved task:", error);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    drop(node);
    if (listContainerRef) {
      listContainerRef.current = node;
    }
  };

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
        onSave={onTaskSave}
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
        <div className="text-center font-inter text-neu-400 py-8">
          <p className="text-lg mb-2">There are no tasks for today</p>
          <p className="text-sm font-inter">Add a task to get started</p>
        </div>
        <div className="p-4 rounded-lg border-2 border-dashed border-sec-rose-300 flex items-center justify-between">
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
    <div
      ref={combinedRef}
      className={`space-y-4 transition-colors duration-200 ${
        isOver ? "bg-neu-gre-300/20" : ""
      }`}
    >
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
            />
          </div>
        );
      })}
    </div>
  );
};
