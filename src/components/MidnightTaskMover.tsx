import { useEffect } from "react";
import { taskService } from "../services/taskService";
import { useAuth } from "../contexts/AuthContext";

export function MidnightTaskMover() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const checkAndMoveTasks = async () => {
      const now = new Date();
      const lastMidnight = new Date(now);
      lastMidnight.setHours(0, 0, 0, 0);

      // Get the last time we moved tasks from localStorage
      const lastMoveTime = localStorage.getItem("lastTaskMoveTime");
      const lastMove = lastMoveTime ? new Date(lastMoveTime) : null;

      // Only move tasks if:
      // 1. We haven't moved tasks yet today (no lastMove)
      // 2. OR if the last move was before midnight AND it's currently midnight (within 1 minute)
      const isMidnight = now.getHours() === 0 && now.getMinutes() < 1;
      const shouldMove = !lastMove || (lastMove < lastMidnight && isMidnight);

      if (shouldMove) {
        console.log("Moving incomplete tasks to next day...");
        await taskService.moveIncompleteTasksToNextDay(currentUser.uid);
        localStorage.setItem("lastTaskMoveTime", now.toISOString());
      }
    };

    // Check immediately when component mounts
    checkAndMoveTasks();

    // Set up interval to check every minute
    const interval = setInterval(checkAndMoveTasks, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [currentUser]);

  // This component doesn't render anything
  return null;
}
