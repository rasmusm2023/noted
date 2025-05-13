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
  SectionItem,
} from "../types/task";

const tasksCollection = "tasks";
const timestampsCollection = "timestamps";
const titlesCollection = "titles";
const sectionsCollection = "sections";

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

    // Create a batch to update all existing tasks
    const batch = writeBatch(db);

    // Update all existing tasks to shift them down by 1
    currentTasks.forEach((task) => {
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

    console.log("Querying sections for user:", userId);
    try {
      const sectionsRef = collection(db, sectionsCollection);
      console.log("Collection reference created for sections");

      const q = query(sectionsRef, where("userId", "==", userId));
      console.log("Query created with filter:", { userId });

      const querySnapshot = await getDocs(q);
      console.log("Query executed, empty?", querySnapshot.empty);

      if (querySnapshot.empty) {
        console.log("No sections found for user:", userId);
        return [];
      }

      console.log("Number of sections found:", querySnapshot.size);
      const sections = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Raw section data:", data);
        return {
          id: doc.id,
          ...data,
        } as SectionItem;
      });

      const sortedSections = sections.sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      console.log("Sorted sections:", sortedSections);
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

  // Update section order
  async updateSectionOrder(
    userId: string,
    sectionOrders: { id: string; order: number }[]
  ): Promise<void> {
    const batch = writeBatch(db);

    sectionOrders.forEach(({ id, order }) => {
      const sectionRef = doc(db, sectionsCollection, id);
      batch.update(sectionRef, {
        order,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
  },

  // Add new function to move incomplete tasks to next day
  async moveIncompleteTasksToNextDay(userId: string): Promise<void> {
    console.log("Moving incomplete tasks to next day for user:", userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all tasks for the user
    const tasks = await this.getUserTasks(userId);

    // Filter tasks that are incomplete and from today
    const incompleteTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return !task.completed && taskDate.getTime() === today.getTime();
    });

    if (incompleteTasks.length === 0) {
      console.log("No incomplete tasks to move");
      return;
    }

    // Create a batch to update all tasks
    const batch = writeBatch(db);

    // Update each incomplete task to tomorrow's date
    incompleteTasks.forEach((task) => {
      const taskRef = doc(db, tasksCollection, task.id);
      batch.update(taskRef, {
        date: tomorrow.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Commit all changes
    await batch.commit();
    console.log(`Moved ${incompleteTasks.length} incomplete tasks to next day`);
  },
};
