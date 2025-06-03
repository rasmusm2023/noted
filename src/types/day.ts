import type { Task } from "./task";
import type { SectionItem } from "./section";

export interface Day {
  date: Date;
  items: (Task | SectionItem)[];
}
