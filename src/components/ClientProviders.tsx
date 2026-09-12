"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { DndProvider } from "react-dnd";
import type { BackendFactory } from "dnd-core";
import { AuthProvider } from "../contexts/AuthContext";
import { ListProvider } from "../contexts/ListContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { MidnightTaskMover } from "./MidnightTaskMover";
import { LoadingScreen } from "./LoadingScreen";
import { useAppTitle } from "../hooks/usePageTitle";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dndBackend, setDndBackend] = useState<BackendFactory | null>(null);

  useEffect(() => {
    setMounted(true);
    import("react-dnd-html5-backend").then((mod) => {
      setDndBackend(() => mod.HTML5Backend);
    });
  }, []);

  if (!mounted || !dndBackend) {
    if (pathname === "/login") {
      return null;
    }
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <ListProvider>
        <ThemeProvider>
          <DndProvider backend={dndBackend}>
            <MidnightTaskMover />
            <AppShell>{children}</AppShell>
          </DndProvider>
        </ThemeProvider>
      </ListProvider>
    </AuthProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  useAppTitle("Noted – Track and manage your tasks in one place");
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [minimumLoadingTime, setMinimumLoadingTime] = useState(true);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadingTimerRef.current = setTimeout(() => {
      setMinimumLoadingTime(false);
    }, 500);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!minimumLoadingTime) {
      setIsLoading(false);
    }
  }, [minimumLoadingTime]);

  const shouldShowLoading =
    isLoading && minimumLoadingTime && pathname !== "/login";

  return (
    <>
      <AnimatePresence mode="wait">
        {shouldShowLoading && <LoadingScreen />}
      </AnimatePresence>
      {(!isLoading || !minimumLoadingTime || pathname === "/login") &&
        children}
    </>
  );
}
