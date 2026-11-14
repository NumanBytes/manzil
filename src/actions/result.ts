export type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string }

export function fail(error: string) {
  return { success: false as const, error }
}
