import { useEffect } from "react";

/**
 * Custom hook for managing page titles dynamically
 * @param title - The title to set for the current page
 * @param baseTitle - The base title (defaults to "Noted")
 */
export function usePageTitle(title: string, baseTitle: string = "Noted") {
  useEffect(() => {
    const fullTitle = title ? `${title} – ${baseTitle}` : baseTitle;
    document.title = fullTitle;

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [title, baseTitle]);
}

/**
 * Hook for setting the default app title
 * @param title - The default title for the app
 */
export function useAppTitle(
  title: string = "Noted – Track and manage your tasks in one place"
) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
