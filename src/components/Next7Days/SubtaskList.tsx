import type { Subtask } from "../../types/task";

interface SubtaskListProps {
  subtasks: Subtask[];
}

export const SubtaskList = ({ subtasks }: SubtaskListProps) => {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  // Sort subtasks by their order property
  const sortedSubtasks = [...subtasks].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className="mt-2 space-y-1">
      {sortedSubtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              subtask.completed ? "bg-sup-suc-500" : "bg-neu-gre-500"
            }`}
          />
          <span
            className={`font-inter text-sm ${
              subtask.completed
                ? "line-through text-neu-gre-400"
                : "text-neu-gre-400"
            }`}
          >
            {subtask.title}
          </span>
        </div>
      ))}
    </div>
  );
};
