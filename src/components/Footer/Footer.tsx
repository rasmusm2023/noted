import React from "react";

export function Footer() {
  return (
    <footer className="bg-neu-whi-100 dark:bg-neu-gre-900 border-t border-neu-gre-300 dark:border-neu-gre-700 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/assets/favicon/Noted-app-icon.png"
            alt="Noted"
            className="h-6 w-6"
          />
          <span className="text-sm font-medium text-neu-gre-700 dark:text-neu-gre-300">
            Noted
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-neu-gre-600 dark:text-neu-gre-400">
          <span>© 2025 Noted. All rights reserved.</span>
          <span className="hidden sm:inline">•</span>
          <span>Made with ❤️ for productivity</span>
        </div>
      </div>
    </footer>
  );
}
