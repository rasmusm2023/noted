import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AuthProvider } from "./contexts/AuthContext";
import { ListProvider } from "./contexts/ListContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ListPage } from "./pages/ListPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { Next7Days } from "./pages/Next7Days";
import { Goals } from "./pages/Goals";
import { Settings } from "./pages/Settings";
import { Account } from "./pages/Account";
import { MidnightTaskMover } from "./components/MidnightTaskMover";
import { LoadingScreen } from "./components/LoadingScreen";
import { useAppTitle } from "./hooks/usePageTitle";

function AnimatedRoutes() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [minimumLoadingTime, setMinimumLoadingTime] = useState(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start loading timer
    loadingTimerRef.current = setTimeout(() => {
      setMinimumLoadingTime(false);
    }, 500);

    // Cleanup
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Set loading to false when minimum time is up
    if (!minimumLoadingTime) {
      setIsLoading(false);
    }
  }, [minimumLoadingTime]);

  // Skip loading screen for login page
  const shouldShowLoading =
    isLoading && minimumLoadingTime && location.pathname !== "/login";

  return (
    <>
      <AnimatePresence mode="wait">
        {shouldShowLoading && <LoadingScreen />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {(!isLoading ||
          !minimumLoadingTime ||
          location.pathname === "/login" ||
          location.pathname === "/login-centered") && (
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="list/:listId" element={<ListPage />} />
              <Route path="next7days" element={<Next7Days />} />
              <Route path="goals" element={<Goals />} />
              <Route path="settings" element={<Settings />} />
              <Route path="account" element={<Account />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  useAppTitle("Noted – Track and manage your tasks in one place");

  return (
    <Router>
      <AuthProvider>
        <ListProvider>
          <ThemeProvider>
            <DndProvider backend={HTML5Backend}>
              <MidnightTaskMover />
              <AnimatedRoutes />
            </DndProvider>
          </ThemeProvider>
        </ListProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
