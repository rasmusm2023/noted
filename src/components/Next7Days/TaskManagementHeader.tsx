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
    <div className="flex-none pt-8 pb-8">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between pl-8 pr-8">
          {children}
          <div className="flex items-center space-x-2">
            <ClearCompletedButton onClearCompleted={onClearCompleted} />
          </div>
        </div>
      </div>
    </div>
  );
};
