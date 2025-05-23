import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Buttons/Button";
import { useNavigate, useLocation } from "react-router-dom";

export function LoginCentered() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, currentUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const isNavigating = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      console.log("Login - User already logged in, redirecting to dashboard");
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  // Prevent form reset during navigation
  useEffect(() => {
    return () => {
      if (!isNavigating.current) {
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
      }
    };
  }, []);

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
      setError("");
      setLoading(true);

      if (isLogin) {
        const userCredential = await login(email, password);
        isNavigating.current = true;
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        const userCredential = await signup(
          email,
          password,
          firstName.trim(),
          lastName.trim()
        );
        isNavigating.current = true;
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      isNavigating.current = true;
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-purple-rose-peach bg-[length:200%_200%] animate-gradientMove flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter"
      role="main"
      aria-label="Authentication page"
    >
      <div
        className={`w-full max-w-3xl space-y-8 animate-fadeIn backdrop-blur-md rounded-5xl px-32 py-24 transition-all duration-500 ${
          isLogin
            ? "bg-neu-whi-100/50 shadow-xl border-2 border-neu-whi-100/25"
            : "bg-neu-bla-900/75 shadow-xl border-2 border-neu-bla-100/25"
        }`}
      >
        <div>
          <h2
            className={`text-center text-4xl font-bold font-inter animate-fadeIn transition-all duration-500 ${
              isLogin ? "text-neu-gre-800" : "text-neu-whi-100"
            }`}
          >
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
        </div>
        <form
          ref={formRef}
          className="mt-8 space-y-6 font-inter animate-fadeIn transition-all duration-500"
          onSubmit={handleSubmit}
          aria-label={isLogin ? "Sign in form" : "Sign up form"}
        >
          {error && (
            <div
              className="bg-sup-err-400 text-sup-err-100 p-4 rounded-md text-sm font-semibold font-inter animate-fadeIn"
              role="alert"
              aria-live="polite"
            >
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
                    className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-4 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                      isLogin
                        ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                        : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                    }`}
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    aria-label="First name"
                    aria-required="true"
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
                    className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-4 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                      isLogin
                        ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                        : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                    }`}
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    aria-label="Last name"
                    aria-required="true"
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
                className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-4 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                  isLogin
                    ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                    : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                aria-label="Email address"
                aria-required="true"
                aria-invalid={!!emailWarning}
                aria-describedby={emailWarning ? "email-warning" : undefined}
              />
              {emailWarning && (
                <div
                  id="email-warning"
                  className="mt-2 text-sm text-sup-war-500 font-inter animate-fadeIn"
                  role="alert"
                >
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
                className={`appearance-none relative block w-full px-6 py-4 border-2 placeholder-neu-gre-500 rounded-md focus:outline-none focus:ring-4 focus:ring-pri-focus-500 focus:border-transparent text-md transition-all duration-300 ease-in-out font-inter ${
                  isLogin
                    ? "text-sm border-neu-whi-300 text-neu-gre-900 bg-neu-whi-100 hover:border-neu-whi-400"
                    : "text-sm border-neu-bla-600 text-neu-whi-100 bg-neu-bla-800 hover:border-neu-bla-400"
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-md text-neu-whi-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 font-inter transition-all duration-300 ease-in-out"
              disabled={loading}
              aria-label={
                loading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                  ? "Sign in"
                  : "Sign up"
              }
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                ? "Sign in"
                : "Sign up"}
            </Button>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-neu-whi-100"></div>
              <span
                className={`text-sm ${
                  isLogin ? "text-neu-gre-800" : "text-neu-whi-200"
                }`}
              >
                Or continue with
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-neu-whi-100"></div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 text-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 font-inter transition-all duration-300 ease-in-out flex items-center justify-center gap-2 bg-white hover:bg-neu-whi-200"
              aria-label="Sign in with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-neu-gre-900">Sign in with Google</span>
            </Button>

            <div className="pt-8">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setEmailWarning("");
                }}
                className={`w-full text-center font-medium transition-all duration-300 ease-in-out font-inter focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 rounded-md p-2 hover:scale-[1.02] ${
                  isLogin
                    ? "text-neu-gre-900 hover:text-neu-gre-800"
                    : "text-neu-whi-100 hover:text-neu-whi-200"
                }`}
                aria-label={
                  isLogin ? "Switch to sign up form" : "Switch to sign in form"
                }
              >
                {isLogin
                  ? "New here? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
