export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  order?: number;
};

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

export interface SectionItem {
  id: string;
  type: "section";
  text: string;
  time: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}
