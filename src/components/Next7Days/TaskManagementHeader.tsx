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
    <header className="flex-none pt-4 pb-4 dark:bg-neu-gre-800" role="banner">
      <div className="flex items-center justify-between pl-4 sm:pl-8 pr-4 sm:pr-8">
        <div role="heading" aria-level={1} className="dark:text-neu-whi-100">
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
    </header>
  );
};
