import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const morningGreetings = [
  "Good morning,",
  "Rise and shine,",
  "Morning,",
  "Hello, early bird,",
  "Top of the morning,",
];

const afternoonGreetings = [
  "Good afternoon,",
  "Afternoon,",
  "Hello there,",
  "Hey there,",
  "Hi there,",
];

const eveningGreetings = ["Good evening,", "Evening,", "Hello,", "Hey,", "Hi,"];

const firstTimeGreetings = [
  "Welcome,",
  "Hello,",
  "Hi there,",
  "Glad to have you onboard,",
];

interface GreetingProps {
  className?: string;
}

export function Greeting({ className = "" }: GreetingProps) {
  const { currentUser } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [greeting] = useState(() => {
    if (isFirstLogin) {
      return firstTimeGreetings[
        Math.floor(Math.random() * firstTimeGreetings.length)
      ];
    }

    const hour = new Date().getHours();
    let greetings;

    if (hour >= 5 && hour < 12) {
      greetings = morningGreetings;
    } else if (hour >= 12 && hour < 17) {
      greetings = afternoonGreetings;
    } else {
      greetings = eveningGreetings;
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || "");

          // Check if this is the first login by comparing creation time with last login time
          const creationTime = new Date(data.createdAt).getTime();
          const lastLoginTime = new Date(
            currentUser.metadata.lastSignInTime || ""
          ).getTime();
          setIsFirstLogin(Math.abs(lastLoginTime - creationTime) < 60000); // Within 1 minute
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  if (!currentUser || !firstName) return null;

  return (
    <div
      className={`text-lg font-semibold font-outfit text-neu-bla-500 ${className}`}
    >
      <span>{greeting} </span>
      <span>{firstName}</span>
    </div>
  );
}
