import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLists } from "../../contexts/ListContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  HeartShine,
  StarsMinimalistic,
  Settings,
  SquareAltArrowLeft,
  SquareAltArrowRight,
  AddSquare,
  Checklist,
  User,
  Logout,
  Sun,
  Moon,
  Unread,
  StarShine,
  AltArrowRight,
} from "solar-icon-set";
import { CalendarSeven } from "../../assets/icons";
import { listService } from "../../services/listService";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";

// Import custom avatars
import avatar1 from "../../assets/profile-avatars/PFP_option1.png";
import avatar2 from "../../assets/profile-avatars/PFP_option2.png";
import avatar3 from "../../assets/profile-avatars/PFP_option3.png";
import avatar4 from "../../assets/profile-avatars/PFP_option4.png";

const avatars = [
  { id: 1, src: avatar1 },
  { id: 2, src: avatar2 },
  { id: 3, src: avatar3 },
  { id: 4, src: avatar4 },
];

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
        icon: CalendarSeven,
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
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const returningUserGreetings = [
  "Welcome back,",
  "Hello there,",
  "Great to see you,",
  "Hey there,",
  "Hi there,",
  "Greetings,",
  "Hello,",
  "Hey,",
];

const firstTimeGreetings = ["Welcome,", "Hello,", "Hi there,"];

