import { UserRole } from "../../IsaacApiTypes";
import { AdminUserManager } from "../../app/components/pages/AdminUserManager";
import { checkPageTitle, renderTestEnvironment, getById, clickButton } from "../utils";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import * as actions from "../../app/state/actions";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { buildMockStudent, buildMockTeacher, mockUser } from "../../mocks/data";
import userEvent from "@testing-library/user-event";
import { store } from "../../app/state";
import { FRIENDLY_DATE_AND_TIME } from "../../app/components/elements/DateString";

const adminSearchSpy = jest.spyOn(actions, "adminUserSearchRequest");

const findSearchFields = (): Record<string, HTMLElement> => {
  const searchForm = screen.getByRole("form");
  const familyName = screen.getByRole("textbox", {
    name: /find a user by family name:/i,
  });
  const email = screen.getByRole("textbox", {
    name: /find a user by email:/i,
  });
  const schoolOther = screen.getByRole("textbox", {
    name: /find by manually entered school:/i,
  });
  const role = screen.getByRole("combobox", {
    name: /find by user role:/i,
  });
  const postcode = screen.getByRole("textbox", {
    name: /find users with school within a given distance of postcode:/i,
  });
  const postcodeRadius = getById("postcode-radius-search");
  const schoolURN = screen.getByRole("textbox", { name: /find a user with school URN/i });
  const searchButton = screen.getByRole("button", { name: "Search" });

  return {
    searchForm,
    familyName,
    email,
    schoolOther,
    role,
    postcode,
    postcodeRadius,
    schoolURN,
    searchButton,
  };
};

