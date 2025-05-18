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
  writeBatch,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import type {
  Task,
  Timestamp as TaskTimestamp,
  TitleItem,
  SectionItem,
} from "../types/task";

// Add Firestore operation tracker
type FirestoreOperation = {
  type: "read" | "write";
  collection: string;
  operation: string;
  timestamp: number;
  details?: any;
};

class FirestoreTracker {
  private static instance: FirestoreTracker;
  private operations: FirestoreOperation[] = [];
  private startTime: number;
  private dailyStats: {
    reads: number;
    writes: number;
    lastReset: number;
  };

  private constructor() {
    this.startTime = Date.now();
    this.dailyStats = {
      reads: 0,
      writes: 0,
      lastReset: Date.now(),
    };
  }

  static getInstance(): FirestoreTracker {
    if (!FirestoreTracker.instance) {
      FirestoreTracker.instance = new FirestoreTracker();
    }
    return FirestoreTracker.instance;
  }

  trackOperation(operation: Omit<FirestoreOperation, "timestamp">) {
    const timestamp = Date.now();
    this.operations.push({ ...operation, timestamp });

    // Update daily stats
    if (operation.type === "read") {
      this.dailyStats.reads++;
    } else {
      this.dailyStats.writes++;
    }

    // Check if we need to reset daily stats (every 24 hours)
    if (timestamp - this.dailyStats.lastReset > 24 * 60 * 60 * 1000) {
      this.dailyStats = {
        reads: 0,
        writes: 0,
        lastReset: timestamp,
      };
    }

    // Log warning if we're approaching limits
    this.checkLimits();
  }

