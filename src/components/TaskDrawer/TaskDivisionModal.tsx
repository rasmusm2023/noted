import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, Subtask } from "../../types/task";
import type { DivisionPreview } from "../../services/aiService";

interface TaskDivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    suggestedTasks: {
      title: string;
      description: string;
      subtasks: Subtask[];
    }[]
  ) => void;
  preview: DivisionPreview | null;
  isLoading: boolean;
}

export function TaskDivisionModal({
  isOpen,
  onClose,
  onConfirm,
  preview,
  isLoading,
}: TaskDivisionModalProps) {
  const handleConfirm = () => {
    if (!preview) {
      console.error("No preview available");
      return;
    }

    // Confirm all suggested divisions
    onConfirm(preview.suggestedDivisions);
    onClose();
  };

  const handleReject = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-neu-whi-100 dark:bg-neu-gre-800 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-neu-gre-200 dark:border-neu-gre-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neu-gre-800 dark:text-neu-gre-100 font-inter">
                  Divide Task with AI
                </h2>
                <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mt-1">
                  AI has analyzed your task and suggests dividing it into
                  smaller, more manageable tasks.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neu-gre-400 hover:text-neu-gre-600 dark:text-neu-gre-500 dark:hover:text-neu-gre-300 transition-colors rounded-md hover:bg-neu-gre-100 dark:hover:bg-neu-gre-700"
                aria-label="Close modal"
              >
                <Icon icon="mingcute:close-line" width={20} height={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pri-pur-500"></div>
                  <p className="text-neu-gre-600 dark:text-neu-gre-300 font-inter">
                    AI is analyzing your task...
                  </p>
                </div>
              </div>
            ) : preview ? (
              <div className="space-y-6">
                {/* Original Task Summary */}
                <div className="bg-neu-gre-50 dark:bg-neu-gre-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                    Original Task
                  </h3>
                  <p className="text-neu-gre-700 dark:text-neu-gre-200 font-medium">
                    {preview.originalTitle}
                  </p>
                  <p className="text-sm text-neu-gre-600 dark:text-neu-gre-400 mt-1">
                    {preview.originalSubtaskCount} subtasks
                  </p>
                </div>

                {/* Suggested Divisions */}
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium text-neu-gre-800 dark:text-neu-gre-100">
                      Suggested Task Divisions
                    </h3>
                    <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mt-1">
                      All {preview.originalSubtaskCount} subtasks will be
                      divided into the following tasks:
                    </p>
                  </div>

                  <div className="space-y-4">
                    {preview.suggestedDivisions.map((division, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-2 border-neu-gre-200 dark:border-neu-gre-600 rounded-lg p-4 bg-neu-gre-50 dark:bg-neu-gre-700/30"
                      >
                        <div className="mb-3">
                          <h4 className="font-medium text-neu-gre-800 dark:text-neu-gre-100 mb-1">
                            {division.title}
                          </h4>
                          <p className="text-sm text-neu-gre-600 dark:text-neu-gre-300 mb-2">
                            {division.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-neu-gre-500 dark:text-neu-gre-400">
                            <span className="flex items-center space-x-1">
                              <Icon
                                icon="mingcute:list-check-line"
                                width={12}
                                height={12}
                              />
                              <span>{division.subtaskCount} subtasks</span>
                            </span>
                          </div>
                        </div>

                        {/* All Subtasks - No Truncation */}
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {division.subtasks.map((subtask, subIndex) => (
                            <div
                              key={subIndex}
                              className="flex items-center space-x-2 py-1"
                            >
                              <div className="w-1.5 h-1.5 bg-pri-pur-400 dark:bg-pri-pur-300 rounded-full flex-shrink-0"></div>
                              <span className="text-xs text-neu-gre-600 dark:text-neu-gre-400">
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neu-gre-200 dark:border-neu-gre-700 bg-neu-gre-50 dark:bg-neu-gre-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neu-gre-600 dark:text-neu-gre-400">
                <span>
                  This will create {preview?.suggestedDivisions.length || 0} new
                  tasks from your original task
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReject}
                  className="px-6 py-2 bg-sup-err-500 text-white rounded-md hover:bg-sup-err-600 transition-colors font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-pri-pur-500 text-white rounded-md hover:bg-pri-pur-600 transition-colors font-medium"
                >
                  Confirm task divide
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
