import { Icon } from "@iconify/react";
import type { SectionItem as SectionItemType } from "../../types/task";

interface SectionItemProps {
  section: SectionItemType;
  onSelect: (section: SectionItemType) => void;
  onDelete: (sectionId: string) => void;
}

export const SectionItem = ({
  section,
  onSelect,
  onDelete,
}: SectionItemProps) => {
  return (
    <div
      className={`p-4 ${
        section.backgroundColor || "bg-sec-rose-500/25"
      } rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-pri-pur-500`}
      tabIndex={0}
      onClick={() => onSelect(section)}
    >
      <div className="flex-1">
        <h3 className="text-lg font-inter font-semibold text-neu-gre-800">
          {section.text}
        </h3>
      </div>
      <div className="mx-4">
        <h3 className="text-base font-inter font-semibold text-neu-gre-800">
          {section.time ? section.time.replace(":", ".") : ""}
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(section);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              onSelect(section);
            }
          }}
          className="p-2 text-neu-400 hover:text-neu-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Edit section "${section.text}"`}
        >
          <Icon
            icon="mingcute:edit-2-fill"
            width={24}
            height={24}
            aria-label="Edit section"
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(section.id);
          }}
          className="p-2 text-neu-400 hover:text-red-500 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pri-blue-500 rounded-lg"
          aria-label={`Delete section "${section.text}"`}
        >
          <Icon
            icon="mingcute:delete-2-fill"
            width={24}
            height={24}
            aria-label="Delete section"
          />
        </button>
      </div>
    </div>
  );
};
