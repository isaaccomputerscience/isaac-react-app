import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { UserRole } from "../../../../IsaacApiTypes";
import { RegistrationEmailPreference } from "../../../../app/components/elements/inputs/RegistrationEmailPreference";
import { renderTestEnvironment } from "../../../utils";

describe("RegistrationEmailPreference", () => {
  const mockSetEmailPreferences = jest.fn();

  const setupTest = (role: UserRole | "ANONYMOUS", props = {}) => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: RegistrationEmailPreference,
      componentProps: {
        emailPreferences: undefined,
        setEmailPreferences: mockSetEmailPreferences,
        submissionAttempted: false,
        userRole: role,
        ...props,
      },
      initialRouteEntries: ["/register/student"],
    });
  };

  it("renders correct options for student registration", () => {
    setupTest("STUDENT");
    const assignmentsOption = screen.getByText("Assignments");
    const newsOption = screen.getByText("News");
    const eventsOption = screen.getByText("Events");
    expect(assignmentsOption).toBeInTheDocument();
    expect(newsOption).toBeInTheDocument();
    expect(eventsOption).toBeInTheDocument();
    const assignmentsDescription = screen.getByText(
      "Receive assignment notifications from your teacher."
    );
    const newsDescription = screen.getByText(
      "Be the first to know about new topics, new platform features, and our fantastic competition giveaways."
    );
    const eventsDescription = screen.getByText(
      "Get valuable updates on our free student workshops/teacher CPD events happening near you."
    );
    expect(assignmentsDescription).toBeInTheDocument();
    expect(newsDescription).toBeInTheDocument();
    expect(eventsDescription).toBeInTheDocument();
  });

  it("renders correct options for teacher registration", () => {
    setupTest("TEACHER");
    const newsOption = screen.getByText("News");
    const eventsOption = screen.getByText("Events");
    expect(newsOption).toBeInTheDocument();
    expect(eventsOption).toBeInTheDocument();
    const newsDescription = screen.getByText(
      "Be the first to know about new topics, new platform features, and our fantastic competition giveaways."
    );
    const eventsDescription = screen.getByText(
      "Get valuable updates on our free student workshops/teacher CPD events happening near you."
    );
    expect(newsDescription).toBeInTheDocument();
    expect(eventsDescription).toBeInTheDocument();
    const assignmentsOption = screen.queryByText("Assignments");
    const assignmentsDescription = screen.queryByText(
      "Receive assignment notifications from your teacher."
    );
    expect(assignmentsOption).not.toBeInTheDocument();
    expect(assignmentsDescription).not.toBeInTheDocument();
  });

  const preferenceOptions = ["NEWS_AND_UPDATES", "EVENTS", "ASSIGNMENTS"];
  it.each(preferenceOptions)(
    "handles preference changes for %s correctly",
    async (option) => {
      setupTest("STUDENT");
      const falseOption = new RegExp(`No.*for ${option}`);
      const trueOption = new RegExp(`Yes.*for ${option}`);
      const preferenceFalseLabel = screen.getByLabelText(falseOption);
      await userEvent.click(preferenceFalseLabel);
      const expectedFalse = { [option]: false };
      expect(mockSetEmailPreferences).toHaveBeenCalledWith(
        expect.objectContaining(expectedFalse)
      );
      const preferenceTrueLabel = screen.getByLabelText(trueOption);
      await userEvent.click(preferenceTrueLabel);
      const expectedTrue = { [option]: true };
      expect(mockSetEmailPreferences).toHaveBeenCalledWith(
        expect.objectContaining(expectedTrue)
      );
    }
  );

  it("if form submission has been attempted but not all preferences are selected, options are marked as invalid and required", () => {
    setupTest("STUDENT", {
      submissionAttempted: true,
      emailPreferences: { ASSIGNMENTS: false, EVENTS: true },
    });
    const newsPreferenceTrueLabel = screen.getByLabelText(
      /Yes.*for NEWS_AND_UPDATES/
    );
    const newsPreferenceFalseLabel = screen.getByLabelText(
      /No.*for NEWS_AND_UPDATES/
    );
    expect(newsPreferenceTrueLabel).toBeInvalid();
    expect(newsPreferenceFalseLabel).toBeInvalid();
    const emailPreferenceFeedback = screen.getByText("required", {
      selector: "#news-feedback",
    });
    expect(emailPreferenceFeedback).toBeInTheDocument();
  });

  it("if form submission has been attempted and all options were correctly selected, no error message shows", () => {
    setupTest("STUDENT", {
      submissionAttempted: true,
      emailPreferences: {
        ASSIGNMENTS: false,
        EVENTS: true,
        NEWS_AND_UPDATES: true,
      },
    });
    const preferences = [
      { key: "NEWS_AND_UPDATES", label: "NEWS_AND_UPDATES" },
      { key: "ASSIGNMENTS", label: "ASSIGNMENTS" },
      { key: "EVENTS", label: "EVENTS" },
    ];

    preferences.forEach((preference) => {
      const trueLabel = screen.getByLabelText(`Yes for ${preference.label}`);
      const falseLabel = screen.getByLabelText(`No for ${preference.label}`);

      expect(trueLabel).toBeValid();
      expect(falseLabel).toBeValid();

      const feedbackId = `#${preference.label.toLowerCase()}-feedback`;
      const feedbackElement = screen.queryByText("required", {
        selector: feedbackId,
      });
      expect(feedbackElement).toBeNull();
    });
  });
});