  private checkLimits() {
    const DAILY_READ_LIMIT = 50000; // Firestore free tier limit
    const DAILY_WRITE_LIMIT = 20000; // Firestore free tier limit
    const WARNING_THRESHOLD = 0.8; // 80% of limit

    if (this.dailyStats.reads > DAILY_READ_LIMIT * WARNING_THRESHOLD) {
      console.warn(
        `⚠️ Approaching daily read limit: ${this.dailyStats.reads}/${DAILY_READ_LIMIT}`
      );
    }
    if (this.dailyStats.writes > DAILY_WRITE_LIMIT * WARNING_THRESHOLD) {
      console.warn(
        `⚠️ Approaching daily write limit: ${this.dailyStats.writes}/${DAILY_WRITE_LIMIT}`
      );
    }
  }

  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      uptime: `${hours}h ${minutes}m`,
      dailyStats: this.dailyStats,
      totalOperations: this.operations.length,
      operationsByType: this.operations.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      operationsByCollection: this.operations.reduce((acc, op) => {
        acc[op.collection] = (acc[op.collection] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  logStats() {
    const stats = this.getStats();
    console.group("📊 Firestore Operations Stats");
    console.log("Uptime:", stats.uptime);
    console.log("Daily Stats:", stats.dailyStats);
    console.log("Total Operations:", stats.totalOperations);
    console.log("Operations by Type:", stats.operationsByType);
    console.log("Operations by Collection:", stats.operationsByCollection);
    console.groupEnd();
  }
}

const tracker = FirestoreTracker.getInstance();

// Make tracker accessible globally for stats viewing
(window as any).tracker = tracker;

// Add periodic stats logging
setInterval(() => {
  tracker.logStats();
}, 5 * 60 * 1000); // Log every 5 minutes

const tasksCollection = "tasks";
const timestampsCollection = "timestamps";
const titlesCollection = "titles";
const sectionsCollection = "sections";

// Add batch operation types
export type BatchOperation = {
  type: "task" | "section";
  operation: "create" | "update" | "delete";
  data: any;
  id?: string;
};

export const taskService = {
  // Create a new task
  async createTask(
    userId: string,
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt" | "order">
  ): Promise<Task> {
    tracker.trackOperation({
      type: "write",
      collection: tasksCollection,
      operation: "create",
      details: taskData,
    });

    console.log("Creating task for user:", userId);
    console.log("Task data:", taskData);

    try {
      // Get current tasks for the same date to determine the next order
      const currentTasks = await this.getUserTasks(userId);
      const tasksForSameDate = currentTasks.filter(
        (task) => task.date === taskData.date
      );

      // Create a batch for the new task and affected tasks
      const batch = writeBatch(db);

      // Only update orders of tasks for the same date
      tasksForSameDate.forEach((task) => {
        const taskRef = doc(db, tasksCollection, task.id);
        batch.update(taskRef, {
          order: (task.order || 0) + 1,
          updatedAt: new Date().toISOString(),
        });
      });

      const now = new Date().toISOString();
      const task: Omit<Task, "id"> = {
        ...taskData,
        userId,
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: 0, // New task gets order 0 (top of the list)
      };

      console.log("Full task object to be saved:", task);

      // Add the new task to the batch
      const newTaskRef = doc(collection(db, tasksCollection));
      batch.set(newTaskRef, task);

      // Commit all changes
      await batch.commit();

      const createdTask = { ...task, id: newTaskRef.id };
      console.log("Task created successfully:", createdTask);
      return createdTask;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    tracker.trackOperation({
      type: "read",
      collection: tasksCollection,
      operation: "getAll",
      details: { userId },
    });

    if (!userId) {
      console.error("getUserTasks called with no userId");
      return [];
    }

    try {
      const tasksRef = collection(db, tasksCollection);

      const q = query(tasksRef, where("userId", "==", userId));

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
    tracker.trackOperation({
      type: "write",
      collection: tasksCollection,
      operation: "update",
      details: { taskId, updates },
    });

    try {
      const taskRef = doc(db, tasksCollection, taskId);
      const now = new Date().toISOString();

      // If subtasks are being updated, ensure they have proper order
      if (updates.subtasks) {
        updates.subtasks = updates.subtasks.map((subtask, index) => ({
          ...subtask,
          order: index,
        }));
      }

      // Only include fields that are actually being updated
      const updateData: Partial<Task> = {
        ...updates,
        updatedAt: now,
      };

      // Remove undefined values to avoid unnecessary updates
      (Object.keys(updateData) as Array<keyof Task>).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log("Updating task with data:", updateData);
      await updateDoc(taskRef, updateData);
      console.log("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    tracker.trackOperation({
      type: "write",
      collection: tasksCollection,
      operation: "delete",
      details: { taskId },
    });

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

  // Add batch operations
  async batchOperations(operations: BatchOperation[]) {
    tracker.trackOperation({
      type: "write",
      collection: "batch",
      operation: "batch",
      details: { operationCount: operations.length },
    });

    const batch = writeBatch(db);

    for (const op of operations) {
      const collectionName = op.type === "task" ? "tasks" : "sections";

      switch (op.operation) {
        case "create":
          const docRef = doc(collection(db, collectionName));
          batch.set(docRef, {
            ...op.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          break;

        case "update":
          if (!op.id) throw new Error("ID required for update operation");
          const updateRef = doc(db, collectionName, op.id);
          batch.update(updateRef, {
            ...op.data,
            updatedAt: serverTimestamp(),
          });
          break;

        case "delete":
          if (!op.id) throw new Error("ID required for delete operation");
          const deleteRef = doc(db, collectionName, op.id);
          batch.delete(deleteRef);
          break;
      }
    }

    await batch.commit();
  },

  // Modify existing methods to use batch operations where appropriate
  async updateTaskOrder(tasks: Task[]) {
    const operations: BatchOperation[] = tasks.map((task) => ({
      type: "task",
      operation: "update",
      id: task.id,
      data: { order: task.order },
    }));

    await this.batchOperations(operations);
  },

  async updateSectionOrder(sections: SectionItem[]) {
    const operations: BatchOperation[] = sections.map((section) => ({
      type: "section",
      operation: "update",
      id: section.id,
      data: { order: section.order },
    }));

    await this.batchOperations(operations);
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

  // Create a new section
  async createSection(
    userId: string,
    sectionData: { text: string; time: string }
  ): Promise<SectionItem> {
    console.log("Creating section for user:", userId);
    console.log("Section data:", sectionData);

    // Get current sections to determine the next order
    const currentSections = await this.getUserSections(userId);
    console.log("Current sections count:", currentSections.length);

    const now = new Date().toISOString();
    const section: Omit<SectionItem, "id"> = {
      type: "section",
      text: sectionData.text,
      time: sectionData.time,
      userId,
      createdAt: now,
      updatedAt: now,
      order: 0, // New sections always get order 0
      backgroundColor: "bg-neu-800", // Add default background color
    };

    console.log("Full section object to be saved:", section);
    try {
      // First create the new section
      const docRef = await addDoc(collection(db, sectionsCollection), section);
      const createdSection = { ...section, id: docRef.id };
      console.log("Section created successfully:", createdSection);

      // Try to update existing sections' orders, but don't fail if it doesn't work
      try {
        const batch = writeBatch(db);
        currentSections.forEach((existingSection) => {
          const sectionRef = doc(db, sectionsCollection, existingSection.id);
          batch.update(sectionRef, {
            order: (existingSection.order ?? 0) + 1,
            updatedAt: now,
          });
        });
        await batch.commit();
        console.log("Successfully updated existing sections' orders");
      } catch (batchError) {
        console.warn("Failed to update existing sections' orders:", batchError);
        // Don't throw the error - we still want to return the created section
      }

      return createdSection;
    } catch (error) {
      console.error("Error creating section:", error);
      throw error;
    }
  },

  // Get all sections for a user
  async getUserSections(userId: string): Promise<SectionItem[]> {
    if (!userId) {
      console.error("getUserSections called with no userId");
      return [];
    }

    try {
      const sectionsRef = collection(db, sectionsCollection);

      const q = query(sectionsRef, where("userId", "==", userId));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      const sections = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as SectionItem;
      });

      const sortedSections = sections.sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      return sortedSections;
    } catch (error) {
      console.error("Error in getUserSections:", error);
      throw error;
    }
  },

  // Delete a section
  async deleteSection(sectionId: string): Promise<void> {
    console.log("Deleting section:", sectionId);
    const sectionRef = doc(db, sectionsCollection, sectionId);
    await deleteDoc(sectionRef);
    console.log("Section deleted successfully");
  },

  // Update a section
  async updateSection(
    sectionId: string,
    updates: Partial<SectionItem>
  ): Promise<void> {
    console.log("Updating section:", sectionId, updates);
    const sectionRef = doc(db, sectionsCollection, sectionId);
    const now = new Date().toISOString();
    await updateDoc(sectionRef, {
      ...updates,
      updatedAt: now,
    });
    console.log("Section updated successfully");
  },

  // Add new function to move incomplete tasks to next day
  async moveIncompleteTasksToNextDay(userId: string): Promise<void> {
    console.log("Moving incomplete tasks to next day for user:", userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all tasks and sections for the user
    const [tasks, sections] = await Promise.all([
      this.getUserTasks(userId),
      this.getUserSections(userId),
    ]);

    // Create a batch for all operations
    const batch = writeBatch(db);

    // 1. Delete completed tasks from today
    const completedTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return task.completed && taskDate.getTime() === today.getTime();
    });

    completedTasks.forEach((task) => {
      const taskRef = doc(db, tasksCollection, task.id);
      batch.delete(taskRef);
    });

    // 2. Delete all sections from today
    const todaySections = sections.filter((section) => {
      const sectionDate = new Date(section.createdAt);
      sectionDate.setHours(0, 0, 0, 0);
      return sectionDate.getTime() === today.getTime();
    });

    todaySections.forEach((section) => {
      const sectionRef = doc(db, sectionsCollection, section.id);
      batch.delete(sectionRef);
    });

    // 3. Move incomplete tasks to tomorrow
    const incompleteTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return !task.completed && taskDate.getTime() === today.getTime();
    });

    incompleteTasks.forEach((task) => {
      const taskRef = doc(db, tasksCollection, task.id);
      batch.update(taskRef, {
        date: tomorrow.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Commit all changes
    await batch.commit();
  },
};
