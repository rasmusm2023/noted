import { Icon } from "@iconify/react";

export const Next7DaysIconForMenu = () => {
  return (
    <div className="relative w-6 h-6">
      <Icon icon="mingcute:calendar-fill" width={24} height={24} />
      <span className="absolute inset-x-0 inset-y-4 flex items-center justify-center text-[8px] font-bold text-neu-whi-100">
        7
      </span>
    </div>
  );
};
