import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  avatarStyle?: string;
  avatarSeed?: string;
}

const avatarStyles = [
  { id: "adventurer", name: "Adventurer" },
  { id: "avataaars", name: "Avataaars" },
  { id: "bottts", name: "Bottts" },
  { id: "croodles", name: "Croodles" },
  { id: "fun-emoji", name: "Fun Emoji" },
  { id: "lorelei", name: "Lorelei" },
  { id: "micah", name: "Micah" },
  { id: "miniavs", name: "Miniavs" },
  { id: "notionists", name: "Notionists" },
  { id: "open-peeps", name: "Open Peeps" },
  { id: "personas", name: "Personas" },
];

export function Account() {
  const { currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("adventurer");
  const [avatarSeed, setAvatarSeed] = useState<string>("");

  const generateRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
    handleAvatarUpdate(style, avatarSeed);
  };

  const handleRandomize = () => {
    const newSeed = generateRandomSeed();
    setAvatarSeed(newSeed);
    handleAvatarUpdate(selectedStyle, newSeed);
  };

  const handleAvatarUpdate = async (style: string, seed: string) => {
    if (!currentUser) return;

    try {
      const db = getFirestore();
      await updateDoc(doc(db, "users", currentUser.uid), {
        avatarStyle: style,
        avatarSeed: seed,
      });

      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              avatarStyle: style,
              avatarSeed: seed,
            }
          : null
      );
    } catch (err) {
      console.error("Error updating avatar:", err);
      setError("Failed to update avatar");
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data() as UserDetails;
          setUserDetails(data);
          setSelectedStyle(data.avatarStyle || "adventurer");
          setAvatarSeed(data.avatarSeed || currentUser.uid);
        } else {
          setError("User details not found");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-900 p-8 font-outfit">
        <div className="max-w-2xl mx-auto">
          <div className="text-neu-400">Loading account details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neu-900 p-8 font-outfit">
        <div className="max-w-2xl mx-auto">
          <div className="bg-sup-err-400 text-sup-err-100 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neu-900 p-8 font-outfit">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-pri-blue-100 mb-8">
          Account Details
        </h1>

        <div className="bg-neu-800 rounded-lg p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <img
                src={`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${avatarSeed}`}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-full"
              />
              <button
                onClick={handleRandomize}
                className="px-4 py-2 bg-neu-700 text-neu-100 rounded-lg hover:bg-neu-600 transition-colors"
              >
                Randomize Avatar
              </button>
            </div>

            <div className="w-full">
              <h3 className="text-lg font-medium text-neu-100 mb-4">
                Choose Avatar Style
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {avatarStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      selectedStyle === style.id
                        ? "bg-pri-blue-500 ring-2 ring-pri-blue-400"
                        : "bg-neu-700 hover:bg-neu-600"
                    }`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/${style.id}/svg?seed=${avatarSeed}`}
                      alt={style.name}
                      className="w-12 h-12 rounded-full mb-1"
                    />
                    <span className="text-xs text-neu-100">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-neu-700 pt-6">
            <div>
              <h2 className="text-sm font-medium text-neu-400 mb-2">Email</h2>
              <p className="text-lg text-neu-100">{userDetails?.email}</p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-neu-400 mb-2">
                First Name
              </h2>
              <p className="text-lg text-neu-100">{userDetails?.firstName}</p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-neu-400 mb-2">
                Last Name
              </h2>
              <p className="text-lg text-neu-100">{userDetails?.lastName}</p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-neu-400 mb-2">
                Account Created
              </h2>
              <p className="text-lg text-neu-100">
                {userDetails?.createdAt
                  ? new Date(userDetails.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
