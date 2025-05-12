import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLists } from "../contexts/ListContext";
import { listService } from "../services/listService";
import { listItemService } from "../services/listItemService";
import type { ListItem } from "../services/listItemService";

export function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const { currentUser } = useAuth();
  const { lists, removeList } = useLists();
  const navigate = useNavigate();
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const currentList = lists.find((list) => list.id === listId);

  useEffect(() => {
    if (currentList) {
      setEditedName(currentList.name);
    }
  }, [currentList]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    const loadList = async () => {
      if (!currentUser || !listId) return;

      try {
        console.log("Loading list items for list:", listId);
        const items = await listItemService.getListItems(
          currentUser.uid,
          listId
        );
        console.log("Loaded items:", items);
        setListItems(items);
      } catch (error) {
        console.error("Error loading list items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [currentUser, listId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !listId || !newItemText.trim()) return;

    try {
      console.log("Adding new item:", newItemText.trim());
      const newItem = await listItemService.addItem(
        currentUser.uid,
        listId,
        newItemText.trim()
      );
      console.log("Item added successfully:", newItem);
      setListItems([...listItems, newItem]);
      setNewItemText("");
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    if (!listId) return;
    try {
      console.log("Toggling item:", itemId, "to:", completed);
      await listItemService.toggleItem(listId, itemId, completed);
      setListItems(
        listItems.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        )
      );
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!listId) return;
    try {
      console.log("Deleting item:", itemId);
      await listItemService.deleteItem(listId, itemId);
      setListItems(listItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDeleteList = async () => {
    if (!listId) return;
    try {
      console.log("Deleting list:", listId);
      // Delete all items first
      await Promise.all(
        listItems.map((item) => listItemService.deleteItem(listId, item.id))
      );
      // Then delete the list
      await listService.deleteList(listId);
      // Remove from context
      removeList(listId);
      // Navigate back to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const handleNameEdit = async () => {
    if (!listId || !editedName.trim() || editedName === currentList?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      console.log("Updating list name:", editedName.trim());
      await listService.updateList(listId, { name: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating list name:", error);
      // Reset to original name on error
      setEditedName(currentList?.name || "");
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameEdit();
    } else if (e.key === "Escape") {
      setEditedName(currentList?.name || "");
      setIsEditingName(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-neu-400">Loading list...</div>
        </div>
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-neu-400">List not found</div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-pri-blue-500 text-white rounded-md hover:bg-pri-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-outfit">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameEdit}
              className="text-4xl font-bold bg-neu-800 text-neu-100 px-4 py-2 rounded-lg border-2 border-neu-600 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent"
            />
          ) : (
            <h1
              onClick={() => setIsEditingName(true)}
              className="text-4xl font-bold text-pri-blue-100 cursor-pointer hover:text-pri-blue-200 transition-colors"
            >
              {currentList.name}
            </h1>
          )}
          <button
            onClick={handleDeleteList}
            className="px-6 py-2 bg-sup-err-400 text-sup-err-100 rounded-lg hover:bg-sup-err-500 transition-colors font-outfit"
          >
            Delete List
          </button>
        </div>

        <form onSubmit={handleAddItem} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem(e);
                if (e.key === "Escape") setNewItemText("");
              }}
              placeholder="Add new item..."
              className="flex-1 px-4 py-2 bg-neu-800 text-neu-100 rounded-lg border-2 border-neu-600 placeholder-neu-600 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent font-outfit"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-pri-blue-500 text-neu-100 rounded-lg hover:bg-pri-blue-600 transition-colors font-outfit"
            >
              Add Item
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {listItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-neu-800 rounded-lg border-2 border-neu-600 hover:border-neu-500 transition-colors"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                className="w-5 h-5 rounded border-2 border-neu-600 text-pri-blue-500 focus:ring-2 focus:ring-pri-blue-500"
              />
              <span
                className={`flex-1 font-outfit ${
                  item.completed ? "text-neu-500" : "text-neu-100"
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="text-sup-err-400 hover:text-sup-err-300 transition-colors font-outfit"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
