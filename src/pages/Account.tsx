import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";

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
  photoURL?: string | null;
  authProvider?: string;
  useGooglePhoto?: boolean;
  customProfileImage?: string | null;
}

const avatars = [
  { id: 1, src: avatar1 },
  { id: 2, src: avatar2 },
  { id: 3, src: avatar3 },
  { id: 4, src: avatar4 },
];

export function Account() {
  const { currentUser, deleteUser, logout } = useAuth();
  const navigate = useNavigate();
  usePageTitle("Account");

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add refs for focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const resetModalRef = useRef<HTMLDivElement>(null);
  const resetFirstFocusableRef = useRef<HTMLButtonElement>(null);
  const resetLastFocusableRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const MAX_DIMENSION = 2048; // Max width/height in pixels

  const validateImageFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }

    return null;
  };

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          resolve(
            `Image dimensions must be less than ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`
          );
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve("Invalid image file");
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Validate dimensions
      const dimensionError = await validateImageDimensions(file);
      if (dimensionError) {
        setUploadError(dimensionError);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCustomImage(previewUrl);

      // Convert to base64 for storage (in a real app, you'd upload to a cloud storage service)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        if (!currentUser) return;

        try {
          const db = getFirestore();
          await updateDoc(doc(db, "users", currentUser.uid), {
            customProfileImage: base64String,
            selectedAvatar: -1, // Custom image
            useGooglePhoto: false,
          });

          setSelectedAvatar(-1);
          setUserDetails((prev) =>
            prev
              ? {
                  ...prev,
                  customProfileImage: base64String,
                  selectedAvatar: -1,
                  useGooglePhoto: false,
                }
              : null
          );

          toast.success("Profile picture updated successfully!");
        } catch (err) {
          console.error("Error updating profile picture:", err);
          setUploadError("Failed to update profile picture");
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing file:", err);
      setUploadError("Failed to process image");
      setIsUploading(false);
    }
  };

  const handleDeleteCustomImage = async () => {
    if (!currentUser) return;

    try {
      const db = getFirestore();

      // Determine which avatar to revert to
      const revertToGoogle = Boolean(
        userDetails?.photoURL && userDetails?.authProvider === "google.com"
      );

      const updateData: any = {
        customProfileImage: null,
        selectedAvatar: revertToGoogle ? 0 : 1,
        useGooglePhoto: revertToGoogle,
      };

      // Only include fields that have valid values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(doc(db, "users", currentUser.uid), updateData);

      setSelectedAvatar(revertToGoogle ? 0 : 1);
      setCustomImage(null);
      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              customProfileImage: null,
              selectedAvatar: revertToGoogle ? 0 : 1,
              useGooglePhoto: revertToGoogle,
            }
          : null
      );

      toast.success("Custom image deleted successfully!");
    } catch (err) {
      console.error("Error deleting custom image:", err);
      setError("Failed to delete custom image");
    }
  };

  const handleAvatarSelect = async (avatarId: number) => {
    if (!currentUser) return;

    try {
      const db = getFirestore();
      if (avatarId === 0) {
        // If selecting Google photo, update to use photoURL
        await updateDoc(doc(db, "users", currentUser.uid), {
          selectedAvatar: 0,
          useGooglePhoto: true,
          customProfileImage: null,
        });
      } else if (avatarId === -1) {
        // Custom image selection - check if it exists in database
        const customImageData = userDetails?.customProfileImage || customImage;
        if (!customImageData) {
          toast.error("Custom image not found. Please upload a new image.");
          return;
        }

        // Update to use custom image
        await updateDoc(doc(db, "users", currentUser.uid), {
          selectedAvatar: -1,
          useGooglePhoto: false,
          customProfileImage: customImageData,
        });
      } else {
        // If selecting custom avatar, update to use that and disable Google photo
        await updateDoc(doc(db, "users", currentUser.uid), {
          selectedAvatar: avatarId,
          useGooglePhoto: false,
          // Don't remove customProfileImage, just change selection
        });
      }

      setSelectedAvatar(avatarId);
      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              selectedAvatar: avatarId,
              useGooglePhoto: avatarId === 0,
              customProfileImage:
                avatarId === -1
                  ? userDetails?.customProfileImage || customImage
                  : prev.customProfileImage,
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
          if (data.customProfileImage) {
            setCustomImage(data.customProfileImage);
          }
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
        <div className="min-h-screen bg-pri-blue-50 dark:bg-neu-gre-800 p-8 font-inter">
          <div className="max-w-2xl mx-auto">
            <div className="text-neu-gre-600 dark:text-neu-gre-300 animate-pulse">
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
        <div className="min-h-screen bg-pri-blue-50 dark:bg-neu-gre-800 p-8 font-inter">
          <div className="max-w-2xl mx-auto">
            <div className="bg-sup-err-100 dark:bg-sup-err-900 text-sup-err-500 dark:text-sup-err-400 p-4 rounded-lg">
              {error}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-pri-blue-50 dark:bg-neu-gre-800 p-8 mt-16">
        <div className="max-w-[1920px] mx-auto space-y-8 px-16 pb-[1000px]">
          <div className="flex items-center space-x-3">
            <Icon
              icon="mingcute:user-3-line"
              className="text-pri-pur-500 dark:text-pri-pur-400 w-8 h-8"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-neu-gre-800 dark:text-neu-gre-100">
              Account Details
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-neu-whi-100 dark:bg-neu-gre-700 rounded-5xl p-24 space-y-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-neu-gre-300/50 dark:border-neu-gre-700/50"
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
                    className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
                    id="email-label"
                  >
                    Email
                  </h2>
                  <p
                    className="text-lg text-neu-gre-800 dark:text-neu-gre-100 bg-neu-gre-100 dark:bg-neu-gre-700 px-4 py-2 rounded-lg border-2 border-neu-gre-200 dark:border-neu-gre-600 w-full"
                    aria-labelledby="email-label"
                  >
                    {userDetails?.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h2
                      className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
                      id="first-name-label"
                    >
                      First Name
                    </h2>
                    <p
                      className="text-lg text-neu-gre-800 dark:text-neu-gre-100 bg-neu-gre-100 dark:bg-neu-gre-700 px-4 py-2 rounded-lg border-2 border-neu-gre-200 dark:border-neu-gre-600 w-full"
                      aria-labelledby="first-name-label"
                    >
                      {userDetails?.firstName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2
                      className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
                      id="last-name-label"
                    >
                      Last Name
                    </h2>
                    <p
                      className="text-lg text-neu-gre-800 dark:text-neu-gre-100 bg-neu-gre-100 dark:bg-neu-gre-700 px-4 py-2 rounded-lg border-2 border-neu-gre-200 dark:border-neu-gre-600 w-full"
                      aria-labelledby="last-name-label"
                    >
                      {userDetails?.lastName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
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
                        className="w-full px-4 py-2 bg-neu-gre-100 dark:bg-neu-gre-700 rounded-lg text-neu-gre-800 dark:text-neu-gre-100 border-2 border-neu-gre-200 dark:border-neu-gre-600 cursor-not-allowed opacity-75"
                        aria-labelledby="password-label"
                        aria-disabled="true"
                      />
                    </div>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="px-4 py-2 text-neu-gre-600 dark:text-neu-gre-200 dark:bg-neu-gre-600 dark:hover:bg-pri-pur-500 font-inter font-medium hover:text-pri-pur-500 hover:ring-pri-pur-300 dark:hover:ring-pri-pur-500 ring-2 ring-neu-gre-400 dark:ring-neu-gre-500 rounded-md transition-all whitespace-nowrap duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
                      aria-label="Reset password"
                    >
                      Reset password
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
                    id="account-created-label"
                  >
                    Account Created
                  </h2>
                  <p
                    className="text-lg text-neu-gre-800 dark:text-neu-gre-100 bg-neu-gre-100 dark:bg-neu-gre-700 px-4 py-2 rounded-lg border-2 border-neu-gre-200 dark:border-neu-gre-600 w-full"
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

                <div className="space-y-2">
                  <h2
                    className="text-sm font-medium text-neu-gre-600 dark:text-neu-gre-300"
                    id="plan-label"
                  >
                    Current Plan
                  </h2>
                  <p
                    className="text-lg text-neu-gre-800 dark:text-neu-gre-100 bg-neu-gre-100 dark:bg-neu-gre-700 px-4 py-2 rounded-lg border-2 border-neu-gre-200 dark:border-neu-gre-600 w-full"
                    aria-labelledby="plan-label"
                  >
                    Starter plan
                  </p>
                </div>

                <div className="pt-8 border-t border-neu-gre-200 dark:border-neu-gre-700 space-y-4">
                  {/* Upgrade Button */}
                  <div className="bg-gradient-to-r from-pri-pur-50 to-pri-tea-50 dark:from-pri-pur-900/20 dark:to-pri-tea-900/20 border border-pri-pur-200 dark:border-pri-pur-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-lg flex items-center justify-center">
                          <Icon
                            icon="mingcute:magic-wand-line"
                            className="w-5 h-5 text-white"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                            Unlock AI Features
                          </h3>
                          <p className="text-xs text-neu-gre-600 dark:text-neu-gre-300">
                            Get AI task division and smart suggestions
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/upgrade")}
                        className="px-4 py-2 bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 text-white text-sm font-medium rounded-md hover:from-pri-pur-600 hover:to-pri-tea-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500 transform hover:scale-105"
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        logout();
                      }}
                      className="py-4 px-4 text-sm font-inter font-medium text-neu-gre-700 dark:text-neu-gre-300 hover:text-neu-gre-900 dark:hover:text-neu-gre-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-600 rounded-md transition-all flex items-center space-x-2 duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 border border-neu-gre-300 dark:border-neu-gre-600"
                      aria-label="Logout from account"
                    >
                      <Icon
                        icon="mingcute:exit-line"
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                      <span>Logout</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="py-4 px-4 text-sm font-inter font-medium text-sup-err-500 dark:text-sup-err-400 dark:hover:text-sup-err-700 hover:text-neu-whi-100 hover:bg-sup-err-500 dark:hover:bg-sup-err-200 rounded-md transition-all flex items-center space-x-2 duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
                      aria-label="Delete account"
                    >
                      <Icon
                        icon="mingcute:delete-2-line"
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                      <span>Delete Account</span>
                    </button>
                  </div>
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
                  {selectedAvatar === 0 && userDetails?.photoURL ? (
                    <img
                      src={userDetails.photoURL}
                      alt="User's Google profile picture"
                      className="w-32 h-32 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 object-cover"
                    />
                  ) : selectedAvatar === -1 &&
                    (customImage || userDetails?.customProfileImage) ? (
                    <img
                      src={customImage || userDetails?.customProfileImage || ""}
                      alt="User's custom profile picture"
                      className="w-32 h-32 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 object-cover"
                    />
                  ) : (
                    <img
                      src={avatars.find((a) => a.id === selectedAvatar)?.src}
                      alt="Selected profile avatar"
                      className="w-32 h-32 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-pri-pur-500 dark:bg-pri-pur-400 text-neu-whi-100 p-2 rounded-md shadow-lg hover:bg-pri-pur-600 dark:hover:bg-pri-pur-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                    aria-label="Change profile picture"
                  >
                    <Icon
                      icon="mingcute:pencil-line"
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  </button>
                </motion.div>

                <div className="w-full">
                  <h3
                    className="text-lg font-medium text-neu-gre-800 dark:text-neu-gre-100 mb-4"
                    id="avatar-selection-label"
                  >
                    Choose avatar
                  </h3>
                  <div
                    className="grid grid-cols-8 gap-2"
                    role="radiogroup"
                    aria-labelledby="avatar-selection-label"
                  >
                    {userDetails?.photoURL && (
                      <motion.button
                        onClick={() => handleAvatarSelect(0)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-1 rounded-md transition-all focus:outline-none focus:ring-4 focus:ring-pri-focus-500 ${
                          selectedAvatar === 0
                            ? "bg-pri-pur-500 dark:bg-pri-pur-400 ring-4 ring-pri-pur-400 dark:ring-pri-pur-300 shadow-lg"
                            : "bg-neu-gre-200 dark:bg-neu-gre-700 hover:bg-neu-gre-300 dark:hover:bg-neu-gre-600"
                        }`}
                        role="radio"
                        aria-checked={selectedAvatar === 0}
                        aria-label="Select Google profile picture"
                      >
                        <img
                          src={userDetails.photoURL}
                          alt="Google profile picture option"
                          className="w-full h-auto rounded-sm object-cover aspect-square"
                          aria-hidden="true"
                        />
                      </motion.button>
                    )}
                    {avatars.map((avatar) => (
                      <motion.button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-1 rounded-md transition-all focus:outline-none focus:ring-4 focus:ring-pri-focus-500 ${
                          selectedAvatar === avatar.id
                            ? "bg-pri-pur-500 dark:bg-pri-pur-400 ring-4 ring-pri-pur-400 dark:ring-pri-pur-300 shadow-lg"
                            : "bg-neu-gre-200 dark:bg-neu-gre-700 hover:bg-neu-gre-300 dark:hover:bg-neu-gre-600"
                        }`}
                        role="radio"
                        aria-checked={selectedAvatar === avatar.id}
                        aria-label={`Select avatar option ${avatar.id}`}
                      >
                        <img
                          src={avatar.src}
                          alt="Selected profile avatar"
                          className="w-full h-auto rounded-sm"
                          aria-hidden="true"
                        />
                      </motion.button>
                    ))}

                    {/* Custom Image Option */}
                    {(customImage || userDetails?.customProfileImage) && (
                      <motion.div
                        key="custom"
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => handleAvatarSelect(-1)}
                          className={`p-1 rounded-md transition-all focus:outline-none focus:ring-4 focus:ring-pri-focus-500 ${
                            selectedAvatar === -1
                              ? "bg-pri-pur-500 dark:bg-pri-pur-400 ring-4 ring-pri-pur-400 dark:ring-pri-pur-300 shadow-lg"
                              : "bg-neu-gre-200 dark:bg-neu-gre-700 hover:bg-neu-gre-300 dark:hover:bg-neu-gre-600"
                          }`}
                          role="radio"
                          aria-checked={selectedAvatar === -1}
                          aria-label="Select custom profile picture"
                        >
                          <img
                            src={
                              customImage ||
                              userDetails?.customProfileImage ||
                              ""
                            }
                            alt="Custom profile picture"
                            className="w-full h-auto rounded-sm object-cover aspect-square"
                            aria-hidden="true"
                          />
                        </button>

                        {/* Delete button for custom image */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomImage();
                          }}
                          className="absolute -bottom-2 -right-2 bg-neu-gre-500 dark:bg-neu-gre-600 text-neu-whi-100 p-2 rounded-md shadow-lg hover:bg-neu-gre-600 dark:hover:bg-neu-gre-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-focus-500"
                          aria-label="Delete custom image"
                        >
                          <Icon
                            icon="mingcute:delete-2-line"
                            className="w-5 h-5"
                            aria-hidden="true"
                          />
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Upload Custom Image Section */}
                  <div className="mt-6 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300">
                        Or upload your own image
                      </h4>
                      <p className="text-xs text-neu-gre-500 dark:text-neu-gre-400 mt-1">
                        Max 5MB, 2048x2048px
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                        aria-label="Upload custom profile picture"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="py-3 px-4 text-sm font-inter font-medium text-neu-gre-700 dark:text-neu-gre-300 hover:text-neu-gre-900 dark:hover:text-neu-gre-100 hover:bg-neu-gre-100 dark:hover:bg-neu-gre-600 rounded-md transition-all flex items-center space-x-2 duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500 border border-neu-gre-300 dark:border-neu-gre-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Upload custom profile picture"
                      >
                        {isUploading ? (
                          <>
                            <Icon
                              icon="mingcute:loading-3-line"
                              className="w-5 h-5 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Icon
                              icon="mingcute:upload-line"
                              className="w-5 h-5"
                              aria-hidden="true"
                            />
                            <span>Choose Image</span>
                          </>
                        )}
                      </button>

                      {uploadError && (
                        <div className="text-sm text-sup-err-500 dark:text-sup-err-400 bg-sup-err-50 dark:bg-sup-err-900/20 border border-sup-err-200 dark:border-sup-err-800 rounded-md p-2">
                          {uploadError}
                        </div>
                      )}
                    </div>
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
                  className="bg-neu-whi-100 dark:bg-neu-gre-800 rounded-lg p-6 max-w-md w-full mx-4"
                  role="document"
                >
                  <h3
                    id="delete-account-title"
                    className="text-xl font-semibold mb-4 flex items-center gap-2 text-neu-gre-800 dark:text-neu-gre-100"
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
                    className="text-neu-gre-600 dark:text-neu-gre-300 mb-6"
                  >
                    Are you sure you want to delete your account? This action
                    cannot be undone and all your data will be permanently
                    deleted.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      ref={firstFocusableRef}
                      onClick={() => setShowDeleteModal(false)}
                      className="px-8 py-4 text-base font-inter font-medium bg-neu-gre-300 dark:bg-neu-gre-700 rounded-md text-neu-gre-800 dark:text-neu-gre-100 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 hover:bg-pri-pur-200 dark:hover:bg-pri-pur-700/50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
                      disabled={isDeleting}
                      aria-label="Cancel account deletion"
                    >
                      Cancel
                    </button>
                    <button
                      ref={lastFocusableRef}
                      onClick={handleDeleteAccount}
                      className="px-4 py-4 text-sm font-inter font-medium bg-sup-err-500 dark:bg-sup-err-600 text-neu-whi-100 rounded-md hover:bg-sup-err-700 dark:hover:bg-sup-err-700 transition-colors disabled:opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
                      disabled={isDeleting}
                      aria-label="Confirm account deletion"
                    >
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
                  className="bg-neu-whi-100 dark:bg-neu-gre-800 rounded-lg p-6 max-w-md w-full mx-4 text-center"
                  role="document"
                >
                  <div className="mb-4" role="presentation">
                    <Icon
                      icon="mingcute:mail-send-fill"
                      className="w-12 h-12 text-pri-pur-500 dark:text-pri-pur-400 mx-auto"
                      aria-hidden="true"
                    />
                  </div>
                  <h3
                    id="reset-confirmation-title"
                    className="text-xl font-semibold mb-2 text-neu-gre-800 dark:text-neu-gre-100"
                  >
                    Check Your Email
                  </h3>
                  <p
                    id="reset-confirmation-description"
                    className="text-neu-gre-600 dark:text-neu-gre-300 mb-4"
                  >
                    We've sent a password reset link to your email address.
                    Please check your inbox and follow the instructions to reset
                    your password.
                  </p>
                  <button
                    onClick={() => setShowResetConfirmation(false)}
                    className="px-4 py-2 bg-pri-pur-500 dark:bg-pri-pur-400 text-white rounded hover:bg-pri-pur-600 dark:hover:bg-pri-pur-500 transition-colors focus:outline-none focus:ring-4 focus:ring-pri-focus-500"
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
                  className="bg-neu-whi-100 dark:bg-neu-gre-800 rounded-lg p-6 max-w-md w-full mx-4"
                  role="document"
                >
                  <h3
                    id="reset-password-title"
                    className="text-xl font-semibold mb-4 flex items-center gap-2 text-neu-gre-800 dark:text-neu-gre-100"
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
                    className="text-neu-gre-600 dark:text-neu-gre-300 mb-6"
                  >
                    We'll send a password reset link to your email address (
                    {currentUser?.email}). You'll need to click the link in the
                    email to reset your password.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      ref={resetFirstFocusableRef}
                      onClick={() => setShowResetModal(false)}
                      className="px-8 py-4 text-base font-inter font-medium bg-neu-gre-300 dark:bg-neu-gre-700 rounded-md text-neu-gre-800 dark:text-neu-gre-100 hover:text-neu-gre-800 dark:hover:text-neu-gre-100 hover:bg-neu-gre-500 dark:hover:bg-neu-gre-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
                      aria-label="Cancel password reset"
                    >
                      Cancel
                    </button>
                    <button
                      ref={resetLastFocusableRef}
                      onClick={handleResetPassword}
                      className="px-4 py-4 text-base font-inter font-medium bg-pri-pur-500 dark:bg-pri-pur-400 text-neu-whi-100 rounded-md hover:bg-pri-pur-700 dark:hover:bg-pri-pur-500 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri-focus-500 dark:focus-visible:ring-pri-focus-500"
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
