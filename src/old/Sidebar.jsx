import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ClipboardCheck,
  CalendarDate,
  HeartShine,
  StarsMinimalistic,
  Settings,
  SquareAltArrowLeft,
  SquareAltArrowRight,
} from "solar-icon-set";

function Sidebar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please try logging in.";
      case "auth/weak-password":
        return "Password should be at least 6 characters long.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/configuration-not-found":
        return "Unable to connect to authentication service. Please try again later.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  const menuItems = [
    { id: "today", label: "Today", icon: ClipboardCheck, path: "/today" },
    {
      id: "next7days",
      label: "Next 7 Days",
      icon: CalendarDate,
      path: "/next7days",
    },
    { id: "habits", label: "Habits", icon: HeartShine, path: "/habits" },
    { id: "goals", label: "Goals", icon: StarsMinimalistic, path: "/goals" },
  ];

  return (
    <div
      className={`h-screen bg-pri-blue-500 text-white font-outfit transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-lg">
        <div className="flex items-center justify-between mb-2xl">
          {!isCollapsed && <h2 className="text-xl font-semibold">Menu</h2>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-sm p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            {isCollapsed ? (
              <SquareAltArrowRight className="w-6 h-6" />
            ) : (
              <>
                <SquareAltArrowLeft className="w-6 h-6" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        <nav className="space-y-sm">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-sm p-sm rounded-md transition-colors ${
                  isActive ? "bg-pri-blue-600" : "hover:bg-pri-blue-600/50"
                }`}
              >
                <Icon className="w-6 h-6" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className={`w-full mt-2xl bg-sup-err-500 text-white py-sm px-lg rounded-md hover:bg-sup-err-600 transition-colors ${
            isCollapsed ? "px-sm" : ""
          }`}
        >
          {!isCollapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
