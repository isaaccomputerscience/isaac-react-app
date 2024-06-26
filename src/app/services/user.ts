import { api, isDefined } from "./";
import { LoggedInUser, PotentialUser, School } from "../../IsaacAppTypes";
import { Immutable } from "immer";
import { Role } from "../../IsaacApiTypes";
import { throttle } from "lodash";

export type UserRoleAndLoggedInStatus = {
  readonly role?: Role;
  readonly loggedIn?: boolean;
};

export function isLoggedIn(user?: Immutable<PotentialUser> | null): user is Immutable<LoggedInUser> {
  return user ? user.loggedIn : false;
}

export function isStudent(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "STUDENT" && (user.loggedIn ?? true);
}

export function isTutor(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "TUTOR" && (user.loggedIn ?? true);
}

export function isTutorOrAbove(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role !== "STUDENT" && (user.loggedIn ?? true);
}

export function isTeacher(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "TEACHER" && (user.loggedIn ?? true);
}

export function isTeacherPending(
  user?: { readonly role?: Role; readonly loggedIn?: boolean; readonly teacherPending?: boolean } | null,
): boolean {
  return isDefined(user) && user.teacherPending === true && (user.loggedIn ?? true);
}

export function isTeacherOrAbove(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role !== "STUDENT" && user.role !== "TUTOR" && (user.loggedIn ?? true);
}

export function isAdmin(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "ADMIN" && (user.loggedIn ?? true);
}

export function isEventManager(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "EVENT_MANAGER" && (user.loggedIn ?? true);
}

export function isStaff(user?: UserRoleAndLoggedInStatus | null): boolean {
  return (
    isDefined(user) &&
    (user.role === "ADMIN" || user.role === "EVENT_MANAGER" || user.role === "CONTENT_EDITOR") &&
    (user.loggedIn ?? true)
  );
}

export function isEventLeader(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isDefined(user) && user.role === "EVENT_LEADER" && (user.loggedIn ?? true);
}

export function isEventLeaderOrStaff(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isEventLeader(user) || isStaff(user);
}

export function isAdminOrEventManager(user?: UserRoleAndLoggedInStatus | null): boolean {
  return isAdmin(user) || isEventManager(user);
}

export const roleRequirements: Record<Role, (u: UserRoleAndLoggedInStatus | null) => boolean> = {
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

const schoolSearch = (
  schoolSearchText: string,
  setAsyncSelectOptionsCallback: (options: { value: string | School; label: string | undefined }[]) => void,
) => {
  api.schools
    .search(schoolSearchText)
    .then(({ data }) => {
      setAsyncSelectOptionsCallback(
        data && data.length > 0 ? data.map((item) => ({ value: item, label: schoolNameWithPostcode(item) })) : [],
      );
    })
    .catch((response) => {
      console.error("Error searching for schools. ", response);
    });
};

export const throttledSchoolSearch = throttle(schoolSearch, 450, { trailing: true, leading: true });
