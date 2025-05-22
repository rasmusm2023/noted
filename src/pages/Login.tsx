import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Buttons/Button";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      setError("Please enter both first and last name");
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
        const userCredential = await login(email, password);
        console.log("Login successful");
        // Wait a brief moment to ensure auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate("/", { replace: true });
      } else {
        const userCredential = await signup(
          email,
          password,
          firstName.trim(),
          lastName.trim()
        );
        console.log("Signup successful");
        // Wait a brief moment to ensure auth state is updated
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-rose-peach bg-[length:200%_200%] animate-gradientMove flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div
        className={`w-full max-w-lg space-y-8 animate-fadeIn backdrop-blur-md rounded-5xl p-8 transition-all duration-500 ${
          isLogin
            ? "bg-neu-whi-100/50 shadow-xl border-2 border-neu-whi-100/25"
            : "bg-neu-bla-900/75 shadow-xl border-2 border-neu-bla-100/25"
        }`}
      >
        <div>
          <h2
            className={`text-center text-4xl font-bold font-inter animate-fadeIn ${
              isLogin ? "text-neu-gre-800" : "text-neu-whi-100"
            }`}
          >
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>
        <form
          className="mt-8 space-y-6 font-inter animate-fadeIn"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-sup-err-400 text-sup-err-100 p-4 rounded-md text-sm font-semibold font-inter animate-fadeIn">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label
                    htmlFor="first-name"
                    className={`block text-sm font-medium mb-2 font-inter ${
                      isLogin ? "text-neu-gre-900" : "text-neu-whi-100"
                    }`}
                  >
                    First Name
                  </label>
                  <input
                    id="first-name"
                    name="firstName"
                    type="text"
                    required
                    className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                      isLogin
                        ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                        : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                    }`}
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last-name"
                    className={`block text-sm font-medium mb-2 font-inter ${
                      isLogin ? "text-neu-gre-900" : "text-neu-whi-100"
                    }`}
                  >
                    Last Name
                  </label>
                  <input
                    id="last-name"
                    name="lastName"
                    type="text"
                    required
                    className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                      isLogin
                        ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                        : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                    }`}
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="animate-fadeIn">
              <label
                htmlFor="email-address"
                className={`block text-sm font-medium mb-2 font-inter ${
                  isLogin ? "text-neu-gre-900" : "text-neu-whi-100"
                }`}
              >
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                  isLogin
                    ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                    : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
              />
              {emailWarning && (
                <div className="mt-2 text-sm text-sup-war-500 font-inter animate-fadeIn">
                  {emailWarning}
                </div>
              )}
            </div>
            <div className="animate-fadeIn">
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 font-inter ${
                  isLogin ? "text-neu-gre-900" : "text-neu-whi-100"
                }`}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-2 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                  isLogin
                    ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                    : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                }`}
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
              className="w-full py-4 text-md text-neu-whi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 font-inter transition-all duration-300 ease-in-out hover:scale-[1.02]"
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
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setEmailWarning("");
              }}
              className={`w-full text-center transition-all duration-300 ease-in-out font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 rounded-md p-2 hover:scale-[1.02] ${
                isLogin
                  ? "text-neu-gre-900 hover:text-neu-gre-800"
                  : "text-neu-whi-100 hover:text-neu-whi-200"
              }`}
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
