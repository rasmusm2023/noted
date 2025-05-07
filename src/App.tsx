import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ListProvider } from "./contexts/ListContext";
import { Layout } from "./components/Layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ListPage } from "./pages/ListPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { Next7Days } from "./pages/Next7Days";
import { Habits } from "./pages/Habits";
import { Goals } from "./pages/Goals";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ListProvider>
          <Routes>
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
              <Route path="habits" element={<Habits />} />
              <Route path="goals" element={<Goals />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ListProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