interface UserDetails {
  firstName: string;
  selectedAvatar?: number;
  createdAt: string;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { lists, loading, error, addList, clearError } = useLists();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: "",
    selectedAvatar: 1,
    createdAt: "",
  });
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [greeting] = useState(() => {
    const greetings = isFirstLogin
      ? firstTimeGreetings
      : returningUserGreetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [highlightNextTask, setHighlightNextTask] = useState(() => {
    const savedState = localStorage.getItem("highlightNextTask");
    return savedState ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data() as UserDetails;
          setUserDetails({
            firstName: data.firstName || "",
            selectedAvatar: data.selectedAvatar || 1,
            createdAt: data.createdAt || "",
          });

          // Check if this is the first login by comparing creation time with last login time
          const creationTime = new Date(data.createdAt).getTime();
          const lastLoginTime = new Date(
            currentUser.metadata.lastSignInTime || ""
          ).getTime();
          setIsFirstLogin(Math.abs(lastLoginTime - creationTime) < 60000); // Within 1 minute
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUserDetails();

    // Set up a listener for user document changes
    if (currentUser) {
      const db = getFirestore();
      const unsubscribe = onSnapshot(
        doc(db, "users", currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserDetails;
            setUserDetails((prev) => ({
              ...prev,
              selectedAvatar: data.selectedAvatar || 1,
            }));
          }
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsSettingsMenuOpen(false);
      }
    };

    if (isProfileMenuOpen || isSettingsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isProfileMenuOpen, isSettingsMenuOpen]);

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

  const handleHighlightNextTask = (value: boolean) => {
    console.log("Sidebar: Setting highlight to:", value);
    // Update local state immediately
    setHighlightNextTask(value);
    // Save to localStorage
    localStorage.setItem("highlightNextTask", JSON.stringify(value));
    // Dispatch custom event to notify other components
    console.log("Sidebar: Dispatching highlightNextTaskChanged event");
    window.dispatchEvent(new Event("highlightNextTaskChanged"));
  };

  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-24"
      } bg-neu-800 transition-all duration-300 ease-in-out relative`}
    >
      <div className="h-full flex flex-col">
        {/* Logo and Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-neu-700">
          {isOpen ? (
            <h1 className="text-2xl font-bold text-pri-blue-100 font-outfit">
              noted.
            </h1>
          ) : (
            <h1 className="text-2xl font-bold text-pri-blue-100 font-outfit">
              n.
            </h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-neu-700 hover:text-neu-400 text-neu-600 flex items-center justify-center"
          >
            {isOpen ? (
              <SquareAltArrowLeft
                size={32}
                color="currentColor"
                autoSize={false}
              />
            ) : (
              <SquareAltArrowRight
                size={32}
                color="currentColor"
                autoSize={false}
              />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {menuSections.map((section, index) => (
            <div key={section.title} className="space-y-2">
              {isOpen && (
                <h2 className="px-3 text-sm font-bold text-neu-500 uppercase tracking-wider font-outfit">
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
                    size={24}
                    color={
                      location.pathname === item.path
                        ? "#f3f4f6"
                        : "currentColor"
                    }
                  />
                  {isOpen && <span>{item.label}</span>}
                </button>
              ))}
              {index < menuSections.length - 1 && (
                <div className="h-px bg-neu-700 my-4" />
              )}
            </div>
          ))}

          {/* Lists Section */}
          <div className="space-y-2">
            <div className="h-px bg-neu-700 mb-4" />
            {isOpen && (
              <h2 className="px-3 text-sm font-bold text-neu-500 uppercase tracking-wider font-outfit">
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
                        size={24}
                        color={
                          location.pathname === `/list/${list.id}`
                            ? "#f3f4f6"
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
                    className="w-full flex items-center font-semibold space-x-3 p-3 rounded-lg text-neu-500 hover:bg-neu-700 hover:text-neu-100 border-2 border-dashed border-neu-600 hover:border-neu-500 transition-colors font-outfit"
                  >
                    <AddSquare size={24} color="currentColor" />
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
                      className="w-full px-4 py-2 bg-neu-800 text-neu-100 rounded-lg border-2 border-neu-600 placeholder-neu-600 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent font-outfit"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddList}
                        className="flex-1 px-4 py-2 text-neu-100 bg-pri-blue-500 rounded-lg hover:bg-pri-blue-600 transition-colors font-outfit"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListName("");
                        }}
                        className="flex-1 px-4 py-2 text-neu-100 bg-neu-700 rounded-lg hover:bg-neu-600 transition-colors font-outfit"
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

        {/* Settings Button */}
        <div className="px-4 pb-4">
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              className="w-full flex items-center text-base font-medium space-x-3 p-3 rounded-md text-neu-400 hover:bg-neu-700 hover:text-neu-100 font-outfit"
            >
              <Settings size={24} color="currentColor" />
              {isOpen && <span>Settings</span>}
            </button>

            {/* Settings Dropdown Menu */}
            {isSettingsMenuOpen && (
              <div className="absolute bottom-full left-full ml-2 w-48 bg-neu-800 rounded-lg shadow-lg border border-neu-700 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDarkMode(!isDarkMode);
                      setIsSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neu-100 hover:bg-neu-700 hover:rounded-lg font-outfit"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun size={20} color="currentColor" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon size={20} color="currentColor" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>

                  {/* Highlight Next Task Option */}
                  <div className="relative group">
                    <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-neu-100 hover:bg-neu-700 hover:rounded-lg font-outfit">
                      <div className="flex items-center space-x-2">
                        <StarShine size={20} color="currentColor" />
                        <span>Highlight next task</span>
                      </div>
                      <AltArrowRight size={15} color="currentColor" />
                    </button>

                    {/* Submenu */}
                    <div className="absolute left-full top-0 ml-1 w-24 bg-neu-800 rounded-lg shadow-lg border border-neu-700 hidden group-hover:block">
                      <button
                        onClick={() => {
                          handleHighlightNextTask(true);
                          setIsSettingsMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm hover:bg-neu-700 hover:rounded-t-lg font-outfit ${
                          highlightNextTask
                            ? "text-pri-blue-500"
                            : "text-neu-100"
                        }`}
                      >
                        <span>Yes</span>
                        {highlightNextTask && (
                          <Unread size={16} color="#3b82f6" className="ml-1" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleHighlightNextTask(false);
                          setIsSettingsMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm hover:bg-neu-700 hover:rounded-b-lg font-outfit ${
                          !highlightNextTask
                            ? "text-pri-blue-500"
                            : "text-neu-100"
                        }`}
                      >
                        <span>No</span>
                        {!highlightNextTask && (
                          <Unread size={16} color="#3b82f6" className="ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-t border-neu-700">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center space-x-4 p-4 rounded-md text-neu-400 hover:bg-neu-700 hover:text-neu-100"
            >
              <div className="w-12 h-12 rounded-lg bg-neu-700 flex items-center justify-center overflow-hidden">
                {userDetails.selectedAvatar ? (
                  <img
                    src={
                      avatars.find((a) => a.id === userDetails.selectedAvatar)
                        ?.src
                    }
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={24} color="currentColor" />
                )}
              </div>
              {isOpen && (
                <div className="flex-1 text-left font-outfit">
                  <p className="text-md font-medium text-neu-100">
                    {greeting}{" "}
                    {userDetails.firstName ||
                      currentUser?.email?.split("@")[0] ||
                      "User"}
                  </p>
                  <p className="text-sm text-neu-400">
                    {currentUser?.email || ""}
                  </p>
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-full ml-2 w-56 bg-neu-800 rounded-lg shadow-lg border border-neu-700">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/account");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-base text-neu-100 hover:bg-neu-700 font-outfit"
                  >
                    <User size={24} color="currentColor" />
                    <span>Account Details</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-base text-red-400 hover:bg-neu-700 font-outfit"
                  >
                    <Logout size={24} color="currentColor" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
