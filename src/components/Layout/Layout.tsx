"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Sidebar } from "../Sidebar";
import { Footer } from "../Footer";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Memoize the Sidebar component to prevent unnecessary re-renders
const MemoizedSidebar = memo(Sidebar);

// Separate component for the main content area to isolate re-renders
function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="flex-1 overflow-auto flex flex-col">
      <div className="flex-1">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Add effect to sync with localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsSidebarOpen(!JSON.parse(savedState));
    }
  }, []);

  // Memoize the sidebar toggle handler to prevent re-renders
  const handleSidebarToggle = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(!newState));
  }, [isSidebarOpen]);

  // Update CSS variable when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isSidebarOpen ? "288px" : "96px"
    );
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen">
      <MemoizedSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <MainContent>{children}</MainContent>
    </div>
  );
}
