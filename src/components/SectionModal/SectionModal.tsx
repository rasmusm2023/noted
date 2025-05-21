import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import type { SectionItem } from "../../types/task";

const SECTION_COLORS = [
  {
    name: "Default",
    value: "bg-neu-gre-100",
  },
  { name: "Purple", value: "bg-pri-pur-500" },
  { name: "Green", value: "bg-sup-suc-500" },
  { name: "Yellow", value: "bg-sup-war-500" },
  { name: "Red", value: "bg-sup-err-500" },
  { name: "Rose", value: "bg-sec-rose-500" },
  { name: "Peach", value: "bg-sec-pea-500" },
  { name: "Orange", value: "bg-orange-test-500" },
];

interface SectionModalProps {
  section: SectionItem;
  isOpen: boolean;
  onClose: (section: SectionItem) => void;
  onUpdate: (sectionId: string, updates: Partial<SectionItem>) => void;
  onDelete: (sectionId: string) => void;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  section,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [editedTitle, setEditedTitle] = useState(section.text);
  const [editedTime, setEditedTime] = useState(section.time);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState(
    section.backgroundColor
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
  const firstColorRef = useRef<HTMLButtonElement>(null);
  const lastColorRef = useRef<HTMLButtonElement>(null);
  const closeColorPickerRef = useRef<HTMLButtonElement>(null);
  const deleteTaskButtonRef = useRef<HTMLButtonElement>(null);
  const closeModalButtonRef = useRef<HTMLButtonElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const showColorPicker = isColorPickerOpen;

  useEffect(() => {
    if (isOpen) {
      setEditedTitle(section.text);
      setEditedTime(section.time.replace(":", "."));
      setCurrentBackgroundColor(section.backgroundColor);
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }
    }
  }, [isOpen, section]);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [editedTitle]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (showColorPicker) {
      firstColorRef.current?.focus();
    }
  }, [showColorPicker]);

  // Add focus trap effect for modal
  useEffect(() => {
    if (isOpen) {
      // Focus the title input when modal opens
      if (titleTextareaRef.current) {
        titleTextareaRef.current.focus();
        const length = titleTextareaRef.current.value.length;
        titleTextareaRef.current.setSelectionRange(length, length);
      }

      const handleModalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          // Get all focusable elements in the modal
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;

          if (!focusableElements?.length) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          // If shift + tab and we're on the first focusable element, focus the last one
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
          // If tab and we're on the last focusable element, focus the first one
          else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleModalKeyDown);
      return () => {
        document.removeEventListener("keydown", handleModalKeyDown);
      };
    }
  }, [isOpen]);

  const formatTimeFromInput = (input: string): string => {
    // Allow only numbers and specific symbols
    const cleaned = input.replace(/[^0-9.,:;-]/g, "");

    if (cleaned.length === 0) return "";

    // Split by any of the allowed separators
    const parts = cleaned.split(/[.,:;-]/);
    const numbers = parts.join("").replace(/\D/g, "");

    if (numbers.length === 0) return "";

    // Handle different input lengths
    if (numbers.length <= 2) {
      // Just hours
      const hours = parseInt(numbers);
      if (hours > 23) return "23:00";
      return `${hours.toString().padStart(2, "0")}:00`;
    } else if (numbers.length <= 4) {
      // Hours and minutes
      const hours = parseInt(numbers.slice(0, -2));
      const minutes = parseInt(numbers.slice(-2));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else {
      // Too many digits, take first 4
      const hours = parseInt(numbers.slice(0, 2));
      const minutes = parseInt(numbers.slice(2, 4));
      if (hours > 23) return "23:00";
      if (minutes > 59) return `${hours.toString().padStart(2, "0")}:59`;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }
  };

  const handleClose = () => {
    // Format the time before saving
    const formattedTime = formatTimeFromInput(editedTime);
    // Save any pending changes before closing
    onUpdate(section.id, {
      text: editedTitle,
      time: formattedTime,
      backgroundColor: currentBackgroundColor,
      shouldClose: true,
    });
    onClose({ ...section, shouldClose: true });
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      // Format the time before saving
      const formattedTime = formatTimeFromInput(editedTime);
      // Save any pending changes before closing
      onUpdate(section.id, {
        text: editedTitle,
        time: formattedTime,
        backgroundColor: currentBackgroundColor,
        shouldClose: true,
      });
      handleClose();
    }
  };

  const handleColorSelect = async (color: string) => {
    try {
      setCurrentBackgroundColor(color); // Update local state immediately
      await onUpdate(section.id, {
        backgroundColor: color,
      });
      setIsColorPickerOpen(false);
    } catch (error) {
      console.error("Error updating section color:", error);
      setCurrentBackgroundColor(section.backgroundColor || "bg-neu-gre-800"); // Revert on error
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Save changes and close
      onUpdate(section.id, {
        text: editedTitle,
        time: editedTime,
        backgroundColor: currentBackgroundColor,
        shouldClose: true,
      });
      handleClose();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9.,:;-]/g, "");
    if (cleaned.length <= 5) {
      setEditedTime(cleaned);
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Format the time before saving
      const formattedTime = formatTimeFromInput(editedTime);
      // Save changes and close
      onUpdate(section.id, {
        text: editedTitle,
        time: formattedTime,
        backgroundColor: currentBackgroundColor,
        shouldClose: true,
      });
      handleClose();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleColorPickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstColorRef.current) {
          e.preventDefault();
          closeColorPickerRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastColorRef.current) {
          e.preventDefault();
          closeColorPickerRef.current?.focus();
        }
      }
    } else if (e.key === "Escape") {
      setIsColorPickerOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="bg-neu-gre-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 flex-1">
              <Icon
                icon="mingcute:pencil-3-fill"
                className="text-neu-gre-400 w-6 h-6"
              />
              <textarea
                ref={titleTextareaRef}
                value={editedTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-lg font-inter font-semibold text-neu-whi-100 focus:outline-none cursor-text border-b-2 border-transparent focus:border-pri-pur-500 transition-colors duration-200 resize-none overflow-hidden min-h-[28px] py-1"
                rows={1}
                style={{ height: "auto" }}
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <div className="relative" ref={colorPickerRef}>
                <button
                  ref={colorPickerButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsColorPickerOpen(!isColorPickerOpen);
                  }}
                  className="p-2 text-neu-gre-400 hover:text-neu-whi-100 transition-colors flex items-center justify-center"
                  aria-label="Change section background color"
                >
                  <div
                    className={`w-6 h-6 rounded-md border-[2px] border-neu-gre-500 ${currentBackgroundColor}`}
                  />
                </button>
                {isColorPickerOpen && (
                  <div
                    className="absolute right-0 mt-3 p-4 bg-neu-gre-700 rounded-lg shadow-lg z-10 w-48"
                    onKeyDown={handleColorPickerKeyDown}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-inter text-neu-gre-300">
                        Select color
                      </span>
                      <button
                        ref={closeColorPickerRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsColorPickerOpen(false);
                        }}
                        className="p-1 text-neu-gre-400 hover:text-neu-whi-100 transition-colors"
                        aria-label="Close color picker"
                      >
                        <Icon
                          icon="mingcute:close-circle-fill"
                          className="w-6 h-6"
                        />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {SECTION_COLORS.map((color, index) => (
                        <button
                          ref={
                            index === 0
                              ? firstColorRef
                              : index === SECTION_COLORS.length - 1
                              ? lastColorRef
                              : null
                          }
                          key={color.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorSelect(color.value);
                          }}
                          className={`w-6 h-6 rounded-md ${
                            color.value
                          } ring-1 ring-neu-gre-600 ${
                            currentBackgroundColor === color.value
                              ? "ring-2 ring-pri-pur-500"
                              : ""
                          }`}
                          aria-label={`Select ${color.name} color`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                ref={deleteTaskButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(section.id);
                }}
                className="p-2 text-neu-gre-400 hover:text-red-500 transition-colors flex items-center justify-center"
                aria-label="Delete section"
              >
                <Icon icon="mingcute:delete-2-fill" className="w-6 h-6" />
              </button>
              <button
                ref={closeModalButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 text-neu-gre-400 hover:text-neu-whi-100 transition-colors flex items-center justify-center"
                aria-label="Close modal"
              >
                <Icon icon="mingcute:close-circle-fill" className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <Icon
                icon="mingcute:alarm-2-fill"
                className="text-neu-gre-400 w-6 h-6"
              />
              <div className="flex-1">
                <label className="block text-md font-medium font-inter text-neu-gre-200 mb-2">
                  Time
                </label>
                <input
                  ref={timeInputRef}
                  type="text"
                  value={editedTime}
                  onChange={handleTimeChange}
                  onKeyDown={handleTimeKeyDown}
                  placeholder="09.00"
                  maxLength={5}
                  className="w-24 bg-transparent text-base font-inter font-semibold text-neu-whi-100 placeholder-neu-gre-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
