import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Button/Button";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (!isLogin && newEmail && !validateEmail(newEmail)) {
      setEmailWarning("Please enter a valid email address");
    } else {
      setEmailWarning("");
    }
  };

  const getErrorMessage = (errorCode: string) => {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLogin && !validateEmail(email)) {
      setEmailWarning("Please enter a valid email address");
      return;
    }

    try {
      console.log(
        "Attempting to",
        isLogin ? "login" : "signup",
        "with email:",
        email
      );
      setError("");
      setLoading(true);

      if (isLogin) {
        await login(email, password);
        console.log("Login successful");
        navigate("/");
      } else {
        await signup(email, password);
        console.log("Signup successful");
        navigate("/");
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neu-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-outfit">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h2 className="text-center text-5xl font-bold text-pri-blue-100">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-sup-err-400 text-sup-err-100 p-4 rounded-md text-sm font-semibold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-md font-medium text-neu-300 mb-2"
              >
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-6 py-4 border-2 border-neu-600 placeholder-neu-600 text-neu-200 bg-neu-800 rounded-md hover:border-neu-400 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent text-md"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
              />
              {emailWarning && (
                <div className="mt-2 text-sm text-sup-war-500">
                  {emailWarning}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-md font-medium text-neu-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="appearance-none relative block w-full px-6 py-4 border-2 border-neu-600 placeholder-neu-600 text-neu-200 bg-neu-800 rounded-md hover:border-neu-400 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 focus:border-transparent text-md"
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
              className="w-full py-4 text-lg text-neu-100"
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
              className="w-full text-center text-neu-500 hover:text-pri-blue-500 transition-colors"
            >
              {isLogin
                ? "New here? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
