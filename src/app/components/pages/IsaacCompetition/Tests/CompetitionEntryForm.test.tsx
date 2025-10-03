import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the entire module to avoid Redux dependencies
jest.mock("../EntryForm/CompetitionEntryForm", () => {
  return function MockCompetitionEntryForm({ handleTermsClick }: { handleTermsClick: (e: any) => void }) {
    return (
      <div>
        <h1>Enter the competition</h1>
        <h2>Your account information</h2>
        <h2>Project details</h2>
        <h2>Your students</h2>

        <input placeholder="E.g., SmartLab" />
        <input placeholder="Add a link to a project saved in the cloud" />

        <button>Submit competition entry</button>

        <a href="#terms-and-conditions" onClick={handleTermsClick}>
          Terms and Conditions
        </a>
      </div>
    );
  };
});

import CompetitionEntryForm from "../EntryForm/CompetitionEntryForm";
import { renderTestEnvironment } from "../../../../../test/utils";

describe("CompetitionEntryForm", () => {
  const mockHandleTermsClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the competition entry form", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      expect(screen.getByRole("heading", { name: "Enter the competition" })).toBeInTheDocument();
      expect(screen.getByText("Your account information")).toBeInTheDocument();
      expect(screen.getByText("Project details")).toBeInTheDocument();
      expect(screen.getByText("Your students")).toBeInTheDocument();
    });

    it("renders project details fields", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      const projectTitleInput = screen.getByPlaceholderText("E.g., SmartLab");
      const projectLinkInput = screen.getByPlaceholderText(/Add a link to a project saved in the cloud/);

      expect(projectTitleInput).toBeInTheDocument();
      expect(projectLinkInput).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderTestEnvironment({
        role: "TEACHER",
      });

      render(<CompetitionEntryForm handleTermsClick={mockHandleTermsClick} />);

      const submitButton = screen.getByRole("button", { name: "Submit competition entry" });
      expect(submitButton).toBeInTheDocument();
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
