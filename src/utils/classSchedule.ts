import { addMinutes, format, startOfWeek } from "date-fns";
import { z } from "zod";

export const scheduleEntrySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Invalid start time" }),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Invalid end time" }),
  })
  .superRefine((data, ctx) => {
    if (data.start >= data.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["end"],
      });
    }
  });

export const scheduleEntriesSchema = z.array(scheduleEntrySchema).max(42, { message: "Too many schedule entries" });

export type WeeklyScheduleEntry = {
  day: number; // 0 (Sun) - 6 (Sat)
  start: string; // HH:mm
  end: string; // HH:mm
};

export const normalizeScheduleEntries = (entries: WeeklyScheduleEntry[]): WeeklyScheduleEntry[] =>
  [...entries].sort((a, b) => {
    if (a.day === b.day) {
      return a.start.localeCompare(b.start);
    }
    return a.day - b.day;
  });

export const serializeScheduleEntries = (entries: WeeklyScheduleEntry[]): string =>
  JSON.stringify(normalizeScheduleEntries(entries));

export const parseScheduleEntries = (value: string | null | undefined): WeeklyScheduleEntry[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const result = scheduleEntriesSchema.safeParse(
      parsed.map((item) => ({
        day: typeof item.day === "number" ? item.day : Number.NaN,
        start: typeof item.start === "string" ? item.start : "",
        end: typeof item.end === "string" ? item.end : "",
      })),
    );
    if (!result.success) {
      return [];
    }
    return normalizeScheduleEntries(result.data);
  } catch {
    return [];
  }
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildDateForEntry = (entry: WeeklyScheduleEntry) => {
  const base = startOfWeek(new Date(), { weekStartsOn: 0 });
  const [startHours, startMinutes] = entry.start.split(":").map(Number);
  const [endHours, endMinutes] = entry.end.split(":").map(Number);

  const startDate = new Date(base);
  startDate.setDate(base.getDate() + entry.day);
  startDate.setHours(startHours, startMinutes, 0, 0);

  const endDate = new Date(base);
  endDate.setDate(base.getDate() + entry.day);
  endDate.setHours(endHours, endMinutes, 0, 0);

  if (endDate <= startDate) {
    return { start: startDate, end: addMinutes(startDate, 60) };
  }

  return { start: startDate, end: endDate };
};

export const formatScheduleEntries = (entries: WeeklyScheduleEntry[]): string => {
  if (entries.length === 0) {
    return "—";
  }
  return entries
    .map((entry) => {
      const { start, end } = buildDateForEntry(entry);
      return `${dayLabels[entry.day] ?? "Day"} ${format(start, "h:mma")} – ${format(end, "h:mma")}`;
    })
    .join(", ");
};
