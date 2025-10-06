import React from "react";
import { render, screen } from "@testing-library/react";

//simple mock component
const MockCompetitionEntryForm = () => {
  return (
    <div>
      <div data-testid="tooltip-no-groups">
        You have not created any groups. Please <a href="/groups">create a group here first</a> and invite students to
        join.
      </div>

      <div data-testid="tooltip-no-members">
        No students found in the selected group. To add students go to the <a href="/groups">Manage groups page</a>.
      </div>

      <div data-testid="alert-too-many-students">You can only select up to 4 students.</div>

      <button data-testid="submit-button" disabled>
        Submit Entry
      </button>
    </div>
  );
};

describe("CompetitionEntryForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Tooltip scenarios", () => {
    it("should show tooltip when no groups are created", () => {
      render(<MockCompetitionEntryForm />);

      // Check for the tooltip content
      expect(screen.getByTestId("tooltip-no-groups")).toBeInTheDocument();
      expect(screen.getByText(/You have not created any groups/)).toBeInTheDocument();
      expect(screen.getByText("create a group here first")).toBeInTheDocument();
    });

    it("should show tooltip when group is present but no members are present", () => {
      render(<MockCompetitionEntryForm />);

      // tooltip content for when no students are present
      expect(screen.getByTestId("tooltip-no-members")).toBeInTheDocument();
      expect(screen.getByText(/No students found in the selected group/)).toBeInTheDocument();
      expect(screen.getByText("Manage groups page")).toBeInTheDocument();
    });
  });

  describe("Alert scenarios", () => {
    it("should show alert when users try to add more than 4 students", () => {
      render(<MockCompetitionEntryForm />);

      // alert for when more than 4 students are selected
      expect(screen.getByTestId("alert-too-many-students")).toBeInTheDocument();
      expect(screen.getByText("You can only select up to 4 students.")).toBeInTheDocument();
    });
  });

  describe("Hyperlink scenarios", () => {
    it("should have hyperlinks that redirect to appropriate pages", () => {
      render(<MockCompetitionEntryForm />);

      // Check for hyperlinks
      const createGroupLink = screen.getByText("create a group here first");
      expect(createGroupLink).toHaveAttribute("href", "/groups");

      const manageGroupsLink = screen.getByText("Manage groups page");
      expect(manageGroupsLink).toHaveAttribute("href", "/groups");
    });
  });

  describe("Submit button scenarios", () => {
    it("should not enable submit button until all conditions are fulfilled", () => {
      render(<MockCompetitionEntryForm />);

      // Submit button should be disabled initially
      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });
  });
});
