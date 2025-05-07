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
    console.log("Creating task for user:", userId);
    console.log("Task data:", taskData);

    const now = new Date().toISOString();
    const task: Omit<Task, "id"> = {
      ...taskData,
      userId,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    console.log("Full task object to be saved:", task);

    const docRef = await addDoc(collection(db, tasksCollection), task);
    const createdTask = { ...task, id: docRef.id };
    console.log("Task created successfully:", createdTask);
    return createdTask;
  },

  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    if (!userId) {
      console.error("getUserTasks called with no userId");
      return [];
    }

    console.log("Querying tasks for user:", userId);
    try {
      // Temporarily remove orderBy until the index is created
      const q = query(
        collection(db, tasksCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("Query snapshot size:", querySnapshot.size);

      if (querySnapshot.empty) {
        console.log("No tasks found for user:", userId);
        return [];
      }

      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Raw task data from Firestore:", data);
        return {
          id: doc.id,
          ...data,
        } as Task;
      });

      // Sort tasks in memory instead of in the query
      tasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log("Retrieved tasks:", tasks);
      return tasks;
    } catch (error) {
      console.error("Error in getUserTasks:", error);
      throw error;
    }
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
