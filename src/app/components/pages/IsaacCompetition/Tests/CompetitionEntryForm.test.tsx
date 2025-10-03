import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompetitionEntryForm from "../EntryForm/CompetitionEntryForm";
import { renderTestEnvironment } from "../../../../../test/utils";
import { Role } from "../../../../../IsaacApiTypes";

jest.mock("../EntryForm/useActiveGroups", () => ({
  useActiveGroups: () => [],
}));

jest.mock("../EntryForm/useReserveUsersOnCompetition", () => ({
  useReserveUsersOnCompetition: () => jest.fn(),
}));

describe("CompetitionEntryForm", () => {
  const mockHandleTermsClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Auto-population of user information", () => {
    it("should auto-populate first name, last name, email, and school fields from logged in teacher", () => {
      const teacherWithSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: "12345",
        schoolOther: undefined,
        role: "TEACHER" as Role,
      };

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Check that fields are auto-populated and disabled
      const firstNameInput = screen.getByDisplayValue("John");
      const lastNameInput = screen.getByDisplayValue("Doe");
      const emailInput = screen.getByDisplayValue("john.doe@school.edu");

      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(firstNameInput).toBeDisabled();
      expect(lastNameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });
  });

  describe("School validation and tooltips", () => {
    it("should show warning tooltip when no school is selected", async () => {
      const teacherWithoutSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: undefined,
        schoolOther: "N/A",
        role: "TEACHER" as Role,
      };

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithoutSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Try to submit the form to trigger validation
      const submitButton = screen.getByRole("button", { name: "Submit competition entry" });
      await userEvent.click(submitButton);

      // Check for school validation tooltip
      await waitFor(() => {
        expect(
          screen.getByText(/Please update your account details to specify your school or college/),
        ).toBeInTheDocument();
      });
    });
  });

  it("should display correct tooltip messages", () => {
    renderTestEnvironment({
      role: "TEACHER",
    });

    render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

    // Check for project link tooltip
    const projectLinkTooltip = screen.getByText(/Upload your project to cloud storage/);
    expect(projectLinkTooltip).toBeInTheDocument();

    // Check for student group tooltip
    const groupTooltip = screen.getByText(/Choose one of the groups you have created/);
    expect(groupTooltip).toBeInTheDocument();

    // Check for student selection tooltip
    const studentTooltip = screen.getByText(/Choose 1-4 students from the selected group/);
    expect(studentTooltip).toBeInTheDocument();
  });

  describe("Submit button state", () => {
    it("should be disabled when required fields are empty", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      const submitButton = screen.getByRole("button", { name: "Submit competition entry" });
      expect(submitButton).toBeDisabled();
    });

    it("should be enabled when all required fields are filled", async () => {
      const teacherWithSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: "12345",
        schoolOther: undefined,
        role: "TEACHER" as Role,
      };

      // Mock groups with students
      const mockGroups = [
        {
          id: 1,
          groupName: "Test Group",
          members: [
            { id: 1, givenName: "Student", familyName: "One" },
            { id: 2, givenName: "Student", familyName: "Two" },
          ],
        },
      ];

      jest.doMock("../EntryForm/useActiveGroups", () => ({
        useActiveGroups: () => mockGroups,
      }));

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Fill in project details
      const projectTitleInput = screen.getByPlaceholderText("E.g., SmartLab");
      const projectLinkInput = screen.getByPlaceholderText(/Add a link to a project saved in the cloud/);

      await userEvent.type(projectTitleInput, "Test Project");
      await userEvent.type(projectLinkInput, "https://example.com/project");

      // The submit button should still be disabled because no group/students are selected
      const submitButton = screen.getByRole("button", { name: "Submit competition entry" });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Group and student selection", () => {
    it("should show tooltip when no groups are present", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Check for no groups tooltip
      expect(screen.getByText(/You have not created any groups/)).toBeInTheDocument();
      expect(screen.getByText(/create a group here first/)).toBeInTheDocument();
    });

    it("should disable student selection when no group is selected", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // The student selection should be disabled
      const studentSelect = screen.getByText(/Please select a group first/);
      expect(studentSelect).toBeInTheDocument();
    });

    it("should show tooltip when group has no students", async () => {
      const teacherWithSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: "12345",
        schoolOther: undefined,
        role: "TEACHER" as Role,
      };

      // Mock groups without students
      const mockGroups = [
        {
          id: 1,
          groupName: "Test Group",
          members: [],
        },
      ];

      jest.doMock("../EntryForm/useActiveGroups", () => ({
        useActiveGroups: () => mockGroups,
      }));

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Select a group
      const groupSelect = screen.getByText(/Choose from the groups you've created/);
      await userEvent.click(groupSelect);

      // Check for no students tooltip
      await waitFor(() => {
        expect(screen.getByText(/No students found in the selected group/)).toBeInTheDocument();
      });
    });

    it("should enable student selection when group with students is selected", async () => {
      const teacherWithSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: "12345",
        schoolOther: undefined,
        role: "TEACHER" as Role,
      };

      // Mock groups with students
      const mockGroups = [
        {
          id: 1,
          groupName: "Test Group",
          members: [
            { id: 1, givenName: "Student", familyName: "One" },
            { id: 2, givenName: "Student", familyName: "Two" },
          ],
        },
      ];

      jest.doMock("../EntryForm/useActiveGroups", () => ({
        useActiveGroups: () => mockGroups,
      }));

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      // Select a group
      const groupSelect = screen.getByText(/Choose from the groups you've created/);
      await userEvent.click(groupSelect);

      // The student selection should now be enabled
      await waitFor(() => {
        expect(screen.getByText(/Choose students from your selected group/)).toBeInTheDocument();
      });
    });
  });

  describe("Form validation", () => {
    it("should validate all required fields before enabling submit", async () => {
      const teacherWithSchool = {
        givenName: "John",
        familyName: "Doe",
        email: "john.doe@school.edu",
        schoolId: "12345",
        schoolOther: undefined,
        role: "TEACHER" as Role,
      };

      renderTestEnvironment({
        role: "TEACHER",
        modifyUser: () => teacherWithSchool,
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      const submitButton = screen.getByRole("button", { name: "Submit competition entry" });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Fill project title only - still disabled
      const projectTitleInput = screen.getByPlaceholderText("E.g., SmartLab");
      await userEvent.type(projectTitleInput, "Test Project");
      expect(submitButton).toBeDisabled();

      // Fill project link - still disabled (no group/students)
      const projectLinkInput = screen.getByPlaceholderText(/Add a link to a project saved in the cloud/);
      await userEvent.type(projectLinkInput, "https://example.com/project");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Terms and Conditions", () => {
    it("calls handleTermsClick when Terms and Conditions link is clicked", async () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      const termsLink = screen.getByText("Terms and Conditions");
      await userEvent.click(termsLink);

      expect(mockHandleTermsClick).toHaveBeenCalled();
    });
  });
});
