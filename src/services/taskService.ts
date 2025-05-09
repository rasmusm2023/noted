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
  writeBatch,
} from "firebase/firestore";
import type {
  Task,
  Timestamp as TaskTimestamp,
  TitleItem,
} from "../types/task";

const tasksCollection = "tasks";
const timestampsCollection = "timestamps";
const titlesCollection = "titles";

export const taskService = {
  // Create a new task
  async createTask(
    userId: string,
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt" | "order">
  ): Promise<Task> {
    console.log("Creating task for user:", userId);
    console.log("Task data:", taskData);

    // Get current tasks to determine the next order
    const currentTasks = await this.getUserTasks(userId);
    const nextOrder = currentTasks.length;

    const now = new Date().toISOString();
    const task: Omit<Task, "id"> = {
      ...taskData,
      userId,
      completed: false,
      createdAt: now,
      updatedAt: now,
      order: nextOrder, // Set order to the next available position
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
      const tasksRef = collection(db, tasksCollection);
      console.log("Collection reference created");

      const q = query(tasksRef, where("userId", "==", userId));
      console.log("Query created with filter:", { userId });

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No tasks found for user:", userId);
        return [];
      }

      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Task;
      });

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
    const taskRef = doc(db, tasksCollection, taskId);
    await updateDoc(taskRef, {
      completed,
      updatedAt: new Date().toISOString(),
    });
  },

  async updateTaskOrder(
    userId: string,
    taskOrders: { id: string; order: number }[]
  ): Promise<void> {
    const batch = writeBatch(db);

    taskOrders.forEach(({ id, order }) => {
      const taskRef = doc(db, tasksCollection, id);
      batch.update(taskRef, { order, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
  },

  async updateTimestampOrder(
    userId: string,
    timestampOrders: { id: string; order: number }[]
  ): Promise<void> {
    const batch = writeBatch(db);

    timestampOrders.forEach(({ id, order }) => {
      const timestampRef = doc(db, "timestamps", id);
      batch.update(timestampRef, {
        order,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
  },

  async updateTitleOrder(
    userId: string,
    titleOrders: { id: string; order: number }[]
  ): Promise<void> {
    const batch = writeBatch(db);

    titleOrders.forEach(({ id, order }) => {
      const titleRef = doc(db, "titles", id);
      batch.update(titleRef, { order, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
  },

  // Create a new timestamp
  async createTimestamp(userId: string, time: string): Promise<TaskTimestamp> {
    console.log("Creating timestamp for user:", userId);
    const now = new Date().toISOString();
    const timestamp: Omit<TaskTimestamp, "id"> = {
      time,
      userId,
      isExpanded: true,
      tasks: [],
      createdAt: now,
      updatedAt: now,
      order: 0,
    };

    console.log("Full timestamp object to be saved:", timestamp);
    const docRef = await addDoc(
      collection(db, timestampsCollection),
      timestamp
    );
    const createdTimestamp = { ...timestamp, id: docRef.id };
    console.log("Timestamp created successfully:", createdTimestamp);
    return createdTimestamp;
  },

  // Get all timestamps for a user
  async getUserTimestamps(userId: string): Promise<TaskTimestamp[]> {
    if (!userId) {
      console.error("getUserTimestamps called with no userId");
      return [];
    }

    console.log("Querying timestamps for user:", userId);
    try {
      const q = query(
        collection(db, timestampsCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No timestamps found for user:", userId);
        return [];
      }

      const timestamps = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as TaskTimestamp;
      });

      return timestamps.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error("Error in getUserTimestamps:", error);
      throw error;
    }
  },

  // Delete a timestamp
  async deleteTimestamp(timestampId: string): Promise<void> {
    console.log("Deleting timestamp:", timestampId);
    const timestampRef = doc(db, timestampsCollection, timestampId);
    await deleteDoc(timestampRef);
    console.log("Timestamp deleted successfully");
  },

  // Update a timestamp
  async updateTimestamp(
    timestampId: string,
    updates: Partial<TaskTimestamp>
  ): Promise<void> {
    console.log("Updating timestamp:", timestampId, updates);
    const timestampRef = doc(db, timestampsCollection, timestampId);
    const now = new Date().toISOString();
    await updateDoc(timestampRef, {
      ...updates,
      updatedAt: now,
    });
    console.log("Timestamp updated successfully");
  },

  // Create a new title
  async createTitle(userId: string, text: string): Promise<TitleItem> {
    console.log("Creating title for user:", userId);
    const now = new Date().toISOString();
    const title: Omit<TitleItem, "id"> = {
      type: "title",
      text,
      userId,
      createdAt: now,
      updatedAt: now,
      order: 0,
    };

    console.log("Full title object to be saved:", title);
    const docRef = await addDoc(collection(db, titlesCollection), title);
    const createdTitle = { ...title, id: docRef.id };
    console.log("Title created successfully:", createdTitle);
    return createdTitle;
  },

  // Get all titles for a user
  async getUserTitles(userId: string): Promise<TitleItem[]> {
    if (!userId) {
      console.error("getUserTitles called with no userId");
      return [];
    }

    console.log("Querying titles for user:", userId);
    try {
      const q = query(
        collection(db, titlesCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No titles found for user:", userId);
        return [];
      }

      const titles = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as TitleItem;
      });

      return titles.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error("Error in getUserTitles:", error);
      throw error;
    }
  },

  // Delete a title
  async deleteTitle(titleId: string): Promise<void> {
    console.log("Deleting title:", titleId);
    const titleRef = doc(db, titlesCollection, titleId);
    await deleteDoc(titleRef);
    console.log("Title deleted successfully");
  },

  // Update a title
  async updateTitle(
    titleId: string,
    updates: Partial<TitleItem>
  ): Promise<void> {
    console.log("Updating title:", titleId, updates);
    const titleRef = doc(db, titlesCollection, titleId);
    const now = new Date().toISOString();
    await updateDoc(titleRef, {
      ...updates,
      updatedAt: now,
    });
    console.log("Title updated successfully");
  },
};