describe("Admin User Manager", () => {
  const renderUserManager = async ({ role = "ADMIN" }: { role?: UserRole } = {}) => {
    renderTestEnvironment({
      role: role,
      PageComponent: AdminUserManager,
      initialRouteEntries: ["/admin/usermanager"],
      extraEndpoints: [
        rest.get(API_PATH + "/admin/users", (req, res, ctx) => {
          const mockAdminSearchResults = [mockUser, buildMockStudent(101), buildMockTeacher(102)];
          return res(ctx.status(200), ctx.json(mockAdminSearchResults));
        }),
        rest.get(API_PATH + "/users/school_lookup", (req, res, ctx) => {
          const mockSchoolLookup = {
            "1": { name: "Test School" },
            "101": { name: "N/A" },
            "102": { name: "N/A" },
          };
          return res(ctx.status(200), ctx.json(mockSchoolLookup));
        }),
      ],
    });
    await waitFor(() => {
      const userState = store.getState().user;
      expect(userState?.loggedIn).toBe(true);
    });
  };

  describe("Search section", () => {
    it("renders with expected page title and has all expected fields", async () => {
      await renderUserManager();
      checkPageTitle("User manager");
      const { searchForm, familyName, email, schoolOther, role, postcode, postcodeRadius, schoolURN, searchButton } =
        findSearchFields();
      [searchForm, familyName, email, schoolOther, role, postcode, postcodeRadius, schoolURN, searchButton].forEach(
        (input) => expect(input).toBeInTheDocument(),
      );
      const expectedRadiusOptions = ["5 miles", "10 miles", "15 miles", "20 miles", "25 miles", "50 miles"];
      const radiusOptions = within(postcodeRadius).getAllByRole("option");
      radiusOptions.forEach((option, index) => {
        expect(option).toHaveTextContent(expectedRadiusOptions[index]);
      });
      const expectedRoleOptions = [
        "Any role",
        "Student",
        "Teacher",
        "Content editor",
        "Event leader",
        "Event manager",
        "Admin",
      ];
      const roleOptions = within(role).getAllByRole("option");
      roleOptions.forEach((option, index) => expect(option).toHaveTextContent(expectedRoleOptions[index]));
    });

    it("searches if search button is pressed", async () => {
      await renderUserManager();
      await clickButton("Search");
      expect(adminSearchSpy).toHaveBeenCalled();
    });

    const textSearchCases = [
      { fieldName: "familyName", testValue: "Smith" },
      { fieldName: "email", testValue: "user@example.com" },
      { fieldName: "schoolOther", testValue: "SchoolA" },
      { fieldName: "schoolURN", testValue: "123456" },
      { fieldName: "postcode", testValue: "ABC 123" },
    ];
    it.each(textSearchCases)(
      "searches with $fieldName if this text field is changed",
      async ({ fieldName, testValue }) => {
        await renderUserManager();
        const { [fieldName]: inputField } = findSearchFields();
        fireEvent.change(inputField, { target: { value: testValue } });
        await clickButton("Search");
        expect(adminSearchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            [fieldName]: testValue,
          }),
        );
      },
    );

    const dropdownSearchCases = [
      { fieldName: "role", testValue: "STUDENT" },
      { fieldName: "postcodeRadius", testValue: "TEN_MILES" },
    ];

    it.each(dropdownSearchCases)(
      "searches with $fieldName if this dropdown is changed",
      async ({ fieldName, testValue }) => {
        await renderUserManager();
        const { [fieldName]: dropdown } = findSearchFields();
        await userEvent.selectOptions(dropdown, testValue);
        await clickButton("Search");
        expect(adminSearchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            [fieldName]: testValue,
          }),
        );
      },
    );

    it("searches with null if user clears a text box", async () => {
      await renderUserManager();
      const { familyName } = findSearchFields();
      await userEvent.type(familyName, "Smith");
      await clickButton("Search");
      expect(adminSearchSpy).toHaveBeenCalledWith(expect.objectContaining({ familyName: "Smith" }));
      await userEvent.clear(familyName);
      await clickButton("Search");
      expect(adminSearchSpy).toHaveBeenCalledWith(expect.objectContaining({ familyName: null }));
    });
  });

  describe("Manage users section", () => {
    const adminButtons = () => {
      const modifyRole = screen.getByRole("button", { name: /modify role/i });
      const emailStatus = screen.queryByRole("button", { name: /email status/i });
      const teacherUpgrade = screen.getByRole("button", { name: /decline teacher upgrade/i });
      const email = screen.getByRole("link", { name: /email/i });

      return { modifyRole, emailStatus, teacherUpgrade, email };
    };

    const searchAndWaitForResults = async () => {
      await clickButton("Search");
      const resultsTable = within(getById("admin-search-results")).getByRole("table");
      expect(resultsTable).toBeInTheDocument();
      const tableRows = within(resultsTable).getAllByRole("row");
      const firstUserDetails = within(tableRows[1]).getAllByRole("cell");
      return { resultsTable, tableRows, firstUserDetails };
    };
    it("shows Manage Users heading and expected buttons", async () => {
      await renderUserManager();
      const heading = screen.getByRole("heading", { name: "Manage users (0) Selected (0)" });
      expect(heading).toBeInTheDocument();
      const { modifyRole, emailStatus, teacherUpgrade, email } = adminButtons();
      [modifyRole, emailStatus, teacherUpgrade, email].forEach((button) => expect(button).toBeInTheDocument());
    });

    const modifyRoleTestCases = [
      {
        role: "EVENT_MANAGER" as UserRole,
        expectedRoles: ["STUDENT", "TEACHER", "EVENT_LEADER", "CONTENT_EDITOR"],
      },
      {
        role: "ADMIN" as UserRole,
        expectedRoles: ["STUDENT", "TUTOR", "TEACHER", "EVENT_LEADER", "CONTENT_EDITOR", "EVENT_MANAGER"],
      },
    ];

    it.each(modifyRoleTestCases)(
      "shows correct options for modifying role for $role user",
      async ({ role, expectedRoles }) => {
        await renderUserManager({ role: role });
        const roleOptions = screen.getByTestId("modify-role-options");
        const buttons = Array.from(roleOptions.querySelectorAll("button"));
        buttons.forEach((button, index) => {
          expect(button).toHaveTextContent(expectedRoles[index]);
        });
        expect(within(roleOptions).queryByText("ADMIN", { selector: "button" })).toBeNull();
        if (role === "EVENT_MANAGER") {
          ["TUTOR", "EVENT_MANAGER"].forEach((button) =>
            expect(within(roleOptions).queryByText(button, { selector: "button" })).toBeNull(),
          );
        }
      },
    );

    it("does not show Email Status button for EVENT_MANAGER user", async () => {
      await renderUserManager({ role: "EVENT_MANAGER" });
      const { emailStatus } = adminButtons();
      expect(emailStatus).not.toBeInTheDocument();
    });

    it("shows correct options for modifying email status for ADMIN user", async () => {
      await renderUserManager();
      const roleOptions = screen.getByTestId("email-status-options");
      const buttons = Array.from(roleOptions.querySelectorAll("button"));
      const expectedOptions = ["NOT_VERIFIED", "DELIVERY_FAILED"];
      buttons.forEach((button, index) => {
        expect(button).toHaveTextContent(expectedOptions[index]);
      });
    });

    it("shows a list of users with expected columns and data after a search is done", async () => {
      await renderUserManager();
      const { resultsTable, tableRows, firstUserDetails } = await searchAndWaitForResults();
      const headers = within(resultsTable).getAllByRole("columnheader");
      const expectedHeaders = [
        "Select",
        "Actions",
        "Name",
        "Email",
        "User role",
        "School",
        "Verification status",
        "Teacher pending?",
        "Member since",
        "Last seen",
      ];
      headers.forEach((header, index) => expect(header).toHaveTextContent(expectedHeaders[index]));
      expect(tableRows).toHaveLength(4);
      const expectedUserData = [
        "Admin, Test",
        "test-admin@test.com",
        "ADMIN",
        "Test School",
        "VERIFIED",
        "N",
        FRIENDLY_DATE_AND_TIME.format(mockUser.registrationDate),
        FRIENDLY_DATE_AND_TIME.format(mockUser.lastSeen),
      ];
      firstUserDetails.slice(2).forEach((cell, index) => expect(cell).toHaveTextContent(expectedUserData[index]));
    });

    it("shows a checkbox for selecting a user and buttons to View, Edit, Delete or Reset password", async () => {
      await renderUserManager();
      const { firstUserDetails } = await searchAndWaitForResults();
      const checkbox = within(firstUserDetails[0]).getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
      const expectedButtons = ["View", "Edit", "Delete", "Reset password"];
      const buttons = Array.from(firstUserDetails[1].children);
      buttons.forEach((button, index) => expect(button).toHaveTextContent(expectedButtons[index]));
    });

    it("links to a new tab with target user's progress page from View button", async () => {
      await renderUserManager();
      const { firstUserDetails } = await searchAndWaitForResults();
      const viewButton = within(firstUserDetails[1]).getByText("View");
      expect(viewButton).toHaveAttribute("href", "/progress/1");
      expect(viewButton).toHaveAttribute("target", "_blank");
    });

    it("opens a new tab with user's account page from Edit button", async () => {
      jest.spyOn(window, "open").mockImplementation(jest.fn());
      await renderUserManager();
      const { firstUserDetails } = await searchAndWaitForResults();
      const editButton = within(firstUserDetails[1]).getByText("Edit");
      await userEvent.click(editButton);
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining("/account?userId=1"), "_blank");
    });
  });
});
