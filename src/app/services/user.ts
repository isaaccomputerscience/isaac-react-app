import { isDefined } from "./";
import { LoggedInUser, PotentialUser, School } from "../../IsaacAppTypes";
import { UserRole } from "../../IsaacApiTypes";
import { Immutable } from "immer";

type UserType = {
  readonly role?: UserRole;
  readonly loggedIn?: boolean;
};

export function isLoggedIn(user?: Immutable<PotentialUser> | null): user is Immutable<LoggedInUser> {
  return user ? user.loggedIn : false;
}

export function isStudent(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "STUDENT" && (user.loggedIn ?? true);
}

export function isTutor(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "TUTOR" && (user.loggedIn ?? true);
}

export function isTutorOrAbove(user?: UserType | null): boolean {
  return isDefined(user) && user.role !== "STUDENT" && (user.loggedIn ?? true);
}

export function isTeacher(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "TEACHER" && (user.loggedIn ?? true);
}

export function isTeacherPending(
  user?: { readonly role?: UserRole; readonly loggedIn?: boolean; readonly teacherPending?: boolean } | null,
): boolean {
  return isDefined(user) && user.teacherPending === true && (user.loggedIn ?? true);
}

export function isTeacherOrAbove(user?: UserType | null): boolean {
  return isDefined(user) && user.role !== "STUDENT" && user.role !== "TUTOR" && (user.loggedIn ?? true);
}

export function isAdmin(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "ADMIN" && (user.loggedIn ?? true);
}

export function isEventManager(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "EVENT_MANAGER" && (user.loggedIn ?? true);
}

export function isStaff(user?: UserType | null): boolean {
  return (
    isDefined(user) &&
    (user.role === "ADMIN" || user.role === "EVENT_MANAGER" || user.role === "CONTENT_EDITOR") &&
    (user.loggedIn ?? true)
  );
}

export function isEventLeader(user?: UserType | null): boolean {
  return isDefined(user) && user.role === "EVENT_LEADER" && (user.loggedIn ?? true);
}

export function isEventLeaderOrStaff(user?: UserType | null): boolean {
  return isEventLeader(user) || isStaff(user);
}

export function isAdminOrEventManager(user?: UserType | null): boolean {
  return isAdmin(user) || isEventManager(user);
}

export const roleRequirements: Record<UserRole, (u: UserType | null) => boolean> = {
  STUDENT: isStudent,
  TUTOR: isTutorOrAbove,
  TEACHER: isTeacherOrAbove,
  EVENT_LEADER: isEventLeaderOrStaff,
  CONTENT_EDITOR: isStaff,
  EVENT_MANAGER: isEventManager,
  ADMIN: isAdmin,
};

export function extractTeacherName(
  teacher: { readonly givenName?: string; readonly familyName?: string } | null | undefined,
): string | null {
  if (null == teacher) {
    return null;
  }
  return (teacher.givenName ? teacher.givenName.charAt(0) + ". " : "") + teacher.familyName;
}

export function schoolNameWithPostcode(schoolResult: School): string | undefined {
  let schoolName = schoolResult.name;
  if (schoolResult.postcode) {
    schoolName += ", " + schoolResult.postcode;
  }
  return schoolName;
}
