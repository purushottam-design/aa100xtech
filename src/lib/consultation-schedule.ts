import { site } from "@/data/site";
const durations: Record<string, number> = {
  quick: 15,
  standard: 30,
  professional: 60,
  premium: 90,
  enterprise: 120,
  executive: 180,
};
type Schedule = {
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  planId: string;
};
function parts(timestamp: number, timeZone: string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(timestamp)
      .map((p) => [p.type, p.value]),
  );
}
export function consultationDateToday(timeZone: string, now = Date.now()): string | undefined {
  try {
    const local = parts(now, timeZone);
    return `${local["year"]}-${local["month"]}-${local["day"]}`;
  } catch {
    return undefined;
  }
}
export function consultationScheduleError(input: Schedule, now = Date.now()): string | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) ||
    !/^\d{2}:\d{2}$/.test(input.preferredTime)
  )
    return "Choose a valid consultation date and time.";
  try {
    const naive = Date.parse(`${input.preferredDate}T${input.preferredTime}:00Z`);
    if (!Number.isFinite(naive)) throw new Error();
    let instant = naive;
    for (let i = 0; i < 3; i++) {
      const local = parts(instant, input.timezone);
      const represented = Date.parse(
        `${local["year"]}-${local["month"]}-${local["day"]}T${local["hour"]}:${local["minute"]}:00Z`,
      );
      instant += naive - represented;
    }
    const chosen = parts(instant, input.timezone);
    if (
      `${chosen["year"]}-${chosen["month"]}-${chosen["day"]}` !== input.preferredDate ||
      `${chosen["hour"]}:${chosen["minute"]}` !== input.preferredTime
    )
      throw new Error();
    if (instant <= now) return "Choose a consultation time in the future.";
    const business = parts(instant, site.businessHours.timeZone);
    const minute = Number(business["hour"]) * 60 + Number(business["minute"]);
    const duration = durations[input.planId];
    if (!duration) return "Choose an available consultation plan.";
    if (minute < site.businessHours.start * 60 || minute + duration > site.businessHours.end * 60)
      return `Choose a slot that fits within ${site.hours} (${site.businessHours.timeZone}).`;
    return null;
  } catch {
    return "Choose a valid date, time and time zone.";
  }
}
