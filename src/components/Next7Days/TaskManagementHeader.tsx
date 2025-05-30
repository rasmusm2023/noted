import { Icon } from "@iconify/react";
import { ClearCompletedButton } from "../Buttons/ClearCompletedButton";

interface TaskManagementHeaderProps {
  onClearCompleted: () => void;
  children?: React.ReactNode;
}

export const TaskManagementHeader = ({
  onClearCompleted,
  children,
}: TaskManagementHeaderProps) => {
  return (
    <header className="flex-none pt-4 pb-4" role="banner">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between pl-8 pr-8">
          <div role="heading" aria-level={1}>
            {children}
          </div>
          <nav
            className="flex items-center space-x-2"
            role="toolbar"
            aria-label="Task management actions"
          >
            <ClearCompletedButton
              onClearCompleted={onClearCompleted}
              aria-label="Clear all completed tasks"
            />
          </nav>
        </div>
      </div>
    </header>
  );
};
