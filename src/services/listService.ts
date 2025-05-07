import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export interface CustomList {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

export const listService = {
  async createList(userId: string, name: string): Promise<CustomList> {
    try {
      const listData = {
        name,
        userId,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "lists"), listData);
      return {
        id: docRef.id,
        name,
        userId,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating list:", error);
      throw error;
    }
  },

  async getUserLists(userId: string): Promise<CustomList[]> {
    try {
      const listsQuery = query(
        collection(db, "lists"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(listsQuery);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        userId: doc.data().userId,
        createdAt: doc.data().createdAt.toDate(),
      }));
    } catch (error) {
      console.error("Error getting user lists:", error);
      throw error;
    }
  },

  async updateList(
    listId: string,
    updates: Partial<CustomList>
  ): Promise<void> {
    try {
      const listRef = doc(db, "lists", listId);
      await updateDoc(listRef, updates);
    } catch (error) {
      console.error("Error updating list:", error);
      throw error;
    }
  },

  async deleteList(listId: string): Promise<void> {
    try {
      console.log("Deleting list with ID:", listId);
      const listRef = doc(db, "lists", listId);
      await deleteDoc(listRef);
      console.log("List deleted successfully");
    } catch (error) {
      console.error("Error deleting list:", error);
      throw error;
    }
  },
};
