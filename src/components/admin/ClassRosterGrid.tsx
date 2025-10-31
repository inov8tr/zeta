"use client";

import * as React from "react";
import { format } from "date-fns";

import type { ClassSummary, ScheduleBreakdown, SlotEvent } from "@/utils/rosterSchedule";
import { buildScheduleBreakdown } from "@/utils/rosterSchedule";

const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6]; // Monday - Saturday
const DAY_ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const baseDate = new Date();
const timeLabel = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return format(date, "h:mma");
};

const sortTimes = (times: string[]) =>
  [...times].sort((a, b) => {
    if (a === b) {
      return 0;
    }
    return a < b ? -1 : 1;
  });

const getTimesFromClasses = (classes: ClassSummary[]) => {
  const set = new Set<string>();
  classes.forEach((classItem) => {
    classItem.schedule.forEach((entry) => {
      set.add(entry.start);
    });
  });
  return sortTimes(Array.from(set));
};

const getSlotEvents = (slots: ScheduleBreakdown["slots"], day: number, start: string): SlotEvent[] => {
  const key = `${day}-${start}`;
  return slots[key] ?? [];
};

const rosterPreview = (students: SlotEvent["roster"], limit = 6) => {
  if (students.length <= limit) {
    return students;
  }
  return students.slice(0, limit);
};

interface ClassRosterGridProps {
  classes: ClassSummary[];
}

const TIME_COLUMN_WIDTH = 160;
const DAY_COLUMN_WIDTH = 280;
const COLUMN_GAP = 16;
const DAY_COLUMNS_COUNT = DISPLAY_DAYS.length * 2;
const GRID_MIN_WIDTH = TIME_COLUMN_WIDTH + DAY_COLUMNS_COUNT * DAY_COLUMN_WIDTH + (DAY_COLUMNS_COUNT + 1) * COLUMN_GAP;

const ClassCard = ({ event }: { event: SlotEvent }) => (
  <article className="flex w-full flex-col gap-2 rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-3 shadow-sm">
    <div>
      <h3 className="text-sm font-semibold text-brand-primary-dark">{event.className}</h3>
      <p className="text-xs text-brand-primary/70">
        {event.teacherName ? `Teacher ${event.teacherName}` : "Teacher unassigned"}
        {event.level ? ` • Section ${event.level}` : ""}
      </p>
    </div>
    <div className="flex-1 overflow-y-auto rounded-xl bg-white/60 p-2 text-xs text-neutral-700 print:overflow-visible print:bg-transparent print:p-0">
      {event.roster.length === 0 ? (
        <p className="text-neutral-muted">No students yet.</p>
      ) : (
        <ul className="space-y-1">
          {rosterPreview(event.roster).map((student) => (
            <li key={student.user_id}>
              <span className="font-medium text-brand-primary-dark">{student.full_name ?? "Unnamed student"}</span>
            </li>
          ))}
        </ul>
      )}
      {event.roster.length > 6 ? (
        <p className="mt-1 text-[10px] uppercase text-brand-primary/70 print:hidden">+{event.roster.length - 6} more</p>
      ) : null}
    </div>
  </article>
);

