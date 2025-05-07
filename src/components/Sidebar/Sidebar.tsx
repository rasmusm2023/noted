import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLists } from "../../contexts/ListContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  CalendarDate,
  HeartShine,
  StarsMinimalistic,
  Settings,
  SquareAltArrowLeft,
  SquareAltArrowRight,
  AddSquare,
  Checklist,
} from "solar-icon-set";
import { listService } from "../../services/listService";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Tasks",
    items: [
      { id: "today", label: "Today", icon: ClipboardCheck, path: "/" },
      {
        id: "next7days",
        label: "Next 7 Days",
        icon: CalendarDate,
        path: "/next7days",
      },
    ],
  },
  {
    title: "Progress",
    items: [
      { id: "habits", label: "Habits", icon: HeartShine, path: "/habits" },
      { id: "goals", label: "Goals", icon: StarsMinimalistic, path: "/goals" },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { lists, loading, error, addList, clearError } = useLists();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleAddList = async () => {
    if (!currentUser || !newListName.trim()) {
      console.log("Cannot create list: No user or empty name");
      return;
    }

    try {
      console.log("Creating new list:", newListName.trim());
      const newList = await listService.createList(
        currentUser.uid,
        newListName.trim()
      );
      console.log("List created successfully:", newList);

      // Add the new list to the context
      addList(newList);

      // Reset the form
      setNewListName("");
      setIsAddingList(false);

      // Navigate to the new list
      handleNavigation(`/list/${newList.id}`);
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-24"
      } bg-neu-800 transition-all duration-300 ease-in-out`}
    >
      <div className="h-full flex flex-col">
        {/* Logo and Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-neu-700">
          {isOpen ? (
            <h1 className="text-2xl font-bold text-pri-blue-100">noted.</h1>
          ) : (
            <h1 className="text-2xl font-bold text-pri-blue-100">n.</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-neu-700 text-neu-300"
          >
            {isOpen ? (
              <SquareAltArrowLeft size={32} color="currentColor" />
            ) : (
              <SquareAltArrowRight size={32} color="currentColor" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {isOpen && (
                <h2 className="px-3 text-md font-bold text-neu-500 uppercase tracking-wider">
                  {section.title}
                </h2>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center font-semibold space-x-3 p-3 rounded-md ${
                    location.pathname === item.path
                      ? "bg-pri-blue-500 text-neu-100"
                      : "text-neu-500 hover:bg-neu-700 hover:text-neu-100"
                  }`}
                >
                  <item.icon
                    size={32}
                    color={
                      location.pathname === item.path
                        ? "neu-100"
                        : "currentColor"
                    }
                  />
                  {isOpen && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          ))}

          {/* Lists Section */}
          <div className="space-y-2">
            {isOpen && (
              <h2 className="px-3 text-md font-bold text-neu-500 uppercase tracking-wider">
                Lists
              </h2>
            )}

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 bg-sup-err-400 text-sup-err-100 rounded-md text-sm">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 text-sup-err-100 hover:text-sup-err-200"
                >
                  ×
                </button>
              </div>
            )}

            {/* Custom Lists */}
            {loading ? (
              <div className="px-3 text-neu-500">Loading lists...</div>
            ) : (
              <>
                {lists.map((list) => (
                  <div key={list.id} className="group flex items-center">
                    <button
                      onClick={() => handleNavigation(`/list/${list.id}`)}
                      className={`flex-1 flex items-center font-semibold space-x-3 p-3 rounded-md ${
                        location.pathname === `/list/${list.id}`
                          ? "bg-pri-blue-500 text-neu-100"
                          : "text-neu-500 hover:bg-neu-700 hover:text-neu-100"
                      }`}
                    >
                      <Checklist
                        size={32}
                        color={
                          location.pathname === `/list/${list.id}`
                            ? "neu-100"
                            : "currentColor"
                        }
                      />
                      {isOpen && <span>{list.name}</span>}
                    </button>
                  </div>
                ))}

                {/* Add List Button */}
                {isOpen && !isAddingList && (
                  <button
                    onClick={() => setIsAddingList(true)}
                    className="w-full flex items-center font-semibold space-x-3 p-3 rounded-md text-neu-500 hover:bg-neu-700 hover:text-neu-100 border-2 border-dashed border-neu-700 hover:border-neu-500 transition-colors"
                  >
                    <AddSquare size={32} color="currentColor" />
                    <span>Add List</span>
                  </button>
                )}

                {/* Add List Input */}
                {isOpen && isAddingList && (
                  <div className="flex flex-col space-y-2 p-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddList();
                        if (e.key === "Escape") {
                          setIsAddingList(false);
                          setNewListName("");
                        }
                      }}
                      placeholder="List name..."
                      className="w-full p-2 bg-neu-700 rounded text-neu-100 focus:outline-none focus:ring-2 focus:ring-pri-blue-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddList}
                        className="flex-1 p-2 text-neu-100 bg-pri-blue-500 rounded hover:bg-pri-blue-600"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListName("");
                        }}
                        className="flex-1 p-2 text-neu-100 bg-neu-700 rounded hover:bg-neu-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-neu-700">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 p-3 rounded-md text-neu-400 hover:bg-neu-700 hover:text-neu-100"
          >
            <Settings size={32} color="currentColor" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
