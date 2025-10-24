import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { refreshAccessToken } from "./oauth";
import { getGoogleTokenRecord, updateGoogleToken } from "./tokenStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedClient = SupabaseClient<Database, any, any>;

export type ClassroomCourse = {
  id: string;
  name: string;
  section?: string | null;
  descriptionHeading?: string | null;
  alternateLink?: string | null;
  courseState?: string | null;
  room?: string | null;
};

export type ClassroomCourseWork = {
  id: string;
  courseId: string;
  title: string;
  alternateLink?: string | null;
  dueDate?: string | null;
  state?: string | null;
};

type ClassroomData = {
  courses: ClassroomCourse[];
  courseWork: Record<string, ClassroomCourseWork[]>;
};

const CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";

const fetchWithAuth = async (accessToken: string, input: string, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    const error = new Error("unauthorized");
    (error as Error & { code?: string }).code = "unauthorized";
    throw error;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = typeof body.error?.message === "string" ? body.error.message : "Classroom request failed.";
    const err = new Error(message);
    (err as Error & { code?: string }).code = "request_failed";
    throw err;
  }

  return response.json();
};

const parseDueDate = (courseWork: Record<string, unknown>): string | null => {
  const dueDateValue = courseWork.dueDate;
  if (!dueDateValue || typeof dueDateValue !== "object") {
    return null;
  }
  try {
    const dueDate = dueDateValue as { year?: number; month?: number; day?: number };
    const year = typeof dueDate.year === "number" ? dueDate.year : 0;
    const month = typeof dueDate.month === "number" ? dueDate.month : 1;
    const day = typeof dueDate.day === "number" ? dueDate.day : 1;
    const dueTimeValue = courseWork.dueTime;
    const dueTime =
      dueTimeValue && typeof dueTimeValue === "object"
        ? (dueTimeValue as { hours?: number; minutes?: number })
        : {};
    const hour = typeof dueTime.hours === "number" ? dueTime.hours : 0;
    const minute = typeof dueTime.minutes === "number" ? dueTime.minutes : 0;
    const due = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
    if (Number.isNaN(due.getTime())) {
      return null;
    }
    return due.toISOString();
  } catch {
    return null;
  }
};

const shouldRefresh = (expiresAt: string | null) => {
  if (!expiresAt) {
    return true;
  }
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) {
    return true;
  }
  return expiry - Date.now() < 60_000;
};

type EnsureTokenResult =
  | { accessToken: string; refreshed: boolean }
  | { accessToken: null; refreshed: false; needsReconnect: boolean };

const ensureFreshAccessToken = async (
  client: TypedClient,
  userId: string,
  existingToken: NonNullable<Awaited<ReturnType<typeof getGoogleTokenRecord>>>,
): Promise<EnsureTokenResult> => {
  if (!shouldRefresh(existingToken.expires_at ?? null) && existingToken.access_token) {
    return { accessToken: existingToken.access_token, refreshed: false };
  }

  if (!existingToken.refresh_token) {
    return { accessToken: null, refreshed: false, needsReconnect: true };
  }

  const refreshed = await refreshAccessToken(existingToken.refresh_token);
  await updateGoogleToken(client, userId, {
    access_token: refreshed.access_token,
    expires_in: refreshed.expires_in,
    scope: refreshed.scope,
    token_type: refreshed.token_type,
    refresh_token: refreshed.refresh_token ?? undefined,
  });

  return { accessToken: refreshed.access_token, refreshed: true };
};

export const fetchClassroomOverview = async (
  client: TypedClient,
  userId: string,
): Promise<
  | ({ connected: false; needsReconnect: boolean; error?: string })
  | ({ connected: true; data: ClassroomData; refreshed: boolean })
> => {
  const token = await getGoogleTokenRecord(client, userId);
  if (!token || !token.access_token) {
    return { connected: false, needsReconnect: false };
  }

  let accessToken = token.access_token;
  let refreshed = false;

  try {
    const result = await ensureFreshAccessToken(client, userId, token);
    if (!result.accessToken) {
      return { connected: false, needsReconnect: true };
    }
    if (result.refreshed) {
      refreshed = true;
      accessToken = result.accessToken;
    } else {
      accessToken = result.accessToken;
    }
  } catch (error) {
    console.error("fetchClassroomOverview: token refresh failed", error);
    return { connected: false, needsReconnect: true, error: "We couldn’t refresh your Google connection." };
  }

  try {
    const coursesResponse = await fetchWithAuth(
      accessToken,
      `${CLASSROOM_API_BASE}/courses?courseStates=ACTIVE&pageSize=20`,
    );
    const rawCourses = Array.isArray(coursesResponse.courses)
      ? (coursesResponse.courses as Record<string, unknown>[])
      : [];

    const courses = rawCourses.reduce<ClassroomCourse[]>((acc, course) => {
      const id = typeof course.id === "string" ? course.id : null;
      if (!id) {
        return acc;
      }
      const name = typeof course.name === "string" ? course.name : "Untitled course";
      const section = typeof course.section === "string" ? course.section : null;
      const descriptionHeading =
        typeof course.descriptionHeading === "string" ? course.descriptionHeading : null;
      const alternateLink = typeof course.alternateLink === "string" ? course.alternateLink : null;
      const courseState = typeof course.courseState === "string" ? course.courseState : null;
      const room = typeof course.room === "string" ? course.room : null;

      acc.push({
        id,
        name,
        section,
        descriptionHeading,
        alternateLink,
        courseState,
        room,
      });
      return acc;
    }, []);

    const courseWork: Record<string, ClassroomCourseWork[]> = {};

    await Promise.all(
      courses.map(async (course) => {
        try {
          const courseWorkResponse = await fetchWithAuth(
            accessToken,
            `${CLASSROOM_API_BASE}/courses/${course.id}/courseWork?pageSize=10`,
          );
          const rawCourseWork = Array.isArray(courseWorkResponse.courseWork)
            ? (courseWorkResponse.courseWork as Record<string, unknown>[])
            : [];
          const items = rawCourseWork.reduce<ClassroomCourseWork[]>((acc, item) => {
            const id = typeof item.id === "string" ? item.id : null;
            if (!id) {
              return acc;
            }
            const title = typeof item.title === "string" ? item.title : "Untitled assignment";
            const alternateLink = typeof item.alternateLink === "string" ? item.alternateLink : null;
            const state = typeof item.state === "string" ? item.state : null;
            if (state === "DELETED") {
              return acc;
            }

            acc.push({
              id,
              courseId: course.id,
              title,
              alternateLink,
              dueDate: parseDueDate(item),
              state,
            });
            return acc;
          }, []);

          courseWork[course.id] = items;
        } catch (courseWorkError) {
          console.error(`fetchClassroomOverview: failed to load coursework for course ${course.id}`, courseWorkError);
          courseWork[course.id] = [];
        }
      }),
    );

    return { connected: true, data: { courses, courseWork }, refreshed };
  } catch (error) {
    console.error("fetchClassroomOverview: failed to load classroom data", error);
    const errCode = (error as Error & { code?: string }).code;
    if (errCode === "unauthorized") {
      return { connected: false, needsReconnect: true, error: "Google access expired. Please reconnect Classroom." };
    }
    return { connected: false, needsReconnect: true, error: "Unable to load Google Classroom data right now." };
  }
};
