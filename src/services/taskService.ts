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
  Timestamp,
  getDoc,
  setDoc,
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
const savedTasksCollection = "savedTasks"; // New collection for saved tasks
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
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Task> {
    tracker.trackOperation({
      type: "write",
      collection: tasksCollection,
      operation: "create",
      details: taskData,
    });

    try {
      const now = new Date();
      const newTask = {
        ...taskData,
        userId,
        completed: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const docRef = await addDoc(collection(db, tasksCollection), newTask);
      const createdTask = {
        ...newTask,
        id: docRef.id,
      } as Task;
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
        return [];
      }

      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
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
      const now = new Date();
      const updateData: Partial<Task> = {
        ...updates,
        updatedAt: now.toISOString(),
      };
      await updateDoc(taskRef, updateData);
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

    try {
      // Get the task first to check ownership
      const taskRef = doc(db, tasksCollection, taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error("Task not found");
      }

      const taskData = taskDoc.data();
      if (!taskData.userId) {
        throw new Error("Task has no owner");
      }

      // Delete only from main tasks collection
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
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

    const docRef = await addDoc(
      collection(db, timestampsCollection),
      timestamp
    );
    const createdTimestamp = { ...timestamp, id: docRef.id };
    return createdTimestamp;
  },

  // Get all timestamps for a user
  async getUserTimestamps(userId: string): Promise<TaskTimestamp[]> {
    if (!userId) {
      return [];
    }

    try {
      const q = query(
        collection(db, timestampsCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
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
    const timestampRef = doc(db, timestampsCollection, timestampId);
    await deleteDoc(timestampRef);
  },

  // Update a timestamp
  async updateTimestamp(
    timestampId: string,
    updates: Partial<TaskTimestamp>
  ): Promise<void> {
    const timestampRef = doc(db, timestampsCollection, timestampId);
    const now = new Date().toISOString();
    await updateDoc(timestampRef, {
      ...updates,
      updatedAt: now,
    });
  },

  // Create a new title
  async createTitle(userId: string, text: string): Promise<TitleItem> {
    const now = new Date().toISOString();
    const title: Omit<TitleItem, "id"> = {
      type: "title",
      text,
      userId,
      createdAt: now,
      updatedAt: now,
      order: 0,
    };

    const docRef = await addDoc(collection(db, titlesCollection), title);
    const createdTitle = { ...title, id: docRef.id };
    return createdTitle;
  },

  // Get all titles for a user
  async getUserTitles(userId: string): Promise<TitleItem[]> {
    if (!userId) {
      return [];
    }

    try {
      const q = query(
        collection(db, titlesCollection),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
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
    const titleRef = doc(db, titlesCollection, titleId);
    await deleteDoc(titleRef);
  },

  // Update a title
  async updateTitle(
    titleId: string,
    updates: Partial<TitleItem>
  ): Promise<void> {
    const titleRef = doc(db, titlesCollection, titleId);
    const now = new Date().toISOString();
    await updateDoc(titleRef, {
      ...updates,
      updatedAt: now,
    });
  },

  // Create a new section
  async createSection(
    userId: string,
    sectionData: { text: string; time: string; scheduledTime: string }
  ): Promise<SectionItem> {
    // Get current sections to determine the next order
    const currentSections = await this.getUserSections(userId);

    const now = new Date().toISOString();
    const section: Omit<SectionItem, "id"> = {
      type: "section",
      text: sectionData.text,
      time: sectionData.time,
      userId,
      createdAt: now,
      updatedAt: now,
      scheduledTime: sectionData.scheduledTime,
      order: 0, // New sections always get order 0
      backgroundColor: "bg-pink-test-500/25", // Add default background color
    };

    try {
      // First create the new section
      const docRef = await addDoc(collection(db, sectionsCollection), section);
      const createdSection = { ...section, id: docRef.id };

      // Try to update existing sections' orders, but don't fail if it doesn't work
      try {
        const batch = writeBatch(db);
        // Only update orders of sections for the same date
        const sectionsForSameDate = currentSections.filter((s) => {
          const existingDate = new Date(s.scheduledTime || s.createdAt);
          const newDate = new Date(sectionData.scheduledTime);
          existingDate.setHours(0, 0, 0, 0);
          newDate.setHours(0, 0, 0, 0);
          return existingDate.getTime() === newDate.getTime();
        });

        sectionsForSameDate.forEach((existingSection) => {
          const sectionRef = doc(db, sectionsCollection, existingSection.id);
          batch.update(sectionRef, {
            order: (existingSection.order ?? 0) + 1,
            updatedAt: now,
          });
        });
        await batch.commit();
      } catch (batchError) {
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
    const sectionRef = doc(db, sectionsCollection, sectionId);
    await deleteDoc(sectionRef);
  },

  // Update a section
  async updateSection(
    sectionId: string,
    updates: Partial<SectionItem>
  ): Promise<void> {
    const sectionRef = doc(db, sectionsCollection, sectionId);
    const now = new Date().toISOString();
    await updateDoc(sectionRef, {
      ...updates,
      updatedAt: now,
    });
  },

  // Add new function to update task date
  async updateTaskDate(taskId: string, newDate: Date): Promise<void> {
    const date = new Date(newDate);
    date.setHours(12, 0, 0, 0);

    const updateData = {
      date: date.toISOString(),
      scheduledTime: date.toLocaleString(),
    };

    await updateDoc(doc(db, "tasks", taskId), updateData);

    FirestoreTracker.getInstance().trackOperation({
      type: "write" as const,
      collection: "tasks",
      operation: "updateTaskDate",
      details: { taskId, newDate: date.toISOString() },
    });
  },

  // Add new function to update section date
  async updateSectionDate(sectionId: string, newDate: Date): Promise<void> {
    const date = new Date(newDate);
    date.setHours(12, 0, 0, 0);

    const updateData = {
      scheduledTime: date.toLocaleString(),
    };

    await updateDoc(doc(db, "sections", sectionId), updateData);

    FirestoreTracker.getInstance().trackOperation({
      type: "write" as const,
      collection: "sections",
      operation: "updateSectionDate",
      details: { sectionId, newDate: date.toISOString() },
    });
  },

  // Update moveIncompleteTasksToNextDay to use timezone
  async moveIncompleteTasksToNextDay(userId: string): Promise<void> {
    try {
      const tasks = await this.getUserTasks(userId);
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      const tasksToMove = tasks.filter((task) => {
        if (task.completed) return false;

        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);

        return taskDate.getTime() === today.getTime();
      });

      const batchOperations: BatchOperation[] = tasksToMove.map((task) => ({
        type: "task",
        operation: "update",
        id: task.id,
        data: {
          date: tomorrow.toISOString(),
          scheduledTime: tomorrow.toLocaleString(),
        },
      }));

      if (batchOperations.length > 0) {
        await this.batchOperations(batchOperations);
      }
    } catch (error) {
      console.error("Error moving incomplete tasks:", error);
      throw error;
    }
  },

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    tracker.trackOperation({
      type: "read",
      collection: tasksCollection,
      operation: "getByGoal",
      details: { goalId },
    });

    try {
      const tasksRef = collection(db, tasksCollection);
      const q = query(tasksRef, where("goalId", "==", goalId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Task;
      });
    } catch (error) {
      console.error("Error in getTasksByGoal:", error);
      throw error;
    }
  },

  // Save a task for quick reuse
  async saveTask(taskId: string): Promise<void> {
    tracker.trackOperation({
      type: "write",
      collection: savedTasksCollection,
      operation: "saveTask",
      details: { taskId },
    });

    try {
      // Get the original task
      const taskRef = doc(db, tasksCollection, taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error("Task not found");
      }

      const taskData = taskDoc.data();

      // Create a new document with only essential fields
      const savedTaskData = {
        title: taskData.title,
        description: taskData.description,
        subtasks: taskData.subtasks || [],
        userId: taskData.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        originalTaskId: taskId, // Keep reference to original task
        savedAt: new Date().toISOString(),
      };

      // Create a new document with auto-generated ID
      await addDoc(collection(db, savedTasksCollection), savedTaskData);
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  },

  // Unsave a task
  async unsaveTask(taskId: string): Promise<void> {
    tracker.trackOperation({
      type: "write",
      collection: savedTasksCollection,
      operation: "unsaveTask",
      details: { taskId },
    });

    try {
      // Delete the saved task directly by its ID
      const savedTaskRef = doc(db, savedTasksCollection, taskId);
      await deleteDoc(savedTaskRef);
    } catch (error) {
      console.error("Error unsaving task:", error);
      throw error;
    }
  },

  // Get all saved tasks for a user
  async getSavedTasks(userId: string): Promise<Task[]> {
    tracker.trackOperation({
      type: "read",
      collection: savedTasksCollection,
      operation: "getSavedTasks",
      details: { userId },
    });

    if (!userId) {
      console.error("getSavedTasks called with no userId");
      return [];
    }

    try {
      const savedTasksRef = collection(db, savedTasksCollection);
      const q = query(savedTasksRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        } as Task;
      });

      return tasks;
    } catch (error) {
      console.error("Error in getSavedTasks:", error);
      throw error;
    }
  },
};
