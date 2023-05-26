export enum SITE {CS = "cs"}

export const SITE_SUBJECT = ISAAC_SITE as SITE;

// Boolean representing if the current site is Isaac Physics - temporary until we can remove all Physics-specific code
export const isPhy = false;

// Boolean representing if the current site is Isaac CS
export const isCS = SITE_SUBJECT === SITE.CS;

export const SITE_SUBJECT_TITLE = "Computer Science";

export const WEBMASTER_EMAIL = "webmaster@isaaccomputerscience.org";

export const TEACHER_REQUEST_ROUTE = "/pages/teacher_accounts";
