import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import type { Task } from "../../types/task";
import { TaskItem } from "./TaskItem";
import { taskService } from "../../services/taskService";
import { useAuth } from "../../contexts/AuthContext";

type DragItem = {
  id: string;
  type: string;
  index: number;
  item: Task;
};

interface TaskListProps {
  items: Task[];
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
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableItem = ({
  item,
  index,
  moveItem,
  renderTask,
}: {
  item: Task;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  renderTask: (task: Task) => JSX.Element;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: "task", index, item },
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

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
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

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

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
      aria-grabbed={isDragging}
      aria-dropeffect="move"
    >
      {renderTask(item)}
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
  onMoveItem,
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
      items.filter((t) => !t.completed).indexOf(task) === 0;
    const isEditing = editingTask?.id === task.id;
    const editingTitle = editingTask?.title || "";

    return (
      <TaskItem
        key={task.id}
        task={task}
        isNextTask={isNextTask}
        isEditing={isEditing}
        editingTitle={editingTitle}
        index={items.findIndex((item) => item.id === task.id)}
        onCompletion={onTaskCompletion}
        onSelect={onTaskSelect}
        onEdit={onTaskEdit}
        onDelete={onTaskDelete}
        onTitleChange={(title) => onTaskEdit({ ...task, title })}
        onSave={onTaskSave}
      />
    );
  };

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
      {items.map((item, index) => (
        <div key={item.id} className="relative task-item">
          <DraggableItem
            item={item}
            index={index}
            moveItem={onMoveItem}
            renderTask={renderTask}
          />
        </div>
      ))}
    </div>
  );
};
