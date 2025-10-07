import React, { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TaskItem } from "./TaskItem";
import { DayColumn } from "./DayColumn";
import type { Task, SectionItem } from "../../types/task";

interface Next7DaysProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Task) => void;
  onSectionAdd: (section: SectionItem) => void;
}

export const Next7Days = ({
  tasks,
  isLoading,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  onSectionAdd,
}: Next7DaysProps) => {
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<
    {
      id: string;
      date: Date;
      items: (Task | SectionItem)[];
    }[]
  >([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // ... existing useEffect and other functions ...

  const moveItem = useCallback(
    (
      dragIndex: number,
      hoverIndex: number,
      sourceDay: number,
      targetDay: number
    ) => {
      setDays((prevDays) => {
        const newDays = [...prevDays];
        const sourceItems = [...newDays[sourceDay].items];
        const targetItems =
          sourceDay === targetDay ? sourceItems : [...newDays[targetDay].items];

        // Remove from source
        const [removed] = sourceItems.splice(dragIndex, 1);
        if (sourceDay === targetDay) {
          // Insert at new position in same day
          targetItems.splice(hoverIndex, 0, removed);
          newDays[sourceDay].items = targetItems;
        } else {
          // Insert into target day
          targetItems.splice(hoverIndex, 0, removed);
          newDays[sourceDay].items = sourceItems;
          newDays[targetDay].items = targetItems;
        }

        return newDays;
      });
    },
    []
  );

  const renderTask = useCallback(
    (task: Task, dayIndex: number) => {
      const day = days[dayIndex];
      return (
        <TaskItem
          key={task.id}
          task={task}
          dayIndex={dayIndex}
          editingTask={editingTask}
          onTaskClick={(task: Task, e: React.MouseEvent) => {
            e.stopPropagation();
            setEditingTask(task);
          }}
          onTaskCompletion={(
            taskId: string,
            completed: boolean,
            dayIndex: number,
            e: React.MouseEvent
          ) => {
            e.stopPropagation();
            const updatedTask = { ...task, completed };
            onTaskUpdate(updatedTask);
            setDays((prevDays) => {
              const newDays = [...prevDays];
              const dayItems = [...newDays[dayIndex].items];
              const taskIndex = dayItems.findIndex(
                (item) => item.id === taskId
              );
              if (taskIndex !== -1) {
                dayItems[taskIndex] = updatedTask;
                newDays[dayIndex].items = dayItems;
              }
              return newDays;
            });
          }}
          onTaskDelete={onTaskDelete}
          onTaskEdit={(taskId: string, updates: Partial<Task>) => {
            const updatedTask = { ...task, ...updates };
            onTaskUpdate(updatedTask);
            setDays((prevDays) => {
              const newDays = [...prevDays];
              const dayItems = [...newDays[dayIndex].items];
              const taskIndex = dayItems.findIndex(
                (item) => item.id === taskId
              );
              if (taskIndex !== -1) {
                dayItems[taskIndex] = updatedTask;
                newDays[dayIndex].items = dayItems;
              }
              return newDays;
            });
          }}
          onEditingTaskChange={setEditingTask}
        />
      );
    },
    [days, onTaskUpdate, onTaskDelete, editingTask]
  );

  const renderSection = useCallback((section: SectionItem) => {
    return (
      <div
        key={section.id}
        className="p-3 rounded-md bg-neu-gre-100 dark:bg-neu-gre-700"
      >
        <h3 className="text-lg font-semibold">{section.text}</h3>
        {section.time && (
          <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300">
            {section.time}
          </p>
        )}
      </div>
    );
  }, []);

  const isTask = useCallback((item: Task | SectionItem): item is Task => {
    return item.type === "task";
  }, []);

  const sortItems = useCallback((items: (Task | SectionItem)[]) => {
    return [...items].sort((a, b) => {
      if (a.type === "section" && b.type === "task") return -1;
      if (a.type === "task" && b.type === "section") return 1;
      return 0;
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-x-auto">
          <div className="flex space-x-4 p-4 min-w-max">
            {days.map((day, index) => (
              <DayColumn
                key={day.date.toISOString()}
                day={day}
                dayIndex={index}
                isLoading={isLoading}
                hidingItems={hidingItems}
                onAddTask={(dayIndex: number, title: string, task?: Task) => {
                  if (task) {
                    onTaskAdd(task);
                    // Add the task to the local state
                    setDays((prevDays) => {
                      const newDays = [...prevDays];
                      newDays[dayIndex].items.push(task);
                      return newDays;
                    });
                  }
                }}
                onSectionAdded={() => {
                  const section: SectionItem = {
                    id: crypto.randomUUID(),
                    type: "section",
                    text: "New Section",
                    userId: "user", // This should be replaced with actual user ID
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  onSectionAdd(section);
                  // Add the section to the local state
                  setDays((prevDays) => {
                    const newDays = [...prevDays];
                    newDays[index].items.push(section);
                    return newDays;
                  });
                }}
                moveItem={moveItem}
                renderTask={renderTask}
                renderSection={renderSection}
                isTask={isTask}
                sortItems={sortItems}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
