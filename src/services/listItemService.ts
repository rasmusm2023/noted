import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  listId: string;
  userId: string;
  order?: number;
}

export const listItemService = {
  async addItem(
    userId: string,
    listId: string,
    text: string
  ): Promise<ListItem> {
    try {
      console.log("Adding item to list:", { userId, listId, text });
      const itemsRef = collection(db, "lists", listId, "items");
      const newItem = {
        text,
        completed: false,
        listId,
        userId,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(itemsRef, newItem);
      console.log("Item added successfully with ID:", docRef.id);

      return {
        id: docRef.id,
        text,
        completed: false,
        listId,
        userId,
      };
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

  async getListItems(userId: string, listId: string): Promise<ListItem[]> {
    try {
      console.log("Getting items for list:", { userId, listId });
      const itemsRef = collection(db, "lists", listId, "items");
      const q = query(itemsRef, where("userId", "==", userId));

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as ListItem)
      );

      // Sort items by order field, defaulting to 0 if order is not set
      const sortedItems = items.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });

      console.log("Found items:", sortedItems);
      return sortedItems;
    } catch (error) {
      console.error("Error getting list items:", error);
      throw error;
    }
  },

  async toggleItem(
    listId: string,
    itemId: string,
    completed: boolean
  ): Promise<void> {
    try {
      console.log("Toggling item:", { listId, itemId, completed });
      const itemRef = doc(db, "lists", listId, "items", itemId);
      await updateDoc(itemRef, { completed });
      console.log("Item toggled successfully");
    } catch (error) {
      console.error("Error toggling item:", error);
      throw error;
    }
  },

  async deleteItem(listId: string, itemId: string): Promise<void> {
    try {
      console.log("Deleting item:", { listId, itemId });
      const itemRef = doc(db, "lists", listId, "items", itemId);
      await deleteDoc(itemRef);
      console.log("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  },

  async updateListItemsOrder(listId: string, items: ListItem[]): Promise<void> {
    const batch = writeBatch(db);

    items.forEach((item, index) => {
      const itemRef = doc(db, "lists", listId, "items", item.id);
      batch.update(itemRef, { order: index });
    });

    await batch.commit();
  },
};
