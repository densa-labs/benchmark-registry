export function formatBuildTime(timestamp: string, timeZone = "UTC"): string {
  const instant = new Date(`${timestamp.replace(" ", "T")}Z`);
  if (Number.isNaN(instant.getTime())) return timestamp;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZoneName: "shortOffset",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const offset = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/u.exec(value("timeZoneName"));
  const zone = offset?.[1] ? `UTC${offset[1]}${offset[2].padStart(2, "0")}:${offset[3] ?? "00"}` : "UTC+00:00";
  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}:${value("second")} ${zone}`;
}

export function viewerTimeZone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
