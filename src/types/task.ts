export interface BaseItem {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Task extends BaseItem {
  type: "task";
  title: string;
  description: string;
  scheduledTime: string;
  completed: boolean;
  date: string; // ISO string format
  subtasks?: Subtask[];
  shouldClose?: boolean; // Optional property to control modal closing
  backgroundColor?: string; // Optional property for task background color
  goalIds?: string[]; // Optional property to link task to multiple goals
  isSaved?: boolean; // Optional property to mark task as saved for quick reuse
  originalTaskId?: string; // Optional property to link saved task to original task
  isArchived?: boolean; // Optional property to mark task as archived
  duration?: number; // Optional duration in minutes
  time?: string; // Optional time in HH:mm format
}

export interface SectionItem extends BaseItem {
  type: "section";
  text: string;
  time?: string;
  backgroundColor?: string;
  shouldClose?: boolean;
  scheduledTime?: string; // Add scheduledTime field
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  type: "task" | "section";
  time?: string;
  completed: boolean;
  date: string;
  scheduledTime?: string;
  backgroundColor?: string;
  subtasks?: Subtask[];
  goalIds?: string[];
  isSaved?: boolean;
}

// Keep Timestamp and TitleItem for backward compatibility
export interface Timestamp {
  id: string;
  time: string;
  isExpanded: boolean;
  tasks: Task[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export interface TitleItem {
  id: string;
  type: "title";
  text: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}
