import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        console.log("Current user details:", {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
          lastSignInTime: user.metadata.lastSignInTime,
        });
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      console.log("Attempting login for:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful for:", userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      throw error;
    }
  }

  async function signup(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      console.log("Attempting signup for:", email);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Signup successful for:", userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      console.log("Attempting logout");
      await signOut(auth);
      console.log("Logout successful");
    } catch (error: any) {
      console.error("Logout error:", error.code, error.message);
      throw error;
    }
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
