import React, { useState, useCallback, useEffect } from "react";
import { TaskItem } from "./TaskItem";
import { DayColumn } from "./DayColumn";
import type { Task } from "../../types/task";
import type { Goal } from "../../services/goalService";

interface Next7DaysProps {
  tasks: Task[];
  goals: Goal[];
  isLoading: boolean;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Task) => void;
}

export const Next7Days = ({
  tasks,
  goals,
  isLoading,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
}: Next7DaysProps) => {
  const [hidingItems] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<
    {
      id: string;
      date: Date;
      items: Task[];
    }[]
  >([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Initialize days from tasks prop
  useEffect(() => {
    if (tasks.length === 0) {
      // Initialize with next 7 days if no tasks
      const next7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          id: `day-${i}`,
          date,
          items: [] as Task[],
        };
      });
      setDays(next7Days);
      return;
    }

    // Group tasks by date
    const tasksByDate = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const taskDate = new Date(task.date).toDateString();
      if (!tasksByDate.has(taskDate)) {
        tasksByDate.set(taskDate, []);
      }
      tasksByDate.get(taskDate)!.push(task);
    });

    // Create next 7 days with tasks
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toDateString();
      const dayTasks = tasksByDate.get(dateString) || [];

      return {
        id: `day-${i}`,
        date,
        items: dayTasks,
      };
    });

    setDays(next7Days);
  }, [tasks]);

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
      return (
        <TaskItem
          key={task.id}
          task={task}
          goals={goals}
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
    [days, onTaskUpdate, onTaskDelete, editingTask, goals]
  );

  const isTask = useCallback((item: Task): item is Task => {
    return item && item.type === "task";
  }, []);

  const sortItems = useCallback((items: Task[]) => {
    return [...items];
  }, []);

  return (
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
              onAddTask={(dayIndex: number, _title: string, task?: Task) => {
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
              moveItem={moveItem}
              renderTask={renderTask}
              isTask={isTask}
              sortItems={sortItems}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
