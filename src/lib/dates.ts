/** Day keys are YYYY-MM-DD strings in the user's own timezone. */

export function dayKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export function todayKey(timeZone: string) {
  return dayKey(new Date(), timeZone)
}

function keyToUtc(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(key: string, n: number) {
  return new Date(keyToUtc(key) + n * 86_400_000).toISOString().slice(0, 10)
}

export function daysBetween(fromKey: string, toKey: string) {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: string) {
  return new Date(keyToUtc(key)).getUTCDay()
}

export function lastNDays(endKey: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(endKey, i - (n - 1)))
}

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export function shortWeekday(key: string) {
  return SHORT[weekday(key)]
}

export function longDate(key: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(keyToUtc(key))
  )
}

export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(date)
}

/** Next Sunday strictly after the given day key, as a Date at UTC midnight. */
export function nextSunday(key: string) {
  const w = weekday(key)
  return new Date(keyToUtc(addDays(key, w === 0 ? 7 : 7 - w)))
}

export function keyToDate(key: string) {
  return new Date(keyToUtc(key))
}

export function isToday(date: Date, timeZone: string) {
  return dayKey(date, timeZone) === todayKey(timeZone)
}

/** A safe lower bound for "today" in any timezone: 36 hours ago. Filter precisely with isToday. */
export function aroundToday() {
  return new Date(Date.now() - 36 * 3_600_000)
}
