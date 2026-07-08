/**
 * TODO(#855) TEMPORARY diagnostic logging.
 *
 * Unconditional console output used to trace, in the browser, exactly what the code sees while we
 * debug why VIDEO_60_PERCENT_WATCHED is not reaching the backend: the auth/user state on every
 * page, every event POSTed to /log (payload + result), and the video-KPI decision path including
 * the conditions that gate whether an event is sent or skipped.
 *
 * This is intentionally always-on (not behind a flag) and never logs PII beyond user id + role.
 * Remove this file and all `debugLog(` call sites before the production release.
 */
export function debugLog(scope: string, message: string, data?: unknown): void {
  try {
    // eslint-disable-next-line no-console
    console.info(`[${scope}] ${message}`, data ?? "");
  } catch {
    // ignore (e.g. console unavailable)
  }
}
