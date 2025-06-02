import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLists } from "../contexts/ListContext";
import { listService } from "../services/listService";
import { listItemService } from "../services/listItemService";
import type { ListItem } from "../services/listItemService";
import { Icon } from "@iconify/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { DropTargetMonitor, DragSourceMonitor } from "react-dnd";

type DragItem = {
  id: string;
  index: number;
  item: ListItem;
};

const DraggableListItem = ({
  item,
  index,
  moveItem,
  onToggle,
  onDelete,
}: {
  item: ListItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onToggle: (itemId: string, completed: boolean) => void;
  onDelete: (itemId: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "LIST_ITEM",
    item: { id: item.id, index, item },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop, dropPosition }, drop] = useDrop<
    DragItem,
    void,
    {
      isOver: boolean;
      canDrop: boolean;
      dropPosition: "before" | "after" | null;
    }
  >({
    accept: "LIST_ITEM",
    collect: (monitor: DropTargetMonitor) => {
      const isOver = monitor.isOver();
      const canDrop = monitor.canDrop();
      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      let dropPosition: "before" | "after" | null = null;
      if (isOver && hoverBoundingRect && clientOffset) {
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        dropPosition = hoverClientY < hoverMiddleY * 0.8 ? "before" : "after";
      }

      return { isOver, canDrop, dropPosition };
    },
    canDrop: (draggedItem: DragItem) => !(draggedItem.id === item.id),
    hover: (draggedItem: DragItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      const dropThreshold = hoverMiddleY * 0.8;

      if (dragIndex < hoverIndex && hoverClientY < dropThreshold) return;
      if (dragIndex > hoverIndex && hoverClientY > dropThreshold) return;

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const opacity = isDragging ? 0.4 : 1;

  const getDropZoneStyles = () => {
    if (!isOver || !canDrop) return {};

    const baseStyle = {
      position: "relative" as const,
      transition: "all 0.2s ease-in-out",
    };

    if (dropPosition === "before") {
      return {
        ...baseStyle,
        borderTop: "2px solid theme(colors.pri-pur.500)",
        marginTop: "2px",
      };
    } else if (dropPosition === "after") {
      return {
        ...baseStyle,
        borderBottom: "2px solid theme(colors.pri-pur.500)",
        marginBottom: "2px",
      };
    }

    return baseStyle;
  };

  return (
    <div
      ref={ref}
      style={{
        opacity,
        ...getDropZoneStyles(),
      }}
      className={`transition-all duration-200 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${
        isOver && canDrop ? "bg-pri-pur-500/5" : ""
      } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-lg`}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-dropeffect="move"
    >
      <div
        key={item.id}
        role="listitem"
        className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all duration-300 ${
          item.completed
            ? "bg-pri-pur-400/50 dark:bg-pri-pur-900/50 border-pri-pur-800/30 dark:border-pri-pur-700/30"
            : "bg-neu-gre-200 dark:bg-neu-gre-700 border-neu-gre-400/30 dark:border-neu-gre-600/30 hover:border-neu-gre-500 dark:hover:border-neu-gre-500"
        }`}
      >
        <button
          onClick={() => onToggle(item.id, !item.completed)}
          className={`transition-all duration-300 flex items-center justify-center ${
            item.completed
              ? "text-pri-pur-800 dark:text-pri-pur-300 hover:text-pri-pur-700 dark:hover:text-pri-pur-400 scale-95"
              : "text-neu-gre-800 dark:text-neu-gre-100 hover:text-pri-pur-500 dark:hover:text-pri-pur-400 hover:scale-95"
          } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md p-1`}
          aria-label={`Mark item "${item.text}" as ${
            item.completed ? "incomplete" : "complete"
          }`}
          aria-pressed={item.completed}
        >
          {item.completed ? (
            <Icon
              icon="mingcute:check-2-fill"
              className="w-6 h-6"
              aria-hidden="true"
            />
          ) : (
            <Icon
              icon="mingcute:round-line"
              className="w-6 h-6"
              aria-hidden="true"
            />
          )}
        </button>
        <span
          className={`flex-1 font-inter text-base font-medium ${
            item.completed
              ? "text-pri-pur-800 dark:text-pri-pur-300 line-through"
              : "text-neu-gre-800 dark:text-neu-gre-100"
          }`}
          aria-label={item.completed ? `${item.text} (completed)` : item.text}
        >
          {item.text}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className={`p-1 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md ${
            item.completed
              ? "text-pri-pur-800 dark:text-pri-pur-300 hover:text-pri-pur-700 dark:hover:text-pri-pur-400"
              : "text-neu-gre-600 dark:text-neu-gre-300 hover:text-sup-err-400 dark:hover:text-sup-err-300"
          }`}
          aria-label={`Delete item "${item.text}"`}
        >
          <Icon
            icon="mingcute:delete-2-fill"
            className="w-5 h-5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
};

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
  const nameInputRef = useRef<HTMLTextAreaElement>(null);

  const currentList = lists.find((list) => list.id === listId);

  // Add effect to focus title div when page loads
  useEffect(() => {
    if (!loading && currentList) {
      setIsEditingName(false);
      // Use requestAnimationFrame to ensure the DOM is ready
      requestAnimationFrame(() => {
        const titleDiv = document.querySelector("[data-title-div]");
        if (titleDiv instanceof HTMLElement) {
          titleDiv.focus();
        }
      });
    }
  }, [loading, currentList]);

  // Add focus management effect
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      const length = nameInputRef.current.value.length;
      nameInputRef.current.setSelectionRange(length, length);
    }
  }, [isEditingName]);

  useEffect(() => {
    if (currentList) {
      setEditedName(currentList.name);
    }
  }, [currentList]);

  // Add auto-resize effect for title textarea
  useEffect(() => {
    const textarea = nameInputRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set the height to scrollHeight to fit the content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editedName]);

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

  const moveItem = async (dragIndex: number, hoverIndex: number) => {
    const newItems = [...listItems];
    const [movedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, movedItem);

    // Update state immediately
    setListItems(newItems);

    // Save the new order to the database
    try {
      if (currentUser && listId) {
        await listItemService.updateListItemsOrder(listId, newItems);
      }
    } catch (error) {
      console.error("Error saving item order:", error);
      // Revert state changes if the database update fails
      setListItems(listItems);
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
    <DndProvider backend={HTML5Backend}>
      <div className="mt-16 font-inter">
        <div className="max-w-4xl mx-auto">
          <div className="bg-neu-whi-100 dark:bg-neu-gre-700 rounded-5xl pl-16 pr-16 pt-16 pb-16 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-2">
              List title
            </div>
            <div className="flex justify-between items-center mb-8">
              {isEditingName ? (
                <div
                  className="flex items-center space-x-3 flex-1 bg-neu-gre-200 dark:bg-neu-gre-800 rounded-md p-4"
                  role="group"
                  aria-label="Edit list title"
                >
                  <Icon
                    icon="mingcute:pencil-3-fill"
                    className="text-neu-gre-800 dark:text-neu-gre-100 w-6 h-6"
                    aria-hidden="true"
                  />
                  <textarea
                    ref={nameInputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleNameEdit();
                      } else if (e.key === "Escape") {
                        setEditedName(currentList?.name || "");
                        setIsEditingName(false);
                      }
                    }}
                    onFocus={() => console.log("Focused: List title textarea")}
                    onBlur={handleNameEdit}
                    className="flex-1 bg-transparent text-lg font-inter font-semibold text-neu-gre-800 dark:text-neu-gre-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-pur-300 dark:focus:border-pri-pur-400 transition-colors duration-200 resize-none overflow-hidden min-h-[28px] py-0"
                    rows={1}
                    style={{ height: "auto" }}
                    aria-label="List title"
                    tabIndex={0}
                  />
                </div>
              ) : (
                <div
                  data-title-div
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center space-x-3 flex-1 bg-neu-gre-200 dark:bg-neu-gre-800 rounded-md p-4 cursor-pointer hover:bg-neu-gre-300 dark:hover:bg-neu-gre-800/50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsEditingName(true);
                    }
                  }}
                  onFocus={() => console.log("Focused: List title div")}
                  aria-label={`Edit list title "${currentList.name}"`}
                >
                  <Icon
                    icon="mingcute:pencil-3-fill"
                    className="text-neu-gre-800 dark:text-neu-gre-100 w-6 h-6"
                    aria-hidden="true"
                  />
                  <h1 className="text-lg font-inter font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                    {currentList.name}
                  </h1>
                </div>
              )}
              <button
                onClick={handleDeleteList}
                className="ml-4 px-4 py-2 bg-neu-whi-100 dark:bg-neu-gre-700 font-medium text-neu-gre-800 dark:text-neu-gre-100 dark:hover:text-neu-whi-100 dark:hover:bg-sup-err-400 rounded-md hover:bg-sup-err-400 hover:text-neu-whi-100 transition-colors duration-200 font-inter focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 flex items-center gap-2"
                tabIndex={0}
                onFocus={() => console.log("Focused: Delete list button")}
              >
                <Icon icon="mingcute:delete-2-fill" width={20} height={20} />
                Delete list
              </button>
            </div>

            <form
              onSubmit={handleAddItem}
              className="mb-16"
              role="form"
              aria-label="Add new item"
            >
              <div className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-2">
                New item
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2 flex-1 bg-neu-gre-200 dark:bg-neu-gre-800 dark:hover:bg-neu-gre-800/50 rounded-md px-4 py-2 ring-2 ring-pri-pur-500/25 dark:border-2 dark:border-dashed dark:border-pri-pur-300/50 focus-within:ring-2 focus-within:ring-pri-pur-500/75 dark:focus-within:border-2 dark:focus-within:border-pri-pur-300/75 transition-all duration-200 ease-in-out">
                  <div className="flex items-center justify-center">
                    <Icon
                      icon="mingcute:add-fill"
                      className="w-6 h-6 text-pri-pur-300 dark:text-pri-pur-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItem(e);
                      if (e.key === "Escape") setNewItemText("");
                    }}
                    onFocus={() => console.log("Focused: New item input")}
                    placeholder="Add item"
                    className="flex-1 bg-transparent py-2 font-inter text-base text-neu-gre-800 dark:text-neu-gre-100 placeholder-neu-gre-600 dark:placeholder-neu-gre-400 focus:outline-none"
                    aria-label="New item text"
                    tabIndex={0}
                  />
                </div>
                <button
                  type="submit"
                  className="px-16 py-4 text-base bg-pri-pur-500 dark:bg-pri-pur-600 font-inter font-medium text-neu-whi-100 hover:bg-pri-pur-700 dark:hover:bg-pri-pur-700 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md flex items-center gap-2"
                  aria-label="Add new item to list"
                  tabIndex={0}
                  onFocus={() => console.log("Focused: Add item button")}
                >
                  <Icon
                    icon="mingcute:add-fill"
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                  Add to list
                </button>
              </div>
            </form>

            <div className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-2">
              Listed items
            </div>
            <div className="space-y-3">
              {listItems.length === 0 ? (
                <div className="text-neu-gre-600 dark:text-neu-gre-400 text-center py-8 bg-transparent rounded-lg">
                  There are no items in this list yet. Add some items above.
                </div>
              ) : (
                listItems.map((item, index) => (
                  <DraggableListItem
                    key={item.id}
                    item={item}
                    index={index}
                    moveItem={moveItem}
                    onToggle={handleToggleItem}
                    onDelete={handleDeleteItem}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
