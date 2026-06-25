// NOTE: All code must stay in English, even when requirements arrive in Spanish.

export const DOCS_PATH = "/docs";

/** Routes that should not show in-game weather visuals or HUD weather UI. */
export function isDocsRoute(pathname: string): boolean {
  return pathname === DOCS_PATH || pathname.startsWith(`${DOCS_PATH}/`);
}
