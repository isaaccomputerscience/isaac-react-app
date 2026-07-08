import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { selectors, useAppSelector } from "../../state";
import { debugLog } from "../../services";

/**
 * TODO(#855) TEMPORARY diagnostic component.
 *
 * Logs the app's auth/user view on every navigation (and whenever the user state changes) so we can
 * see, per page, whether the app considers the user logged in. This is what gates the video KPI:
 * `loggedInOrNull === null` ⇒ IsaacVideo `userStorageScope === null` ⇒ 60% tracking disabled.
 *
 * Renders nothing. Remove before the production release.
 */
export const AuthDebugLogger = () => {
  const location = useLocation();
  const user = useAppSelector(selectors.user.orNull);
  const loggedInUser = useAppSelector(selectors.user.loggedInOrNull);

  useEffect(() => {
    const userId = loggedInUser ? loggedInUser.id : undefined;
    const userStorageScope = userId == null ? null : String(userId);
    debugLog("auth", "page visit", {
      path: location.pathname,
      loggedIn: user?.loggedIn ?? null,
      requesting: (user as { requesting?: boolean } | null)?.requesting ?? false,
      userId,
      role: loggedInUser ? loggedInUser.role : undefined,
      loggedInOrNull: loggedInUser ? userId : null,
      // exactly what IsaacVideo computes; null here means the 60% KPI is disabled on this page
      userStorageScope,
      videoKpiEnabled: Boolean(userStorageScope),
    });
  }, [location.pathname, user, loggedInUser]);

  return null;
};
