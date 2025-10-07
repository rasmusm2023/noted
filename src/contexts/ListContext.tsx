import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { listService, type CustomList } from "../services/listService";

interface ListContextType {
  lists: CustomList[];
  loading: boolean;
  error: string | null;
  refreshLists: () => Promise<void>;
  addList: (list: CustomList) => void;
  updateList: (listId: string, updates: Partial<CustomList>) => void;
  removeList: (listId: string) => void;
  clearError: () => void;
}

const ListContext = createContext<ListContextType | null>(null);

export function useLists() {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useLists must be used within a ListProvider");
  }
  return context;
}

export function ListProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLists = async () => {
    if (!currentUser) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userLists = await listService.getUserLists(currentUser.uid);
      setLists(userLists);
    } catch (error) {
      console.error("Error loading lists:", error);
      setError("Failed to load lists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addList = (list: CustomList) => {
    setLists((prevLists) => [...prevLists, list]);
  };

  const updateList = (listId: string, updates: Partial<CustomList>) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      )
    );
  };

  const removeList = (listId: string) => {
    setLists((prevLists) => prevLists.filter((list) => list.id !== listId));
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    refreshLists();
  }, [currentUser]);

  const value = {
    lists,
    loading,
    error,
    refreshLists,
    addList,
    updateList,
    removeList,
    clearError,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}