const ClassRosterGrid = ({ classes }: ClassRosterGridProps) => {
  const schedule = React.useMemo<ScheduleBreakdown>(() => buildScheduleBreakdown(classes), [classes]);
  const times = React.useMemo(() => getTimesFromClasses(classes), [classes]);

  if (classes.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-muted">No classes available.</p>
      </section>
    );
  }

  if (times.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-muted">Classes exist, but no schedules have been assigned yet.</p>
      </section>
    );
  }

  const renderUnscheduled = () => {
    if (schedule.unscheduled.length === 0) {
      return null;
    }
    return (
      <section className="rounded-3xl border border-dashed border-brand-primary/20 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-primary-dark">Unscheduled classes</h2>
        <p className="text-sm text-neutral-muted">These classes do not yet have a weekly schedule assigned.</p>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {schedule.unscheduled.map((classItem) => (
            <li key={`unscheduled-${classItem.id}`} className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-brand-primary-dark">{classItem.name}</h3>
                <p className="text-xs uppercase text-brand-primary/70">
                  {classItem.level ? `Section ${classItem.level}` : "No section"}
                  {classItem.teacherName ? ` • Teacher ${classItem.teacherName}` : " • Teacher unassigned"}
                </p>
              </div>
              <div className="mt-3 space-y-1 text-sm text-neutral-800">
                {classItem.roster.length === 0 ? (
                  <p className="text-neutral-muted">No students assigned.</p>
                ) : (
                  classItem.roster.map((student) => (
                    <p key={`unscheduled-${classItem.id}-${student.user_id}`} className="font-medium text-brand-primary-dark">
                      {student.full_name ?? "Unnamed student"}
                    </p>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8 print:hidden">
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${DAY_COLUMNS_COUNT}, ${DAY_COLUMN_WIDTH}px)`,
              gridTemplateRows: `auto repeat(${times.length}, minmax(240px, auto))`,
              columnGap: COLUMN_GAP,
              rowGap: COLUMN_GAP,
              minWidth: GRID_MIN_WIDTH,
            }}
          >
            <div className="sticky top-0 z-10 bg-white/90 px-4 py-3" />
            {DISPLAY_DAYS.map((day) => (
              <div
                key={`header-${day}`}
                className="sticky top-0 z-10 border-b border-brand-primary/20 bg-white/90 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-brand-primary/70"
                style={{ gridColumn: "span 2" }}
              >
                {DAY_ABBREVIATIONS[day]}
              </div>
            ))}

            {times.map((startTime) => (
              <React.Fragment key={startTime}>
                <div className="border-b border-brand-primary/10 px-4 py-4 text-sm font-semibold text-brand-primary-dark">
                  {timeLabel(startTime)}
                </div>
                {DISPLAY_DAYS.map((day) => {
                  const events = getSlotEvents(schedule.slots, day, startTime);
                  return (
                    <div
                      key={`${day}-${startTime}`}
                      className="border-b border-brand-primary/10 px-2 py-3"
                      style={{ gridColumn: "span 2" }}
                    >
                      {events.length === 0 ? (
                        <div className="h-full rounded-2xl border border-dashed border-brand-primary/10 bg-white/40 text-center text-xs text-neutral-muted">
                          <div className="flex h-full items-center justify-center">—</div>
                        </div>
                      ) : (
                        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                          {events.map((event) => (
                            <ClassCard key={event.classId} event={event} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {renderUnscheduled()}
      </div>

      <div className="print:block print-roster-page">
        {times.length === 0 ? (
          <p className="text-sm text-neutral-muted">No scheduled classes.</p>
        ) : (
          times.map((startTime) => (
            <section key={`print-row-${startTime}`} className="rounded-3xl border border-brand-primary/10 bg-white p-4 shadow-sm break-inside-avoid">
              <h2 className="text-base font-semibold uppercase tracking-wide text-brand-primary/70">{timeLabel(startTime)}</h2>
              <div
                className="mt-4 grid gap-3"
                style={{ gridTemplateColumns: `repeat(${DISPLAY_DAYS.length}, 1fr)` }}
              >
                {DISPLAY_DAYS.map((day) => {
                  const events = getSlotEvents(schedule.slots, day, startTime);
                  return (
                    <div key={`print-${day}-${startTime}`} className="rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-3">
                      <h3 className="text-sm font-semibold text-brand-primary-dark">{DAY_ABBREVIATIONS[day]}</h3>
                      <div className="mt-2 space-y-2 text-xs text-neutral-800">
                        {events.length === 0 ? (
                          <p className="text-neutral-muted">No class</p>
                        ) : (
                          events.map((event) => (
                            <article key={`print-${event.classId}`} className="rounded-xl border border-brand-primary/10 bg-white/90 p-2">
                              <p className="font-semibold text-brand-primary-dark">{event.className}</p>
                              <p className="text-[11px] text-brand-primary/70">
                                {event.teacherName ? `Teacher ${event.teacherName}` : "Teacher unassigned"}
                                {event.level ? ` • Section ${event.level}` : ""}
                              </p>
                              <div className="mt-1 text-[11px] text-neutral-800">
                                {event.roster.length === 0 ? (
                                  <p className="text-neutral-muted">No students yet.</p>
                                ) : (
                                  <ul className="mt-1 grid grid-cols-1 gap-y-1 print:grid-cols-1">
                                    {event.roster.map((student) => (
                                      <li key={`print-${event.classId}-${student.user_id}`}>{student.full_name ?? "Unnamed student"}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {renderUnscheduled()}
      </div>
    </div>
  );
};

export default ClassRosterGrid;
