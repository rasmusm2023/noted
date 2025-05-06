import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-neu-900">
      <nav className="bg-neu-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-neu-100 text-xl font-bold">Noted</h1>
          <button
            onClick={logout}
            className="text-neu-100 hover:text-pri-blue-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        <div className="bg-neu-200 rounded-lg p-6">
          <h2 className="text-neu-100 text-2xl mb-4">
            Welcome, {currentUser.email}
          </h2>
          {/* Add your main content here */}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-neu-900">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

export default App;
