import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// Import custom avatars
import avatar1 from "../assets/profile-avatars/PFP_option1.png";
import avatar2 from "../assets/profile-avatars/PFP_option2.png";
import avatar3 from "../assets/profile-avatars/PFP_option3.png";
import avatar4 from "../assets/profile-avatars/PFP_option4.png";

interface UserDetails {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  selectedAvatar?: number;
}

const avatars = [
  { id: 1, src: avatar1 },
  { id: 2, src: avatar2 },
  { id: 3, src: avatar3 },
  { id: 4, src: avatar4 },
];

export function Account() {
  const { currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);

  const handleAvatarSelect = async (avatarId: number) => {
    if (!currentUser) return;

    try {
      const db = getFirestore();
      await updateDoc(doc(db, "users", currentUser.uid), {
        selectedAvatar: avatarId,
      });

      setSelectedAvatar(avatarId);
      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              selectedAvatar: avatarId,
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
          setSelectedAvatar(data.selectedAvatar || 1);
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
                src={avatars.find((a) => a.id === selectedAvatar)?.src}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-lg"
              />
            </div>

            <div className="w-full">
              <h3 className="text-lg font-medium text-neu-100 mb-4">
                Choose Avatar
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      selectedAvatar === avatar.id
                        ? "bg-pri-blue-500 ring-2 ring-pri-blue-400"
                        : "bg-neu-700 hover:bg-neu-600"
                    }`}
                  >
                    <img
                      src={avatar.src}
                      alt={`Avatar option ${avatar.id}`}
                      className="w-16 h-16 rounded-lg"
                    />
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
