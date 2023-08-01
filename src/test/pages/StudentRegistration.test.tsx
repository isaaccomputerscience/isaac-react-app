import { screen } from "@testing-library/react";
import {
  fillFormCorrectly,
  getFormFields,
  renderTestEnvironment,
} from "../utils";
import userEvent from "@testing-library/user-event";
import { StudentRegistration } from "../../app/components/pages/StudentRegistration";
import * as actions from "../../app/state/actions";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { registrationMockUser, registrationUserData } from "../../mocks/data";

const updateCurrentUserSpy = jest.spyOn(actions, "updateCurrentUser");

describe("Student Registration", () => {
  const renderStudentRegistration = () => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: StudentRegistration,
      initialRouteEntries: ["/register/student"],
    });
  };

  it("On student registration page all expected fields are present and only student options are available", async () => {
    renderStudentRegistration();
    // find the form
    const form = screen.getByRole("form");
    // check that the page title is correct
    expect(screen.getByTestId("main-heading")).toHaveTextContent(
      /register as a student/i
    );
    // find givenName, familyName, current school, DOB, email, gender, password, confirmPassword, contexts, email preferences
    const formFields = getFormFields();
    const {
      givenName,
      familyName,
      currentSchool,
      dob,
      email,
      gender,
      password,
      confirmPassword,
      stage,
      examBoard,
      assignmentPreferences,
      newsPreferences,
      events,
      submitButton,
    } = formFields;

    // expect each to be visible
    [
      givenName(),
      familyName(),
      currentSchool(),
      dob(),
      email(),
      gender(),
      password(),
      confirmPassword(),
      stage(),
      examBoard(),
      assignmentPreferences(),
      newsPreferences(),
      events(),
      submitButton(),
    ].forEach((each) => expect(each).toBeVisible());
    // text should to be "studying" rather than teaching
    expect(form).toHaveTextContent("I am studying");
    // student should not have the option to select all stages
    const allOption = Array.from(stage().options).find(
      (option) => option.value === "all"
    );
    expect(allOption).toBeUndefined();
  });

  it("If fields are filled in wrong, error messages are displayed", async () => {
    renderStudentRegistration();
    // fill out some form fields but choose a PW not meeting requirements
    await fillFormCorrectly(false, "student");
    // Attempt to submit the form
    const formFields = getFormFields();
    const { submitButton } = formFields;
    await userEvent.click(submitButton());
    // observe error messages
    const pwErrorMessage = screen.getByText(
      /Passwords must be at least 12 characters/i
    );
    expect(pwErrorMessage).toBeVisible();
    const generalError = screen.getByRole("heading", {
      name: /please fill out all fields/i,
    });
    expect(generalError).toBeVisible();
  });

  it("If fields are filled in correctly, pressing submit will attempt to create a user", async () => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: StudentRegistration,
      initialRouteEntries: ["/register/student"],
      extraEndpoints: [
        rest.post(API_PATH + "/users", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(registrationMockUser));
        }),
      ],
    });

    // fill out the form fields correctly
    await fillFormCorrectly(true, "student");

    // Submit the form
    const formFields = getFormFields();
    const { submitButton } = formFields;
    await userEvent.click(submitButton());

    // Verify that updateCurrentUser was called with the correct arguments
    expect(updateCurrentUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        givenName: registrationUserData.givenName,
        familyName: registrationUserData.familyName,
        email: registrationUserData.email,
        gender: registrationUserData.gender,
        loggedIn: false,
      }),
      expect.objectContaining({
        EMAIL_PREFERENCE: {
          NEWS_AND_UPDATES: false,
          ASSIGNMENTS: true,
          EVENTS: false,
        },
      }),
      expect.objectContaining([
        {
          stage: registrationUserData.stage,
          examBoard: "aqa",
        },
      ]),
      null,
      expect.objectContaining({
        givenName: registrationUserData.givenName,
        familyName: registrationUserData.familyName,
        email: registrationUserData.email,
        gender: registrationUserData.gender,
        loggedIn: true,
      }),
      true
    );
  });
});
