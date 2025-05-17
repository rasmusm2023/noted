import { useState, useEffect } from "react";
import { AddSquare } from "solar-icon-set";
import { TaskList } from "./TaskList";
import { TaskModal } from "../TaskModal/TaskModal";
import { SectionModal } from "../SectionModal/SectionModal";
import type { Task, SectionItem, ListItem } from "../../types/task";
import { supabase } from "../../lib/supabase";

export const Dashboard = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(
    null
  );
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .order("order");

        if (tasksError) throw tasksError;

        const { data: sections, error: sectionsError } = await supabase
          .from("sections")
          .select("*")
          .order("order");

        if (sectionsError) throw sectionsError;

        const allItems = [...(tasks || []), ...(sections || [])].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        setItems(allItems);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save highlightNextTask preference
  useEffect(() => {
    localStorage.setItem(
      "highlightNextTask",
      JSON.stringify(highlightNextTask)
    );
  }, [highlightNextTask]);

  const handleTaskCompletion = async (
    taskId: string,
    completed: boolean,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const updatedItems = items.map((item) =>
      item.id === taskId && "completed" in item ? { ...item, completed } : item
    );
    setItems(updatedItems);

    const { error } = await supabase
      .from("tasks")
      .update({ completed })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskEdit = (task: Task | null) => {
    setEditingTask(task);
  };

  const handleTaskDelete = async (taskId: string) => {
    const updatedItems = items.filter((item) => item.id !== taskId);
    setItems(updatedItems);

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleSectionSelect = (section: SectionItem) => {
    setSelectedSection(section);
    setShowSectionModal(true);
  };

  const handleSectionDelete = async (sectionId: string) => {
    const updatedItems = items.filter((item) => item.id !== sectionId);
    setItems(updatedItems);

    const { error } = await supabase
      .from("sections")
      .delete()
      .eq("id", sectionId);

    if (error) {
      console.error("Error deleting section:", error);
    }
  };

  const handleMoveItem = async (dragIndex: number, hoverIndex: number) => {
    const draggedItem = items[dragIndex];
    const updatedItems = [...items];
    updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, draggedItem);
    setItems(updatedItems);

    const { error } = await supabase
      .from("items")
      .update({ order: hoverIndex })
      .eq("id", draggedItem.id);

    if (error) {
      console.error("Error updating item order:", error);
    }
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "New Task",
      description: "",
      completed: false,
      type: "task",
      order: items.length,
      scheduledTime: "",
      date: new Date().toISOString(),
      userId: "user-id", // TODO: Get from auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems([...items, newTask]);
    setSelectedTask(newTask);
    setShowTaskModal(true);
  };

  const handleAddSection = () => {
    const newSection: SectionItem = {
      id: crypto.randomUUID(),
      text: "New Section",
      time: "00:00",
      type: "section",
      order: items.length,
      backgroundColor: "",
      userId: "user-id", // TODO: Get from auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems([...items, newSection]);
    setSelectedSection(newSection);
    setShowSectionModal(true);
  };

  const handleClearAll = async () => {
    setItems([]);

    const { error } = await supabase.from("items").delete().neq("id", "");

    if (error) {
      console.error("Error clearing all items:", error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    const updatedItems = items.map((item) =>
      item.id === taskId && item.type === "task"
        ? { ...item, ...updates }
        : item
    );
    setItems(updatedItems);

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleSectionUpdate = async (
    sectionId: string,
    updates: Partial<SectionItem>
  ) => {
    const updatedItems = items.map((item) =>
      item.id === sectionId && item.type === "section"
        ? { ...item, ...updates }
        : item
    );
    setItems(updatedItems);

    const { error } = await supabase
      .from("sections")
      .update(updates)
      .eq("id", sectionId);

    if (error) {
      console.error("Error updating section:", error);
    }
  };

  const isTask = (item: ListItem): item is Task => {
    return "completed" in item;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <TaskList
            items={items}
            isLoading={isLoading}
            highlightNextTask={highlightNextTask}
            editingTask={editingTask}
            onTaskCompletion={handleTaskCompletion}
            onTaskSelect={handleTaskSelect}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onSectionSelect={handleSectionSelect}
            onSectionDelete={handleSectionDelete}
            onMoveItem={handleMoveItem}
            isTask={isTask}
          />
        </div>
      </div>

      <div className="border-t border-neu-800 bg-neu-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddTask}
                className="flex items-center space-x-2 px-4 py-2 bg-pri-blue-500 text-white rounded-lg hover:bg-pri-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:ring-offset-2 focus:ring-offset-neu-900"
              >
                <AddSquare size={20} color="currentColor" autoSize={false} />
                <span>Add Task</span>
              </button>
              <button
                onClick={handleAddSection}
                className="flex items-center space-x-2 px-4 py-2 bg-neu-800 text-neu-300 rounded-lg hover:bg-neu-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:ring-offset-2 focus:ring-offset-neu-900"
              >
                <AddSquare size={20} color="currentColor" autoSize={false} />
                <span>Add Section</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setHighlightNextTask(!highlightNextTask)}
                className="text-neu-400 hover:text-neu-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:ring-offset-2 focus:ring-offset-neu-900 rounded-lg px-3 py-2"
              >
                {highlightNextTask ? "Hide Next Task" : "Show Next Task"}
              </button>
              <button
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:ring-offset-2 focus:ring-offset-neu-900 rounded-lg px-3 py-2"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={(task) => {
            if (task.shouldClose) {
              setShowTaskModal(false);
              setSelectedTask(null);
            }
          }}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {showSectionModal && selectedSection && (
        <SectionModal
          section={selectedSection}
          isOpen={showSectionModal}
          onClose={(section) => {
            if (section.shouldClose) {
              setShowSectionModal(false);
              setSelectedSection(null);
            }
          }}
          onUpdate={handleSectionUpdate}
          onDelete={handleSectionDelete}
        />
      )}
    </div>
  );
};
