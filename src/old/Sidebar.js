import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

function Sidebar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const getErrorMessage = (errorCode) => {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  };

  if (isLoggedIn) {
    return (
      <div className="w-64 h-screen bg-pri-blue-500 text-white p-lg font-outfit">
        <h2 className="text-xl font-semibold mb-2xl">Menu</h2>
        <nav className="space-y-sm">
          <a
            href="#"
            className="block p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="block p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            Calendar
          </a>
          <a
            href="#"
            className="block p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            Tasks
          </a>
          <a
            href="#"
            className="block p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            Habits
          </a>
          <a
            href="#"
            className="block p-sm hover:bg-pri-blue-600 rounded-md transition-colors"
          >
            Settings
          </a>
          <button
            onClick={handleLogout}
            className="w-full mt-2xl bg-sup-err-500 text-white py-sm px-lg rounded-md hover:bg-sup-err-600 transition-colors"
          >
            Logout
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-pri-blue-500 text-white p-lg font-outfit">
      <h2 className="text-xl font-semibold mb-2xl">
        {isLoginForm ? "Login" : "Sign Up"}
      </h2>
      {error && (
        <div className="mb-sm p-sm bg-sup-err-500 text-white rounded-md text-sm">
          {error}
        </div>
      )}
      <form
        onSubmit={isLoginForm ? handleLogin : handleSignUp}
        className="space-y-lg"
      >
        <div>
          <label className="block mb-xs">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-sm bg-pri-blue-600 rounded-md text-white"
            required
          />
        </div>
        <div>
          <label className="block mb-xs">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-sm bg-pri-blue-600 rounded-md text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-pri-blue-600 text-white py-sm px-lg rounded-md hover:bg-pri-blue-700 transition-colors"
        >
          {isLoginForm ? "Login" : "Sign Up"}
        </button>
      </form>
      <button
        onClick={() => setIsLoginForm(!isLoginForm)}
        className="w-full mt-sm text-white hover:text-neu-200 transition-colors"
      >
        {isLoginForm
          ? "Need an account? Sign Up"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}

export default Sidebar;
