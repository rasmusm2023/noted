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
} from "firebase/firestore";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: Date | null;
  progress: number;
  progressType: "percentage" | "numerical";
  totalSteps: number;
  currentStep: number;
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export const goalService = {
  async createGoal(
    userId: string,
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Goal> {
    const goalsRef = collection(db, "goals");
    const now = new Date();

    const newGoal = {
      ...goalData,
      userId,
      progress:
        goalData.progressType === "percentage"
          ? 0
          : (goalData.currentStep / goalData.totalSteps) * 100,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(goalsRef, newGoal);
    return { ...newGoal, id: docRef.id } as Goal;
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    const goalRef = doc(db, "goals", goalId);
    const now = new Date();

    await updateDoc(goalRef, {
      ...updates,
      updatedAt: now,
    });
  },

  async deleteGoal(goalId: string): Promise<void> {
    const goalRef = doc(db, "goals", goalId);
    await deleteDoc(goalRef);
  },

  async getUserGoals(userId: string): Promise<Goal[]> {
    const goalsRef = collection(db, "goals");
    const q = query(goalsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      deadline: doc.data().deadline?.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Goal[];
  },

  async updateGoalProgress(
    goalId: string,
    progress: number,
    progressType?: "percentage" | "numerical",
    currentStep?: number,
    totalSteps?: number
  ): Promise<void> {
    const goalRef = doc(db, "goals", goalId);
    const now = new Date();

    const updates: any = {
      updatedAt: now,
    };

    if (
      progressType === "numerical" &&
      currentStep !== undefined &&
      totalSteps !== undefined
    ) {
      updates.progress = (currentStep / totalSteps) * 100;
      updates.currentStep = currentStep;
      updates.totalSteps = totalSteps;
    } else {
      updates.progress = progress;
    }

    updates.status = updates.progress >= 100 ? "completed" : "active";

    await updateDoc(goalRef, updates);
  },
};
