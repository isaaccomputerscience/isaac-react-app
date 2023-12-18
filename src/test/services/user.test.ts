import { USER_ROLES, UserRole } from "../../IsaacApiTypes";
import {
  extractTeacherName,
  isAdmin,
  isAdminOrEventManager,
  isEventLeader,
  isEventLeaderOrStaff,
  isEventManager,
  isLoggedIn,
  isStaff,
  isStudent,
  isTeacher,
  isTeacherOrAbove,
  isTeacherPending,
  isTutor,
  isTutorOrAbove,
  roleRequirements,
  schoolNameWithPostcode,
} from "../../app/services/user";
import { School } from "../../IsaacAppTypes";
import { mockUser } from "../../mocks/data";

const generateTestCases = (functionName: string) => {
  const roleRequirements: Record<UserRole, string[]> = {
    STUDENT: ["isStudent"],
    TUTOR: ["isTutorOrAbove", "isTutor"],
    TEACHER: ["isTeacherOrAbove", "isTeacher", "isTutorOrAbove"],
    EVENT_LEADER: ["isEventLeader", "isTeacherOrAbove", "isTutorOrAbove", "isEventLeaderOrStaff"],
    CONTENT_EDITOR: ["isStaff", "isTeacherOrAbove", "isTutorOrAbove", "isEventLeaderOrStaff"],
    EVENT_MANAGER: [
      "isEventManager",
      "isStaff",
      "isTeacherOrAbove",
      "isTutorOrAbove",
      "isEventLeaderOrStaff",
      "isAdminOrEventManager",
    ],
    ADMIN: [
      "isAdmin",
      "isStaff",
      "isTeacherOrAbove",
      "isTutorOrAbove",
      "isEventLeaderOrStaff",
      "isAdminOrEventManager",
    ],
  };

  const generateTestCase = (
    role: UserRole,
  ): {
    role: UserRole | undefined | null;
    value: { role: UserRole; loggedIn: boolean } | undefined | null;
    expected: boolean;
  } => {
    const value = { role, loggedIn: true };
    const expected = roleRequirements[role].includes(functionName);
    return { role, value, expected };
  };

  const testCases = USER_ROLES.map(generateTestCase);
  testCases.push({ role: undefined, value: undefined, expected: false }, { role: null, value: null, expected: false });

  return testCases;
};

describe("User Checks", () => {
  describe("isStudent function", () => {
    const testCases = generateTestCases("isStudent");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isStudent(value)).toBe(expected);
    });
  });

  describe("isTutor function", () => {
    const testCases = generateTestCases("isTutor");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isTutor(value)).toBe(expected);
    });
  });

  describe("isTeacher function", () => {
    const testCases = generateTestCases("isTeacher");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isTeacher(value)).toBe(expected);
    });
  });

  describe("isEventLeader function", () => {
    const testCases = generateTestCases("isEventLeader");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isEventLeader(value)).toBe(expected);
    });
  });

  describe("isEventManager function", () => {
    const testCases = generateTestCases("isEventManager");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isEventManager(value)).toBe(expected);
    });
  });

  describe("isAdmin function", () => {
    const testCases = generateTestCases("isAdmin");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isAdmin(value)).toBe(expected);
    });
  });

  describe("isTutorOrAbove function", () => {
    const testCases = generateTestCases("isTutorOrAbove");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isTutorOrAbove(value)).toBe(expected);
    });
  });

  describe("isTeacherOrAbove function", () => {
    const testCases = generateTestCases("isTeacherOrAbove");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isTeacherOrAbove(value)).toBe(expected);
    });
  });

  describe("isStaff function", () => {
    const testCases = generateTestCases("isStaff");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isStaff(value)).toBe(expected);
    });
  });

  describe("isEventLeaderOrStaff function", () => {
    const testCases = generateTestCases("isEventLeaderOrStaff");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isEventLeaderOrStaff(value)).toBe(expected);
    });
  });

  describe("isAdminOrEventManager function", () => {
    const testCases = generateTestCases("isAdminOrEventManager");
    it.each(testCases)(`returns $expected for $role`, ({ value, expected }) => {
      expect(isAdminOrEventManager(value)).toBe(expected);
    });
  });

  describe("Role Requirements function", () => {
    USER_ROLES.forEach((role) => {
      const user = { role, loggedIn: true };

      it(`should correctly check ${role} role`, () => {
        const requirementFunction = roleRequirements[role];
        expect(requirementFunction(user)).toBe(true);
      });
    });

    it("should handle null user", () => {
      const requirementFunction = roleRequirements["STUDENT"];
      expect(requirementFunction(null)).toBe(false);
    });
  });

  describe("extractTeacherName function", () => {
    it("should return null for null input", () => {
      const result = extractTeacherName(null);
      expect(result).toBe(null);
    });

    it("should return null for undefined input", () => {
      const result = extractTeacherName(undefined);
      expect(result).toBe(null);
    });

    it("should return the formatted teacher name (e.g. `J. Doe`) when given both givenName and familyName", () => {
      const teacher = { givenName: "John", familyName: "Doe" };
      const result = extractTeacherName(teacher);
      expect(result).toBe("J. Doe");
    });

    it("should return only the familyName if givenName is not provided", () => {
      const teacher = { familyName: "Doe" };
      const result = extractTeacherName(teacher);
      expect(result).toBe("Doe");
    });
  });

  describe("schoolNameWithPostcode function", () => {
    const mockSchool: School = {
      urn: "12345",
      name: "Example School",
      postcode: "AB12 3CD",
      closed: false,
      dataSource: "MockDataSource",
    };

    it("should return the school name and postcode when both are provided", () => {
      const result = schoolNameWithPostcode(mockSchool);
      expect(result).toBe(mockSchool.name + ", " + mockSchool.postcode);
    });

    it("should return the school name if no postcode is provided", () => {
      const result = schoolNameWithPostcode({ ...mockSchool, postcode: "" });
      expect(result).toBe(mockSchool.name);
    });
  });

  describe("isLoggedIn function", () => {
    it("should return true for a logged-in user", () => {
      const result = isLoggedIn({ ...mockUser, loggedIn: true });
      expect(result).toBe(true);
    });

    it("should return false for a logged-out user", () => {
      const result = isLoggedIn({ loggedIn: false });
      expect(result).toBe(false);

      const resultWithUser = isLoggedIn({ ...mockUser, loggedIn: false });
      expect(resultWithUser).toBe(false);
    });

    it("should return false for null or undefined user", () => {
      const resultNull = isLoggedIn(null);
      const resultUndefined = isLoggedIn(undefined);

      expect(resultNull).toBe(false);
      expect(resultUndefined).toBe(false);
    });
  });

  describe("isTeacherPending function", () => {
    it("should return true for a logged-in user with teacherPending true", () => {
      const result = isTeacherPending({ ...mockUser, teacherPending: true, loggedIn: true });
      expect(result).toBe(true);
    });

    it("should return false for a logged-in user with teacherPending false", () => {
      const result = isTeacherPending({ ...mockUser, loggedIn: true });
      expect(result).toBe(false);
    });

    it("should return false for null or undefined user", () => {
      const resultNull = isTeacherPending(null);
      const resultUndefined = isTeacherPending(undefined);

      expect(resultNull).toBe(false);
      expect(resultUndefined).toBe(false);
    });
  });
});
