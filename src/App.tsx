import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Next7Days } from "./pages/Next7Days";
import { Habits } from "./pages/Habits";
import { Goals } from "./pages/Goals";
import { Settings } from "./pages/Settings";
import { Layout } from "./components/Layout";

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/next7days"
        element={
          <Layout>
            <Next7Days />
          </Layout>
        }
      />
      <Route
        path="/habits"
        element={
          <Layout>
            <Habits />
          </Layout>
        }
      />
      <Route
        path="/goals"
        element={
          <Layout>
            <Goals />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-neu-900">
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
