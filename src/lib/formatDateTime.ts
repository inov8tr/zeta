export function formatDateTime(
  value: string | null | undefined,
  timezone?: string | null,
  overrides?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return null;
  }
  try {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) {
      return null;
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone ?? undefined,
      ...overrides,
    });
    return formatter.format(dt);
  } catch {
    return null;
  }
}
