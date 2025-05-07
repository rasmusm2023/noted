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
}
