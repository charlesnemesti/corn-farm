// NOTE: All code must stay in English, even when requirements arrive in Spanish.

/** Master switch for ?debug=1 calibrator and dev tools. Set true when re-enabling locally. */
export const DEBUG_TOOLS_ENABLED = false;

export function isDebugModeActive(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  if (!DEBUG_TOOLS_ENABLED) return false;
  return searchParams?.get("debug") === "1";
}
