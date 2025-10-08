import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { API_PATH } from "../../../../services";
import { renderTestEnvironment } from "../../../../../test/utils";
import { CompetitionEntryForm } from "../EntryForm/CompetitionEntryForm";
import { mockUser, mockActiveGroups } from "../../../../../mocks/data";

// Mock the hooks
jest.mock("../EntryForm/useActiveGroups", () => ({
  useActiveGroups: () => mockActiveGroups,
}));

jest.mock("../EntryForm/useReserveUsersOnCompetition", () => ({
  useReserveUsersOnCompetition: () => jest.fn(),
}));

// Mock the SchoolInput component
jest.mock("../../../elements/inputs/SchoolInput", () => ({
  SchoolInput: ({ userToUpdate, setUserToUpdate, submissionAttempted }: any) => (
    <div data-testid="school-input">
      <input
        data-testid="school-select"
        value={userToUpdate?.schoolOther || ""}
        onChange={(e) => setUserToUpdate({ ...userToUpdate, schoolOther: e.target.value })}
        placeholder="Select or enter school"
      />
      {!userToUpdate?.schoolId && !userToUpdate?.schoolOther && submissionAttempted && (
        <div data-testid="school-validation-error">School is required</div>
      )}
    </div>
  ),
}));

describe("CompetitionEntryForm", () => {
  const mockHandleTermsClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupTest = (userModifications?: any, groupsWithMembers?: any) => {
    const modifiedUser = userModifications ? { ...mockUser, ...userModifications } : mockUser;
    const groups = groupsWithMembers || mockActiveGroups;

    return renderTestEnvironment({
      PageComponent: CompetitionEntryForm,
      componentProps: {
        handleTermsClick: mockHandleTermsClick,
      },
      modifyUser: () => modifiedUser,
      initialRouteEntries: ["/competition"],
      extraEndpoints: [
        rest.get(API_PATH + "/groups", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(groups));
        }),
        rest.get(API_PATH + "/groups/:groupId/members", (req, res, ctx) => {
          const groupId = req.params.groupId;
          const group = groups.find((g: any) => g.id === parseInt(groupId as string));
          return res(ctx.status(200), ctx.json(group?.members || []));
        }),
      ],
    });
  };

  describe("Basic rendering", () => {
    it("should have correct hyperlinks", () => {
      setupTest();
      const updateAccountLinks = screen.getAllByText("update");
      expect(updateAccountLinks[0]).toHaveAttribute("href", "/account");
    });

    it("should show create group hyperlink when no groups are created", () => {
      setupTest(undefined, []); // Pass empty array for groups
      const createGroupLink = screen.getByText("create a group here first");
      expect(createGroupLink).toHaveAttribute("href", "/groups");
    });
  });

  describe("Tooltip scenarios", () => {
    it("should show school validation tooltip when no school is selected", () => {
      setupTest();

      const tooltip = document.querySelector(".entry-form-validation-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("Please update your account details to specify your school or college");
    });

    it("should show no groups tooltip when no groups are created", () => {
      setupTest(undefined, []);

      const tooltipText = screen.getByText(/You have not created any groups. Please/);
      expect(tooltipText).toBeInTheDocument();
    });

    it("should show 'No options' message when dropdown is clicked with no groups", async () => {
      const user = userEvent.setup();
      setupTest(undefined, []);

      // Find and click the group selection dropdown
      const groupSelect = screen.getByText("Choose from the groups you've created or create one first");
      await user.click(groupSelect);

      // Check for "No options" message
      const noOptionsMessage = screen.getByText("No options");
      expect(noOptionsMessage).toBeInTheDocument();
    });
  });

  describe("Submit button scenarios", () => {
    it("should disable submit button when form is incomplete", () => {
      setupTest();
      const submitButton = screen.getByDisplayValue("Submit competition entry");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form submission", () => {
    it("should call handleTermsClick when terms link is clicked", async () => {
      const user = userEvent.setup();
      setupTest();

      const termsLink = screen.getByText("Terms and Conditions");
      await user.click(termsLink);

      expect(mockHandleTermsClick).toHaveBeenCalled();
    });
  });
});
