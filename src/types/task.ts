export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
