import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Button";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(
        isLogin
          ? "Failed to sign in, incorrect email or password"
          : "Failed to create an account"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neu-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-outfit">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h2 className="text-center text-5xl font-bold text-pri-blue-100">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-sup-err-100 text-sup-err-500 p-4 rounded-md text-sm font-semibold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-md font-medium text-neu-800 mb-2"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-6 py-4 border-2 border-neu-300 placeholder-neu-500 text-neu-900 bg-neu-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent text-lg"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-md font-medium text-neu-800 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="appearance-none relative block w-full px-6 py-4 border-2 border-neu-300 placeholder-neu-500 text-neu-900 bg-neu-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent text-lg"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-lg"
              disabled={loading}
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                ? "Sign in"
                : "Sign up"}
            </Button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-neu-600 hover:text-pri-blue-500 transition-colors"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
