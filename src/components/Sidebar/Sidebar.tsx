import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  CalendarDate,
  HeartShine,
  StarsMinimalistic,
  Settings,
  SquareAltArrowLeft,
  SquareAltArrowRight,
} from "solar-icon-set";

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
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
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
        <nav className="flex-1 p-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {isOpen && (
                <h2 className="px-3 text-md font-bold text-neu-500 uppercase">
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
