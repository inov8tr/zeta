import { parseScheduleEntries, type WeeklyScheduleEntry } from "@/utils/classSchedule";

export type StudentSummary = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  test_status: string | null;
};

export type ClassSummary = {
  id: string;
  name: string;
  teacherName: string | null;
  level: string | null;
  schedule: WeeklyScheduleEntry[];
  roster: StudentSummary[];
};

export type SlotEvent = {
  classId: string;
  className: string;
  teacherName: string | null;
  level: string | null;
  roster: StudentSummary[];
};

export type WeeklySlotMap = Record<string, SlotEvent[]>;

export type ScheduleBreakdown = {
  slots: WeeklySlotMap;
  unscheduled: ClassSummary[];
};

const toSlotKey = (day: number, start: string) => `${day}-${start}`;

export const buildScheduleBreakdown = (classes: ClassSummary[]): ScheduleBreakdown => {
  const slots: WeeklySlotMap = {};
  const unscheduled: ClassSummary[] = [];

  classes.forEach((classItem) => {
    if (classItem.schedule.length === 0) {
      unscheduled.push(classItem);
      return;
    }

    classItem.schedule.forEach((entry) => {
      const key = toSlotKey(entry.day, entry.start);
      const list = slots[key] ?? [];
      list.push({
        classId: classItem.id,
        className: classItem.name,
        teacherName: classItem.teacherName,
        level: classItem.level,
        roster: classItem.roster,
      });
      slots[key] = list;
    });
  });

  Object.values(slots).forEach((events) => {
    events.sort((a, b) => {
      const teacherCompare = (a.teacherName ?? "").localeCompare(b.teacherName ?? "");
      if (teacherCompare !== 0) {
        return teacherCompare;
      }
      return a.className.localeCompare(b.className);
    });
  });

  return { slots, unscheduled };
};

export const prepareClassSummaries = (
  classes: Array<{
    id: string;
    name: string;
    level: string | null;
    schedule: string | null;
    teacher_id: string | null;
  }>,
  rosterByClass: Map<string, StudentSummary[]>,
  teacherNames: Map<string, string>
): ClassSummary[] =>
  classes
    .map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      level: classItem.level,
      teacherName: classItem.teacher_id ? teacherNames.get(classItem.teacher_id) ?? classItem.teacher_id : null,
      schedule: parseScheduleEntries(classItem.schedule ?? null),
      roster: rosterByClass.get(classItem.id) ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
