import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
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
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  deleteUser: () => Promise<void>;
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if this user needs timezone update
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userDoc.exists() && !userData?.timezone) {
          const timezone = getCETTimeZone();
          await setDoc(
            doc(db, "users", user.uid),
            {
              timezone: timezone,
            },
            { merge: true }
          );
        }
      }
      setCurrentUser(user);
      setLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Wait for the auth state to be updated
      await new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      });

      return userCredential;
    } catch (error: any) {
      setLoading(false);
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get the appropriate timezone
      const timezone = getCETTimeZone();

      // Initialize Firestore and store user profile data
      const db = getFirestore();
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date().toISOString(),
        timezone: timezone,
      });

      return userCredential;
    } catch (error: any) {
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw error;
    }
  }

  async function deleteUser() {
    try {
      if (!currentUser) return;

      // Delete user data from Firestore
      const db = getFirestore();
      await deleteDoc(doc(db, "users", currentUser.uid));

      // Delete the user account
      await currentUser.delete();
    } catch (error: any) {
      throw error;
    }
  }

  async function loginWithGoogle(): Promise<UserCredential> {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Request additional scopes for profile picture
      provider.addScope("profile");
      const userCredential = await signInWithPopup(auth, provider);

      // Check if this is a new user
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        // If it's a new user, create their profile
        const displayName = userCredential.user.displayName || "";
        const [firstName = "", lastName = ""] = displayName.split(" ");
        const photoURL = userCredential.user.photoURL || null;

        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          firstName: firstName,
          lastName: lastName,
          createdAt: new Date().toISOString(),
          timezone: getCETTimeZone(),
          photoURL: photoURL,
          authProvider: "google",
        });
      } else {
        // Update existing user's photo URL if they're using Google auth
        const userData = userDoc.data();
        if (
          userData?.authProvider === "google" &&
          userCredential.user.photoURL
        ) {
          await setDoc(
            doc(db, "users", userCredential.user.uid),
            {
              photoURL: userCredential.user.photoURL,
            },
            { merge: true }
          );
        }
      }

      return userCredential;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  }

  const value = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    logout,
    deleteUser,
    loading: loading || !isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
