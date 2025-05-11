export interface BaseItem {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export interface Task extends BaseItem {
  type: "task";
  title: string;
  description: string;
  scheduledTime: string;
  completed: boolean;
}

export interface SectionItem extends BaseItem {
  type: "section";
  text: string;
  time: string;
}

export type ListItem = Task | SectionItem;

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
