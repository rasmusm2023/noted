import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<UserCredential>;
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

// Helper function to determine if we're in CET or CEST
function getCETTimeZone(): string {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const standardOffset = -60; // CET is UTC+1
  const summerOffset = -120; // CEST is UTC+2

  const currentOffset = now.getTimezoneOffset();
  const isSummer = currentOffset === summerOffset;

  return isSummer ? "CEST" : "CET";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if this user needs timezone update
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        console.log("=== User Authentication Status ===");
        console.log(`User logged in: ${user.email}`);
        console.log(`User ID: ${user.uid}`);
        console.log(`Current timezone: ${userData?.timezone || "Not set"}`);

        if (userDoc.exists() && !userData?.timezone) {
          const timezone = getCETTimeZone();
          console.log(`Setting timezone for user ${user.email} to ${timezone}`);
          await setDoc(
            doc(db, "users", user.uid),
            {
              timezone: timezone,
            },
            { merge: true }
          );
          console.log("Timezone updated successfully");
        }
      } else {
        console.log("=== User Authentication Status ===");
        console.log("No user logged in");
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      console.log(`Attempting login for user: ${email}`);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful");
      return userCredential;
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      throw error;
    }
  }

  async function signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<UserCredential> {
    try {
      console.log(`Creating new account for: ${email}`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get the appropriate timezone
      const timezone = getCETTimeZone();
      console.log(
        `Setting default timezone for new user ${email} to ${timezone}`
      );

      // Initialize Firestore and store user profile data
      const db = getFirestore();
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date().toISOString(),
        timezone: timezone,
      });
      console.log("User profile created successfully");

      return userCredential;
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      if (currentUser) {
        console.log(`Logging out user: ${currentUser.email}`);
      }
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
