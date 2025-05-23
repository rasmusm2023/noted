import { Icon } from "@iconify/react";
import type { SectionItem as SectionItemType } from "../../types/task";

interface SectionItemProps {
  section: SectionItemType;
  onSectionClick: (section: SectionItemType) => void;
  onSectionDelete: (sectionId: string) => void;
}

export const SectionItem = ({
  section,
  onSectionClick,
  onSectionDelete,
}: SectionItemProps) => {
  return (
    <div
      className={`p-4 ${
        section.backgroundColor ||
        "bg-gradient-to-r from-neu-gre-900 to-neu-gre-900/80"
      } rounded-5xl flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pri-blue-500 backdrop-blur-sm`}
      tabIndex={0}
      onClick={() => onSectionClick(section)}
    >
      <div className="flex-1">
        <h3 className="text-md font-inter font-semibold text-neu-gre-300">
          {section.text}
        </h3>
      </div>
      <div className="mx-4">
        <h3 className="text-base font-inter font-semibold text-neu-gre-400">
          {section.time?.replace(":", ".") || ""}
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSectionDelete(section.id);
          }}
          className="p-2 text-neu-gre-400 hover:text-red-500 transition-all duration-300 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-5xl hover:bg-neu-800/50"
          aria-label={`Delete section "${section.text}"`}
        >
          <Icon icon="mingcute:delete-fill" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
