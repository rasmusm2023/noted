import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLists } from "../../contexts/ListContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { listService } from "../../services/listService";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../../contexts/ThemeContext";

// Import custom avatars
import avatar1 from "../../assets/profile-avatars/PFP_option1.png";
import avatar2 from "../../assets/profile-avatars/PFP_option2.png";
import avatar3 from "../../assets/profile-avatars/PFP_option3.png";
import avatar4 from "../../assets/profile-avatars/PFP_option4.png";

// Move avatars outside component to prevent recreation on every render
const avatars = [
  { id: 1, src: avatar1 },
  { id: 2, src: avatar2 },
  { id: 3, src: avatar3 },
  { id: 4, src: avatar4 },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface UserDetails {
  firstName: string;
  selectedAvatar?: number;
  createdAt: string;
  photoURL?: string | null;
  authProvider?: string;
  useGooglePhoto?: boolean;
  customProfileImage?: string | null;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { lists, addList } = useLists();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: "",
    selectedAvatar: 1,
    createdAt: "",
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const darkModeButtonRef = useRef<HTMLButtonElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

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
            photoURL: data.photoURL || undefined,
            authProvider: data.authProvider || undefined,
            useGooglePhoto: data.useGooglePhoto || false,
            customProfileImage: data.customProfileImage || null,
          });
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUserDetails();

    // Set up a listener for user document changes, but only for specific fields
    if (currentUser) {
      const db = getFirestore();
      const unsubscribe = onSnapshot(
        doc(db, "users", currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserDetails;
            setUserDetails((prev) => {
              // Only update if the relevant fields have actually changed
              const newAvatar = data.selectedAvatar || 1;
              const newPhotoURL = data.photoURL || undefined;
              const newUseGooglePhoto = data.useGooglePhoto || false;
              const newCustomProfileImage = data.customProfileImage || null;

              if (
                prev.selectedAvatar === newAvatar &&
                prev.photoURL === newPhotoURL &&
                prev.useGooglePhoto === newUseGooglePhoto &&
                prev.customProfileImage === newCustomProfileImage
              ) {
                return prev; // No change, return same object to prevent re-render
              }

              return {
                ...prev,
                selectedAvatar: newAvatar,
                photoURL: newPhotoURL,
                useGooglePhoto: newUseGooglePhoto,
                customProfileImage: newCustomProfileImage,
              };
            });
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

  // Focus trap for profile menu
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();

        if (event.shiftKey) {
          // If shift + tab and focus is on account button, move to profile button
          if (document.activeElement === accountButtonRef.current) {
            profileButtonRef.current?.focus();
          } else {
            // If shift + tab and focus is on profile button, move to account button
            accountButtonRef.current?.focus();
          }
        } else {
          // If tab and focus is on profile button, move to account button
          if (document.activeElement === profileButtonRef.current) {
            accountButtonRef.current?.focus();
          } else {
            // If tab and focus is on account button, move to profile button
            profileButtonRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isProfileMenuOpen]);

  // Focus trap for settings menu
  useEffect(() => {
    if (!isSettingsMenuOpen) return;

    const focusableElements = [
      settingsButtonRef.current,
      darkModeButtonRef.current,
    ].filter((el): el is HTMLButtonElement => el !== null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();

        const currentIndex = focusableElements.indexOf(
          document.activeElement as HTMLButtonElement
        );

        if (event.shiftKey) {
          // Move focus to previous element
          const previousIndex =
            currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[previousIndex]?.focus();
        } else {
          // Move focus to next element
          const nextIndex =
            currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
          focusableElements[nextIndex]?.focus();
        }
      } else if (event.key === "Escape") {
        // Close settings menu when pressing escape
        setIsSettingsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsMenuOpen]);

  // Add focus trap effect
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Only apply focus trap on mobile/tablet
    if (window.innerWidth < 1024) {
      const focusableElements = sidebarRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const handleFocusTrap = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        const elements = Array.from(focusableElements || []) as HTMLElement[];
        const closeButton = closeButtonRef.current as HTMLElement;
        const closeButtonIndex = elements.indexOf(closeButton);

        // Remove close button from the array to handle it separately
        elements.splice(closeButtonIndex, 1);

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          // If shift + tab and focus is on first element, move to close button
          if (document.activeElement === firstElement) {
            e.preventDefault();
            closeButton.focus();
          }
        } else {
          // If tab and focus is on close button, move to first element
          if (document.activeElement === closeButton) {
            e.preventDefault();
            firstElement.focus();
          }
          // If tab and focus is on last menu item, move to close button
          else if (document.activeElement === lastElement) {
            e.preventDefault();
            closeButton.focus();
          }
        }
      };

      // Focus the first menu item when menu opens
      firstMenuItemRef.current?.focus();

      document.addEventListener("keydown", handleFocusTrap);
      return () => document.removeEventListener("keydown", handleFocusTrap);
    }
  }, [isOpen]);

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const handleAddList = useCallback(async () => {
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
  }, [currentUser, newListName, addList, handleNavigation]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe && isOpen) {
      onToggle();
    }
  }, [touchStart, touchEnd, isOpen, onToggle]);

  // Memoize user avatar selection to prevent unnecessary recalculations
  const userAvatar = useMemo(() => {
    if (userDetails?.useGooglePhoto && userDetails?.photoURL) {
      return {
        src: userDetails.photoURL,
        alt: "User's Google profile picture",
        type: "google" as const,
      };
    } else if (
      userDetails?.selectedAvatar === -1 &&
      userDetails?.customProfileImage
    ) {
      return {
        src: userDetails.customProfileImage,
        alt: "User's custom profile picture",
        type: "custom" as const,
      };
    } else {
      const avatarIndex = Math.max(0, (userDetails?.selectedAvatar || 1) - 1);
      return {
        src: avatars[avatarIndex].src,
        alt: "User's selected profile avatar",
        type: "default" as const,
      };
    }
  }, [
    userDetails?.useGooglePhoto,
    userDetails?.photoURL,
    userDetails?.selectedAvatar,
    userDetails?.customProfileImage,
  ]);

  // Memoize navigation handlers
  const handleTodayClick = useCallback(() => {
    navigate("/");
    if (window.innerWidth < 1024) onToggle();
  }, [navigate, onToggle]);

  const handleNext7DaysClick = useCallback(() => {
    navigate("/next7days");
    if (window.innerWidth < 1024) onToggle();
  }, [navigate, onToggle]);

  const handleGoalsClick = useCallback(() => {
    navigate("/goals");
    if (window.innerWidth < 1024) onToggle();
  }, [navigate, onToggle]);

  const handleAccountClick = useCallback(() => {
    navigate("/account");
    if (window.innerWidth < 1024) onToggle();
  }, [navigate, onToggle]);

  const handleUpgradeClick = useCallback(() => {
    navigate("/upgrade");
    if (window.innerWidth < 1024) onToggle();
  }, [navigate, onToggle]);

  const handleDashboardClick = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleListClick = useCallback(
    (listId: string) => {
      navigate(`/list/${listId}`);
      if (window.innerWidth < 1024) onToggle();
    },
    [navigate, onToggle]
  );

  // Memoize active state calculations to prevent unnecessary recalculations
  const activeStates = useMemo(
    () => ({
      isTodayActive: location.pathname === "/",
      isNext7DaysActive: location.pathname === "/next7days",
      isGoalsActive: location.pathname === "/goals",
      isAccountActive: location.pathname === "/account",
      isUpgradeActive: location.pathname === "/upgrade",
    }),
    [location.pathname]
  );

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <button
        onClick={() => {
          // Close TaskDrawer if it's open
          const taskDrawer = document.querySelector('[role="dialog"]');
          if (taskDrawer) {
            const closeButton = taskDrawer.querySelector(
              '[aria-label="Close drawer"]'
            );
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
            }
          }
          onToggle();
        }}
        tabIndex={3}
        className={`lg:hidden fixed bottom-4 left-4 z-[9999] p-5 rounded-full bg-sec-pea-500 dark:bg-sec-pea-600 text-neu-bla-800 dark:text-neu-whi-100 shadow-[0_4px_14px_rgba(239,112,155,0.4)] dark:shadow-[0_4px_14px_rgba(239,112,155,0.3)] hover:bg-sec-pea-600 dark:hover:bg-sec-pea-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-all duration-200 ${
          isOpen ? "hidden" : "block"
        }`}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="sidebar-navigation"
      >
        <Icon
          icon="mingcute:menu-fill"
          width={32}
          height={32}
          aria-hidden="true"
        />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative h-full z-50 transition-all duration-300 ease-in-out
          ${isOpen ? "w-72" : "w-0 lg:w-24"} 
          bg-neu-whi-100 dark:bg-neu-gre-900 
          border-r border-neu-gre-300 dark:border-neu-gre-700
          transform lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-visible`}
        role="navigation"
        aria-label="Main navigation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo and Toggle */}
          <div
            className={`p-4 flex items-center border-b border-neu-gre-300 dark:border-neu-gre-700 ${
              isOpen ? "justify-between" : "justify-center"
            }`}
          >
            {isOpen && (
              <button
                onClick={handleDashboardClick}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md p-1 -m-1 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 transition-colors duration-200"
                aria-label="Go to Dashboard"
              >
                <img
                  src="/assets/favicon/Noted-app-icon.png"
                  alt="Noted application icon"
                  className="h-8 w-8"
                />
              </button>
            )}
            <button
              onClick={onToggle}
              className="hidden lg:flex p-2 rounded-md text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <Icon
                  icon="mingcute:arrow-to-left-line"
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              ) : (
                <Icon
                  icon="mingcute:arrow-to-right-line"
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="border-b border-neu-gre-300 dark:border-neu-gre-700">
            <div className="px-4 py-3">
              <button
                ref={firstMenuItemRef}
                onClick={handleAccountClick}
                className={`w-full flex items-center ${
                  isOpen ? "space-x-3" : "justify-center"
                } p-2 text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md transition-colors duration-200 ease-in-out ${
                  activeStates.isAccountActive
                    ? "bg-pri-blue-200/70 dark:bg-pri-pur-700 text-pri-blue-800 dark:text-neu-whi-100"
                    : ""
                }`}
                aria-label="Go to account settings"
                aria-current={
                  location.pathname === "/account" ? "page" : undefined
                }
              >
                <img
                  src={userAvatar.src}
                  alt={userAvatar.alt}
                  className={`w-10 h-10 rounded-md ${
                    userAvatar.type === "default" ? "" : "object-cover"
                  }`}
                  aria-hidden="true"
                />
                {isOpen && (
                  <div className="flex-1 min-w-0 ml-3">
                    <p className="text-sm lg:text-base font-medium truncate dark:text-neu-gre-100 text-left">
                      {userDetails.firstName}
                    </p>
                    <p className="text-xs lg:text-sm text-neu-gre-500 dark:text-neu-gre-300 truncate text-left">
                      {currentUser?.email}
                    </p>
                    <p className="text-xs text-neu-gre-500 dark:text-neu-gre-400 text-left mt-1">
                      Free plan
                    </p>
                  </div>
                )}
              </button>
            </div>

            {/* Upgrade Button - Inside Account Section */}
            {isOpen && (
              <div className="px-4 pb-3">
                <button
                  onClick={handleUpgradeClick}
                  className="w-full flex items-center justify-center p-3 rounded-md font-medium text-pri-pur-600 dark:text-pri-pur-400 hover:bg-pri-pur-100 dark:hover:bg-pri-pur-900/20 hover:text-pri-pur-700 dark:hover:text-pri-pur-300 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out border border-pri-pur-300 dark:border-pri-pur-700 bg-pri-pur-100 dark:bg-pri-pur-900/10"
                  aria-current={
                    activeStates.isUpgradeActive ? "page" : undefined
                  }
                >
                  <span className="text-sm font-medium">Upgrade</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4" aria-label="Main menu">
            <div className="px-4 space-y-6">
              {/* Tasks Section */}
              <div className="space-y-1">
                <h2
                  className={`text-sm font-semibold text-neu-gre-700 dark:text-neu-gre-500 mb-2 tracking-wider ${
                    isOpen ? "" : "text-center"
                  }`}
                  id="tasks-section"
                >
                  TASKS
                </h2>
                <div role="group" aria-labelledby="tasks-section">
                  <button
                    onClick={handleTodayClick}
                    className={`w-full flex mb-2 items-center ${
                      isOpen ? "space-x-3" : "justify-center"
                    } p-3 rounded-md font-medium text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out ${
                      activeStates.isTodayActive
                        ? "bg-pri-blue-200/70 dark:bg-pri-pur-700 text-pri-blue-800 dark:text-neu-whi-100"
                        : "text-neu-gre-900 dark:text-neu-gre-500"
                    }`}
                    aria-current={
                      activeStates.isTodayActive ? "page" : undefined
                    }
                  >
                    <Icon
                      icon="mingcute:calendar-day-line"
                      width={20}
                      height={20}
                      className={`text-neu-gre-700 dark:text-neu-gre-500 ${
                        activeStates.isTodayActive
                          ? "text-pri-blue-800 dark:text-neu-whi-100"
                          : ""
                      }`}
                      aria-label="Calendar view"
                    />
                    {isOpen && (
                      <span className="text-sm lg:text-base">Today</span>
                    )}
                  </button>

                  <button
                    onClick={handleNext7DaysClick}
                    className={`w-full flex mb-2 items-center ${
                      isOpen ? "space-x-3" : "justify-center"
                    } p-3 rounded-md font-medium text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out ${
                      activeStates.isNext7DaysActive
                        ? "bg-pri-blue-200/70 dark:bg-pri-pur-700 text-pri-blue-800 dark:text-neu-whi-100"
                        : "text-neu-gre-900 dark:text-neu-gre-500"
                    }`}
                    aria-current={
                      activeStates.isNext7DaysActive ? "page" : undefined
                    }
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Icon
                        icon="mingcute:trello-board-line"
                        width={20}
                        height={20}
                        className={`text-neu-gre-700 dark:text-neu-gre-500 ${
                          activeStates.isNext7DaysActive
                            ? "text-pri-blue-800 dark:text-neu-whi-100"
                            : ""
                        }`}
                        aria-label="Board view"
                      />
                    </div>
                    {isOpen && (
                      <span className="text-sm lg:text-base font-medium">
                        Next 7 Days
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-1">
                <h2
                  className={`text-sm font-semibold text-neu-gre-700 dark:text-neu-gre-500 mb-2 tracking-wider ${
                    isOpen ? "" : "text-center"
                  }`}
                  id="progress-section"
                >
                  PROGRESS
                </h2>
                <div role="group" aria-labelledby="progress-section">
                  <button
                    onClick={handleGoalsClick}
                    className={`w-full flex mb-2 items-center ${
                      isOpen ? "space-x-3" : "justify-center"
                    } p-3 rounded-md font-medium text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out ${
                      activeStates.isGoalsActive
                        ? "bg-pri-blue-200/70 dark:bg-pri-pur-700 text-pri-blue-800 dark:text-neu-whi-100"
                        : "text-neu-gre-900 dark:text-neu-gre-500"
                    }`}
                    aria-current={
                      activeStates.isGoalsActive ? "page" : undefined
                    }
                  >
                    <Icon
                      icon="mingcute:target-line"
                      width={20}
                      height={20}
                      className={`text-neu-gre-700 dark:text-neu-gre-500 ${
                        activeStates.isGoalsActive
                          ? "text-pri-blue-800 dark:text-neu-whi-100"
                          : ""
                      }`}
                      aria-label="Goals"
                    />
                    {isOpen && (
                      <span className="text-sm lg:text-base font-medium">
                        Goals
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Lists Section */}
              <div className="space-y-1">
                <div
                  className={`flex items-center ${
                    isOpen ? "justify-between" : "justify-center"
                  } mb-2`}
                >
                  <h2
                    className={`text-sm font-semibold text-neu-gre-700 dark:text-neu-gre-500 tracking-wider ${
                      isOpen ? "" : "text-center"
                    }`}
                    id="lists-section"
                  >
                    LISTS
                  </h2>
                  {isOpen && (
                    <button
                      onClick={() => setIsAddingList(true)}
                      className="p-2 rounded-md text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out"
                      aria-label="Add new list"
                    >
                      <Icon
                        icon="mingcute:add-circle-line"
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>

                {/* Add List Form */}
                {isAddingList && (
                  <div
                    className={`${
                      isOpen ? "px-2" : "px-1"
                    } py-2 transition-all duration-200 ease-in-out transform origin-top`}
                    role="form"
                    aria-label="Add new list form"
                  >
                    <div className="flex items-center gap-1 animate-fadeIn">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newListName.trim()) {
                            handleAddList();
                          } else if (e.key === "Escape") {
                            setIsAddingList(false);
                            setNewListName("");
                          }
                        }}
                        placeholder="List name"
                        className="w-[calc(100%)] px-3 py-2 text-sm bg-neu-whi-200 dark:bg-neu-gre-700 border border-neu-gre-300 dark:border-neu-gre-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-all duration-200 ease-in-out font-inter placeholder:font-inter text-neu-gre-700 dark:text-neu-gre-100 placeholder:text-neu-gre-400 dark:placeholder:text-neu-gre-400"
                        autoFocus
                        aria-label="New list name"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleAddList}
                          disabled={!newListName.trim()}
                          className="p-0 ml-2 text-pri-pur-500 dark:text-pri-pur-400 hover:text-pri-pur-600 dark:hover:text-pri-pur-300 disabled:text-neu-gre-400 dark:disabled:text-neu-gre-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md transition-all duration-200 ease-in-out"
                          aria-label="Create new list"
                        >
                          <Icon
                            icon="mingcute:check-fill"
                            width={20}
                            height={20}
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingList(false);
                            setNewListName("");
                          }}
                          className="p-0 ml-2 text-neu-gre-500 dark:text-neu-gre-300 hover:text-neu-gre-700 dark:hover:text-neu-gre-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md transition-all duration-200 ease-in-out"
                          aria-label="Cancel creating new list"
                        >
                          <Icon
                            icon="mingcute:close-line"
                            width={20}
                            height={20}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lists */}
                <div
                  className="space-y-1"
                  role="group"
                  aria-labelledby="lists-section"
                >
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleListClick(list.id)}
                      className={`w-full flex mb-2 items-center ${
                        isOpen ? "space-x-3" : "justify-center"
                      } p-3 rounded-md font-medium text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out ${
                        location.pathname === `/list/${list.id}`
                          ? "bg-pri-blue-200/70 dark:bg-pri-pur-700 text-pri-blue-800 dark:text-neu-whi-100"
                          : "text-neu-gre-900 dark:text-neu-gre-500"
                      }`}
                      aria-current={
                        location.pathname === `/list/${list.id}`
                          ? "page"
                          : undefined
                      }
                    >
                      <Icon
                        icon="mingcute:paper-line"
                        width={16}
                        height={16}
                        className={`text-neu-gre-700 dark:text-neu-gre-500 ${
                          location.pathname === `/list/${list.id}`
                            ? "text-pri-blue-800 dark:text-neu-whi-100"
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                      {isOpen && (
                        <span className="text-xs lg:text-sm font-normal">
                          {list.name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Settings */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1" ref={settingsMenuRef}>
                <button
                  ref={settingsButtonRef}
                  onClick={() => {
                    if (!isOpen) {
                      onToggle();
                    }
                    setIsSettingsMenuOpen(!isSettingsMenuOpen);
                    if (!isSettingsMenuOpen) {
                      // Settings menu closed
                    }
                  }}
                  className={`w-full flex items-center ${
                    isOpen ? "space-x-3" : "justify-center"
                  } text-base font-medium p-3 rounded-md text-neu-gre-700 dark:text-neu-gre-500 hover:bg-neu-gre-200 dark:hover:bg-pri-pur-700/50 hover:text-neu-gre-900 dark:hover:text-neu-whi-100 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-colors duration-200 ease-in-out`}
                  aria-expanded={isSettingsMenuOpen}
                  aria-haspopup="true"
                  aria-label="Settings menu"
                >
                  <Icon
                    icon="mingcute:settings-3-line"
                    width={24}
                    height={24}
                    aria-label="Settings"
                  />
                  {isOpen && (
                    <span className="ml-3 text-sm lg:text-base">Settings</span>
                  )}
                </button>

                {/* Settings Dropdown Menu */}
                {isSettingsMenuOpen && (
                  <div
                    className={`absolute ${
                      isOpen ? "left-0" : "left-[6rem]"
                    } bottom-[5rem] w-[16rem] bg-neu-whi-100 dark:bg-neu-bla-800 rounded-lg shadow-lg border border-neu-gre-200 dark:border-neu-gre-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 z-[99999]`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="settings-menu-button"
                  >
                    <div className="py-1">
                      <button
                        ref={darkModeButtonRef}
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm lg:text-base font-medium text-neu-gre-700 dark:text-neu-gre-100 hover:bg-neu-gre-100 dark:hover:bg-neu-bla-700 hover:text-neu-gre-900 dark:hover:text-neu-gre-50 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md"
                        role="menuitem"
                        aria-label={
                          theme === "light"
                            ? "Switch to dark mode"
                            : "Switch to light mode"
                        }
                      >
                        <Icon
                          icon="mingcute:sun-line"
                          className="text-neu-gre-700 dark:text-neu-gre-100 group-hover:text-neu-gre-900 dark:group-hover:text-neu-gre-50"
                          aria-label="Toggle theme"
                        />
                        <span className="flex justify-between items-center w-full">
                          {theme === "light" ? (
                            <>
                              Dark mode
                              <span className="px-2 py-0.5 rounded-md bg-neu-gre-100 dark:bg-neu-gre-800/50 text-neu-gre-500 dark:text-neu-gre-400 font-semibold truncate">
                                OFF
                              </span>
                            </>
                          ) : (
                            <>
                              Dark mode
                              <span className="px-2 py-0.5 rounded-md bg-sup-sys-100 dark:bg-sup-sys-900/50 text-sup-sys-500 dark:text-sup-sys-400 font-semibold truncate">
                                ON
                              </span>
                            </>
                          )}
                        </span>
                      </button>

                      {/* Language Option */}
                      <button
                        onClick={() => {
                          // Placeholder for language change
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm lg:text-base font-medium text-neu-gre-700 dark:text-neu-gre-100 hover:bg-neu-gre-100 dark:hover:bg-neu-bla-700 hover:text-neu-gre-900 dark:hover:text-neu-gre-50 font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 rounded-md"
                        role="menuitem"
                        aria-label="Toggle language"
                      >
                        <Icon
                          icon="mingcute:translate-2-line"
                          width={16}
                          height={16}
                          aria-label="Change language"
                        />
                        <span className="flex justify-between items-center w-full">
                          Language
                          <span className="px-2 py-0.5 rounded-md bg-neu-gre-100 dark:bg-neu-gre-800/50 text-neu-gre-500 dark:text-neu-gre-400 font-semibold truncate">
                            English
                          </span>
                        </span>
                      </button>

                      {/* Divider */}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                ref={closeButtonRef}
                onClick={onToggle}
                className="lg:hidden p-3 rounded-full bg-sec-pea-500 dark:bg-sec-pea-600 text-neu-bla-800 dark:text-neu-whi-100 shadow-[0_4px_14px_rgba(239,112,155,0.4)] dark:shadow-[0_4px_14px_rgba(239,112,155,0.3)] hover:bg-sec-pea-600 dark:hover:bg-sec-pea-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 transition-all duration-200"
                aria-label="Close navigation menu"
              >
                <Icon
                  icon="mingcute:close-fill"
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
