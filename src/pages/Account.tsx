import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

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
  const { currentUser, deleteUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Add refs for focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const resetModalRef = useRef<HTMLDivElement>(null);
  const resetFirstFocusableRef = useRef<HTMLButtonElement>(null);
  const resetLastFocusableRef = useRef<HTMLButtonElement>(null);

  // Add focus trap effect
  useEffect(() => {
    if (showDeleteModal || showResetModal) {
      // Store the element that had focus before the modal opened
      const previousActiveElement = document.activeElement as HTMLElement;
      const isResetModal = showResetModal;

      // Focus the first focusable element in the modal
      if (isResetModal) {
        resetFirstFocusableRef.current?.focus();
      } else {
        firstFocusableRef.current?.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            // If shift + tab and on first element, move to last element
            if (isResetModal) {
              if (document.activeElement === resetFirstFocusableRef.current) {
                e.preventDefault();
                resetLastFocusableRef.current?.focus();
              }
            } else {
              if (document.activeElement === firstFocusableRef.current) {
                e.preventDefault();
                lastFocusableRef.current?.focus();
              }
            }
          } else {
            // If tab and on last element, move to first element
            if (isResetModal) {
              if (document.activeElement === resetLastFocusableRef.current) {
                e.preventDefault();
                resetFirstFocusableRef.current?.focus();
              }
            } else {
              if (document.activeElement === lastFocusableRef.current) {
                e.preventDefault();
                firstFocusableRef.current?.focus();
              }
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Restore focus when modal closes
        previousActiveElement?.focus();
      };
    }
  }, [showDeleteModal, showResetModal]);

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

  const handleResetPassword = async () => {
    if (!currentUser?.email) {
      toast.error("No email address found for your account");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setShowResetModal(false);
      setShowResetConfirmation(true);
    } catch (error: any) {
      console.error("Error sending password reset:", error);

      // Handle specific Firebase error codes
      switch (error.code) {
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address.");
          break;
        case "auth/user-not-found":
          toast.error("No account found with this email address.");
          break;
        default:
          toast.error("Failed to send password reset email. Please try again.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);
      await deleteUser();
      toast.success("Account deleted successfully");
      // The user will be automatically redirected to login page by PrivateRoute
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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
      <PageTransition>
        <div className="min-h-screen bg-neu-whi-100 p-8 font-inter">
          <div className="max-w-2xl mx-auto">
            <div className="text-neu-gre-600 animate-pulse">
              Loading account details...
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-neu-whi-100 p-8 font-inter">
          <div className="max-w-2xl mx-auto">
            <div className="bg-sup-err-100 text-sup-err-500 p-4 rounded-lg">
              {error}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 mt-16">
        <div className="max-w-[1920px] mx-auto space-y-8 px-16 pb-[1000px]">
          <div className="flex items-center space-x-3">
            <Icon
              icon="mingcute:user-3-fill"
              className="text-pri-pur-500 w-8 h-8"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-neu-gre-800">
              Account Details
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-neu-whi-100 rounded-5xl p-24 space-y-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-neu-gre-300/50"
            role="region"
            aria-label="Account Information"
          >
            <div className="grid grid-cols-2 gap-16">
              {/* Right Column - Account Information */}
              <div
                className="space-y-6"
                role="region"
                aria-label="Personal Information"
              >
                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600"
                    id="email-label"
                  >
                    Email
                  </h2>
                  <p
                    className="text-lg text-neu-gre-800 bg-neu-gre-100 px-4 py-2 rounded-lg border-2 border-neu-gre-200 w-full"
                    aria-labelledby="email-label"
                  >
                    {userDetails?.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h2
                      className="text-sm font-medium text-neu-gre-600"
                      id="first-name-label"
                    >
                      First Name
                    </h2>
                    <p
                      className="text-lg text-neu-gre-800 bg-neu-gre-100 px-4 py-2 rounded-lg border-2 border-neu-gre-200 w-full"
                      aria-labelledby="first-name-label"
                    >
                      {userDetails?.firstName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2
                      className="text-sm font-medium text-neu-gre-600"
                      id="last-name-label"
                    >
                      Last Name
                    </h2>
                    <p
                      className="text-lg text-neu-gre-800 bg-neu-gre-100 px-4 py-2 rounded-lg border-2 border-neu-gre-200 w-full"
                      aria-labelledby="last-name-label"
                    >
                      {userDetails?.lastName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600"
                    id="password-label"
                  >
                    Password
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="password"
                        value="••••••••"
                        readOnly
                        disabled
                        className="w-full px-4 py-2 bg-neu-gre-100 rounded-lg text-neu-gre-800 border-2 border-neu-gre-200 cursor-not-allowed opacity-75"
                        aria-labelledby="password-label"
                        aria-disabled="true"
                      />
                    </div>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="px-4 py-2 text-neu-gre-600 font-inter font-medium hover:text-pri-pur-500 hover:ring-pri-pur-300 ring-2 ring-neu-gre-400 rounded-md transition-all whitespace-nowrap duration-200 focus:outline-none focus:ring-2 focus:ring-pri-focus-500"
                      aria-label="Reset password"
                    >
                      Reset password
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600"
                    id="account-created-label"
                  >
                    Account Created
                  </h2>
                  <p
                    className="text-lg text-neu-gre-800 bg-neu-gre-100 px-4 py-2 rounded-lg border-2 border-neu-gre-200 w-full"
                    aria-labelledby="account-created-label"
                  >
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

                <div className="pt-8 border-t border-neu-gre-200">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="py-4 px-4 text-sm font-inter font-medium text-sup-err-500 hover:text-neu-whi-100 hover:bg-sup-err-500 rounded-md transition-all flex items-center space-x-2 duration-200 focus:outline-none focus:ring-2 focus:ring-pri-focus-500"
                    aria-label="Delete account"
                  >
                    <Icon
                      icon="mingcute:delete-2-fill"
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>

              {/* Left Column - Avatar Section */}
              <div
                className="flex flex-col items-center space-y-6"
                role="region"
                aria-label="Profile Avatar"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <img
                    src={avatars.find((a) => a.id === selectedAvatar)?.src}
                    alt="Current profile avatar"
                    className="w-32 h-32 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  />
                  <div
                    className="absolute -bottom-2 -right-2 bg-pri-pur-500 text-neu-whi-100 p-2 rounded-md shadow-lg"
                    role="presentation"
                  >
                    <Icon
                      icon="mingcute:pencil-fill"
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  </div>
                </motion.div>

                <div className="w-full">
                  <h3
                    className="text-lg font-medium text-neu-gre-800 mb-4"
                    id="avatar-selection-label"
                  >
                    Choose avatar
                  </h3>
                  <div
                    className="grid grid-cols-8 gap-2"
                    role="radiogroup"
                    aria-labelledby="avatar-selection-label"
                  >
                    {avatars.map((avatar) => (
                      <motion.button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-1 rounded-md transition-all focus:outline-none focus:ring-4 focus:ring-pri-focus-500 ${
                          selectedAvatar === avatar.id
                            ? "bg-pri-pur-500 ring-2 ring-pri-pur-400 shadow-lg"
                            : "bg-neu-gre-200 hover:bg-neu-gre-300"
                        }`}
                        role="radio"
                        aria-checked={selectedAvatar === avatar.id}
                        aria-label={`Select avatar option ${avatar.id}`}
                      >
                        <img
                          src={avatar.src}
                          alt=""
                          className="w-full h-auto rounded-sm"
                          aria-hidden="true"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delete Account Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                aria-describedby="delete-account-description"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowDeleteModal(false);
                  }
                }}
              >
                <motion.div
                  ref={modalRef}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-neu-whi-100 rounded-lg p-6 max-w-md w-full mx-4"
                  role="document"
                >
                  <h3
                    id="delete-account-title"
                    className="text-xl font-semibold mb-4 flex items-center gap-2 text-neu-gre-800"
                  >
                    <Icon
                      icon="mingcute:alert-fill"
                      className="w-6 h-6"
                      aria-hidden="true"
                    />
                    Delete Account
                  </h3>
                  <p
                    id="delete-account-description"
                    className="text-neu-gra-600 mb-6"
                  >
                    Are you sure you want to delete your account? This action
                    cannot be undone and all your data will be permanently
                    deleted.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      ref={firstFocusableRef}
                      onClick={() => setShowDeleteModal(false)}
                      className="px-8 py-4 text-base font-inter font-medium bg-neu-gre-300 rounded-md text-neu-gra-800 hover:text-neu-gra-800 hover:bg-pri-pur-200 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
                      disabled={isDeleting}
                      aria-label="Cancel account deletion"
                    >
                      Cancel
                    </button>
                    <button
                      ref={lastFocusableRef}
                      onClick={handleDeleteAccount}
                      className="px-4 py-4 text-sm font-inter font-medium bg-sup-err-500 text-neu-whi-100 rounded-md hover:bg-sup-err-700 transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
                      disabled={isDeleting}
                      aria-label="Confirm account deletion"
                    >
                      <Icon
                        icon="mingcute:delete-2-fill"
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Reset Confirmation Modal */}
          <AnimatePresence>
            {showResetConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-confirmation-title"
                aria-describedby="reset-confirmation-description"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowResetConfirmation(false);
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-neu-whi-100 rounded-lg p-6 max-w-md w-full mx-4 text-center"
                  role="document"
                >
                  <div className="mb-4" role="presentation">
                    <Icon
                      icon="mingcute:mail-send-fill"
                      className="w-12 h-12 text-pri-pur-500 mx-auto"
                      aria-hidden="true"
                    />
                  </div>
                  <h3
                    id="reset-confirmation-title"
                    className="text-xl font-semibold mb-2"
                  >
                    Check Your Email
                  </h3>
                  <p
                    id="reset-confirmation-description"
                    className="text-neu-gre-600 mb-4"
                  >
                    We've sent a password reset link to your email address.
                    Please check your inbox and follow the instructions to reset
                    your password.
                  </p>
                  <button
                    onClick={() => setShowResetConfirmation(false)}
                    className="px-4 py-2 bg-pri-pur-500 text-white rounded hover:bg-pri-pur-600 transition-colors focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
                    aria-label="Close password reset confirmation"
                  >
                    Got it
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Reset Modal */}
          <AnimatePresence>
            {showResetModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-password-title"
                aria-describedby="reset-password-description"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowResetModal(false);
                  }
                }}
              >
                <motion.div
                  ref={resetModalRef}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-neu-whi-100 rounded-lg p-6 max-w-md w-full mx-4"
                  role="document"
                >
                  <h3
                    id="reset-password-title"
                    className="text-xl font-semibold mb-4 flex items-center gap-2 text-neu-gre-800"
                  >
                    <Icon
                      icon="mingcute:key-2-fill"
                      className="w-6 h-6"
                      aria-hidden="true"
                    />
                    Reset Password
                  </h3>
                  <p
                    id="reset-password-description"
                    className="text-neu-gre-600 mb-6"
                  >
                    We'll send a password reset link to your email address (
                    {currentUser?.email}). You'll need to click the link in the
                    email to reset your password.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      ref={resetFirstFocusableRef}
                      onClick={() => setShowResetModal(false)}
                      className="px-8 py-4 text-base font-inter font-medium bg-neu-gre-300 rounded-md text-neu-gre-800 hover:text-neu-gre-800 hover:bg-neu-gre-500 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
                      aria-label="Cancel password reset"
                    >
                      Cancel
                    </button>
                    <button
                      ref={resetLastFocusableRef}
                      onClick={handleResetPassword}
                      className="px-4 py-4 text-base font-inter font-medium bg-pri-pur-500 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 transition-colors flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
                      aria-label="Send password reset link"
                    >
                      <Icon
                        icon="mingcute:mail-send-fill"
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                      Send Reset Link
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
