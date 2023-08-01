import { screen } from "@testing-library/react";
import {
  fillFormCorrectly,
  fillTextField,
  getById,
  getFormFields,
  renderTestEnvironment,
  selectOption,
} from "../utils";
import userEvent from "@testing-library/user-event";
import { TeacherRegistration } from "../../app/components/pages/TeacherRegistration";
import * as actions from "../../app/state/actions";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { registrationMockUser, registrationUserData } from "../../mocks/data";

const updateCurrentUserSpy = jest.spyOn(actions, "updateCurrentUser");
const submitMessageSpy = jest.spyOn(actions, "submitMessage");

describe("Teacher Registration", () => {
  const renderTeacherRegistration = () => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: TeacherRegistration,
      initialRouteEntries: ["/register/teacher"],
    });
  };

  const acceptTeacherConditions = async () => {
    const acceptTeacherConditionsButton = screen.getByRole("button", {
      name: /continue to a teacher account/i,
    });
    await userEvent.click(acceptTeacherConditionsButton);
  };

  it("On page load the teacher conditions are visible and accept button needs to be pressed in order to view the form", async () => {
    renderTeacherRegistration();
    const heading = screen.getByTestId("main-heading");
    expect(heading).toHaveTextContent(/conditions for teacher accounts/i);
    await acceptTeacherConditions();
    const newHeading = screen.getByTestId("main-heading");
    expect(newHeading).toHaveTextContent(/register as a teacher/i);
  });

  it("On teacher registration page all expected fields are present and only teacher options are available", async () => {
    renderTeacherRegistration();
    await acceptTeacherConditions();
    // find the form
    const form = await screen.findByRole("form");
    // find givenName, familyName, current school, DOB, email, gender, password, confirmPassword, contexts, email preferences, verification info and additional info
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
      newsPreferences,
      events,
      submitButton,
      verificationInfo,
      additionalInfo,
      addAnotherStage,
      assignmentPreferences,
      otherInfo,
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
      newsPreferences(),
      events(),
      submitButton(),
      verificationInfo(),
      additionalInfo(),
      addAnotherStage(),
      otherInfo(),
    ].forEach((each) => expect(each).toBeVisible());
    expect(assignmentPreferences()).not.toBeInTheDocument();
    // text should to be "teaching" rather than studying
    expect(form).toHaveTextContent("I am teaching");
    // teacher should have the option to select all stages
    const allOption = Array.from(stage().options).find(
      (option) => option.value === "all"
    );
    expect(allOption).toBeInTheDocument();
  });

  it("If fields are filled in wrong, various error messages are displayed", async () => {
    renderTeacherRegistration();
    await acceptTeacherConditions();
    // fill out first and last name, gender and verification info correctly, but email/pw incorrectly, no options selected school and stage or email options
    await fillFormCorrectly(false, "teacher");
    const formFields = getFormFields();
    const { password, confirmPassword, submitButton, stage, noSchool, email } =
      formFields;
    // observe error messages for password requirements
    const pwErrorMessage = screen.getByText(
      /Passwords must be at least 12 characters/i
    );
    expect(pwErrorMessage).toBeVisible();
    // update PW to meet requirements but not match and error changes
    await fillTextField(confirmPassword(), registrationUserData.password);
    const newPwErrorMessage = screen.getByText(/Passwords don't match/i);
    expect(newPwErrorMessage).toBeVisible();
    // update PW to meet requirements and try to submit, observe error messages for school, stage and email address
    await fillTextField(password(), registrationUserData.password);
    await userEvent.click(submitButton());
    const schoolErrorMessage = screen.getByText(
      /Please specify a school or college/i
    );
    const stageErrorMessage = getById("user-context-feedback");
    const emailErrorMessage = screen.getByText(/Not a valid email address for a teacher account/i);
    [schoolErrorMessage, stageErrorMessage, emailErrorMessage].forEach((each) =>
      expect(each).toBeVisible()
    );
    // select a stage and no school, change email to a valid one and submit again
    await selectOption(stage(), registrationUserData.stage);
    await userEvent.click(noSchool());
    await userEvent.click(email());
    await userEvent.clear(email());
    await fillTextField(email(), registrationUserData.email);
    await userEvent.click(submitButton());
    // observe general error message as email preferences are not filled in
    const generalError = screen.getByRole("heading", {
      name: /please fill out all fields/i,
    });
    expect(generalError).toBeVisible();
   
  });

  it("If fields are filled in correctly, pressing submit will attempt to create a user, and submit an account upgrade request", async () => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: TeacherRegistration,
      initialRouteEntries: ["/register/student"],
      extraEndpoints: [
        rest.post(API_PATH + "/users", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(registrationMockUser));
        }),
        rest.post(API_PATH + "/contact", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({}));
        }),
      ],
    });
    await acceptTeacherConditions();

    // fill out the form fields correctly
    await fillFormCorrectly(true, "teacher");
    const formFields = getFormFields();
    const { submitButton } = formFields;

    // Submit the form
    await userEvent.click(submitButton());

    //   Verify that updateCurrentUser was called with the correct arguments
    expect(updateCurrentUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        givenName: registrationUserData.givenName,
        familyName: registrationUserData.familyName,
        email: registrationUserData.email,
        gender: registrationUserData.gender,
        teacherPending: true,
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
        teacherPending: true,
        loggedIn: true,
      }),
      true
    );
    expect(submitMessageSpy).toHaveBeenCalledWith({
      firstName: registrationUserData.givenName,
      lastName: registrationUserData.familyName,
      emailAddress: registrationUserData.email,
      subject: "Teacher Account Request",
      message: expect.stringMatching(
        /extra information/
      ),
    });
  });

});
