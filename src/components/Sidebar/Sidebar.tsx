import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLists } from "../../contexts/ListContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SquareAltArrowLeft,
  SquareAltArrowRight,
  User,
  Logout,
  Sun,
  Moon,
  Unread,
  StarShine,
  AltArrowRight,
} from "solar-icon-set";
import { Icon } from "@iconify/react";
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
  icon: () => JSX.Element;
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
      {
        id: "today",
        label: "Today",
        icon: () => (
          <Icon icon="mingcute:schedule-fill" width={24} height={24} />
        ),
        path: "/",
      },
      {
        id: "next7days",
        label: "Next 7 Days",
        icon: () => (
          <Icon icon="mingcute:trello-board-fill" width={24} height={24} />
        ),
        path: "/next7days",
      },
    ],
  },
  {
    title: "Progress",
    items: [
      {
        id: "habits",
        label: "Habits",
        icon: () => <Icon icon="mingcute:heart-fill" width={24} height={24} />,
        path: "/habits",
      },
      {
        id: "goals",
        label: "Goals",
        icon: () => <Icon icon="mingcute:trophy-fill" width={24} height={24} />,
        path: "/goals",
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

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
      } bg-neu-whi-100 border-r border-neu-gre-300 transition-all duration-300 ease-in-out relative`}
    >
      <div className="h-full flex flex-col">
        {/* Logo and Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-neu-gre-300">
          {isOpen ? (
            <img
              src="/assets/logos/dori-logotype-638x200.png"
              alt="Dori"
              className="h-8"
            />
          ) : (
            <img
              src="/assets/logos/dori-logo-200x200.png"
              alt="Dori"
              className="h-8 w-8"
            />
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-neu-gre-100 hover:text-neu-gre-700 text-neu-gre-500 flex items-center justify-center"
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

        {/* User Profile Section - Moved to top */}
        <div className="px-4 py-3 border-b border-neu-gre-300">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center space-x-3 p-2 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter"
            >
              <img
                src={avatars[(userDetails.selectedAvatar || 1) - 1].src}
                alt="Profile"
                className="w-8 h-8 rounded-md"
              />
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">
                    {userDetails.firstName}
                  </p>
                  <p className="text-xs text-neu-gre-500 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-neu-whi-100 rounded-lg shadow-lg border border-neu-gre-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/account");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neu-gre-700 hover:bg-neu-gre-100 hover:rounded-lg font-inter"
                  >
                    <User size={20} color="currentColor" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neu-gre-700 hover:bg-neu-gre-100 hover:rounded-lg font-inter"
                  >
                    <Logout size={20} color="currentColor" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-6">
            {/* Tasks Section */}
            <div className="space-y-1">
              {isOpen && (
                <h2 className="text-sm font-medium text-neu-gre-600 mb-2">
                  Tasks
                </h2>
              )}
              <button
                onClick={() => navigate("/")}
                className={`w-full flex items-center space-x-3 p-3 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter ${
                  location.pathname === "/"
                    ? "bg-neu-gre-100 text-neu-gre-900"
                    : ""
                }`}
              >
                <Icon
                  icon="mingcute:calendar-day-fill"
                  width={20}
                  height={20}
                />
                {isOpen && <span>Today</span>}
              </button>

              <button
                onClick={() => navigate("/next7days")}
                className={`w-full flex items-center space-x-3 p-3 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter ${
                  location.pathname === "/next7days"
                    ? "bg-neu-gre-100 text-neu-gre-900"
                    : ""
                }`}
              >
                <Icon icon="mingcute:calendar-fill" width={20} height={20} />
                {isOpen && <span>Next 7 Days</span>}
              </button>
            </div>

            {/* Progress Section */}
            <div className="space-y-1">
              {isOpen && (
                <h2 className="text-sm font-medium text-neu-gre-600 mb-2">
                  Progress
                </h2>
              )}
              <button
                onClick={() => navigate("/habits")}
                className={`w-full flex items-center space-x-3 p-3 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter ${
                  location.pathname === "/habits"
                    ? "bg-neu-gre-100 text-neu-gre-900"
                    : ""
                }`}
              >
                <Icon icon="mingcute:heart-fill" width={20} height={20} />
                {isOpen && <span>Habits</span>}
              </button>

              <button
                onClick={() => navigate("/goals")}
                className={`w-full flex items-center space-x-3 p-3 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter ${
                  location.pathname === "/goals"
                    ? "bg-neu-gre-100 text-neu-gre-900"
                    : ""
                }`}
              >
                <Icon icon="mingcute:star-fill" width={20} height={20} />
                {isOpen && <span>Goals</span>}
              </button>
            </div>

            {/* Lists Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-2">
                {isOpen && (
                  <h2 className="text-sm font-medium text-neu-gre-600">
                    Lists
                  </h2>
                )}
                <button
                  onClick={() => setIsAddingList(true)}
                  className="p-2 rounded-md hover:bg-neu-gre-100 text-neu-gre-500 hover:text-neu-gre-700"
                >
                  <Icon icon="mingcute:add-fill" width={20} height={20} />
                </button>
              </div>

              {/* Lists */}
              <div className="space-y-1">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => navigate(`/list/${list.id}`)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-md text-neu-gre-700 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter ${
                      location.pathname === `/list/${list.id}`
                        ? "bg-neu-gre-100 text-neu-gre-900"
                        : ""
                    }`}
                  >
                    <Icon
                      icon="mingcute:minimize-line"
                      width={16}
                      height={16}
                    />
                    {isOpen && <span>{list.name}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Settings */}
        <div className="px-4 pb-4">
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              className="w-full flex items-center text-base font-medium space-x-3 p-3 rounded-md text-neu-gre-600 hover:bg-neu-gre-100 hover:text-neu-gre-900 font-inter"
            >
              <Icon icon="mingcute:settings-3-fill" width={24} height={24} />
              {isOpen && <span>Settings</span>}
            </button>

            {/* Settings Dropdown Menu */}
            {isSettingsMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-neu-whi-100 rounded-lg shadow-lg border border-neu-gre-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDarkMode(!isDarkMode);
                      setIsSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neu-gre-700 hover:bg-neu-gre-100 hover:rounded-lg font-inter"
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
                    <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-neu-gre-700 hover:bg-neu-gre-100 hover:rounded-lg font-inter">
                      <div className="flex items-center space-x-2">
                        <StarShine size={20} color="currentColor" />
                        <span>Highlight next task</span>
                      </div>
                      <AltArrowRight size={15} color="currentColor" />
                    </button>

                    {/* Submenu */}
                    <div className="absolute left-full top-0 ml-1 w-24 bg-neu-whi-100 rounded-lg shadow-lg border border-neu-gre-200 hidden group-hover:block">
                      <button
                        onClick={() => {
                          handleHighlightNextTask(true);
                          setIsSettingsMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm hover:bg-neu-gre-100 hover:rounded-t-lg font-inter ${
                          highlightNextTask
                            ? "text-pri-pin-500"
                            : "text-neu-gre-700"
                        }`}
                      >
                        <span>Yes</span>
                        {highlightNextTask && (
                          <Unread size={16} color="#FF87BD" className="ml-1" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          handleHighlightNextTask(false);
                          setIsSettingsMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm hover:bg-neu-gre-100 hover:rounded-b-lg font-inter ${
                          !highlightNextTask
                            ? "text-pri-pin-500"
                            : "text-neu-gre-700"
                        }`}
                      >
                        <span>No</span>
                        {!highlightNextTask && (
                          <Unread size={16} color="#FF87BD" className="ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
