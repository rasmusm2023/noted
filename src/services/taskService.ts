import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Task } from "../types/task";

const tasksCollection = "tasks";

export const taskService = {
  // Create a new task
  async createTask(
    userId: string,
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Task> {
    const now = new Date().toISOString();
    const task: Omit<Task, "id"> = {
      ...taskData,
      userId,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, tasksCollection), task);
    return { ...task, id: docRef.id };
  },

  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, tasksCollection),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Task)
    );
  },

  // Update a task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(db, tasksCollection, taskId);
    const now = new Date().toISOString();

    await updateDoc(taskRef, {
      ...updates,
      updatedAt: now,
    });
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(db, tasksCollection, taskId);
    await deleteDoc(taskRef);
  },

  // Toggle task completion
  async toggleTaskCompletion(
    taskId: string,
    completed: boolean
  ): Promise<void> {
    await this.updateTask(taskId, { completed });
  },
};
