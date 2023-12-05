import { screen, within } from "@testing-library/react";
import {
  checkPageTitle,
  clickButton,
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

const registerUserSpy = jest.spyOn(actions, "registerUser");
const upgradeAccountSpy = jest.spyOn(actions, "upgradeAccount");

const clickThroughOptions = async () => {
  await clickButton("Yes I am a teacher");
  await clickButton("Continue to a teacher account");
};

describe("Teacher Registration", () => {
  const renderTeacherRegistration = () => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: TeacherRegistration,
      initialRouteEntries: ["/register/teacher"],
    });
  };

  it("it displays teacher confirmation screen, then teacher conditions, then registration form", async () => {
    renderTeacherRegistration();
    checkPageTitle("Are you a teacher?");
    await clickButton("Yes I am a teacher");
    checkPageTitle("Conditions for Teacher accounts");
    await clickButton("Continue to a teacher account");
    checkPageTitle("Register as a teacher");
  });

  it("redirects to student registration page if user is not a teacher", async () => {
    renderTestEnvironment({ role: "ANONYMOUS" });
    const header = await screen.findByTestId("header");
    const signUp = within(header).getByRole("link", { name: "SIGN UP" });
    await userEvent.click(signUp);
    const radioButton = screen.getByLabelText("Teacher");
    await userEvent.click(radioButton);
    await clickButton("Continue");
    checkPageTitle("Are you a teacher?");
    const notTeacherButton = screen.getByRole("link", { name: /no I am a student/i });
    await userEvent.click(notTeacherButton);
    checkPageTitle("Register as a student");
  });

  it("On teacher registration page all expected fields are present and only teacher options are available", async () => {
    renderTeacherRegistration();
    await clickThroughOptions();
    const form = await screen.findByRole("form");
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
      recaptcha,
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
      recaptcha(),
    ].forEach((each) => expect(each).toBeVisible());
    expect(assignmentPreferences()).not.toBeInTheDocument();
    expect(form).toHaveTextContent("I am teaching");
    // teacher should have the option to select all stages
    const allOption = Array.from(stage().options).find((option) => option.value === "all");
    expect(allOption).toBeInTheDocument();
  });

  it("If fields are filled in wrong, various error messages are displayed", async () => {
    renderTeacherRegistration();
    await clickThroughOptions();
    await fillFormCorrectly(false, "teacher");
    const formFields = getFormFields();
    const { password, confirmPassword, submitButton, stage, noSchool, email } = formFields;
    const pwErrorMessage = screen.getByText(/Passwords must be at least 12 characters/i);
    expect(pwErrorMessage).toBeVisible();
    // update PW to meet requirements but not match the confirmation, and observe error changes
    await fillTextField(confirmPassword(), registrationUserData.password);
    const newPwErrorMessage = screen.getByText(/Passwords don't match/i);
    expect(newPwErrorMessage).toBeVisible();
    // update PW to meet requirements and try to submit, observe error messages for school, stage and email address
    await fillTextField(password(), registrationUserData.password);
    await userEvent.click(submitButton());
    const schoolErrorMessage = screen.getByText(/Please specify a school or college/i);
    const stageErrorMessage = getById("user-context-feedback");
    const emailErrorMessage = screen.getByText(/Not a valid email address for a teacher account/i);
    [schoolErrorMessage, stageErrorMessage, emailErrorMessage].forEach((each) => expect(each).toBeVisible());
    // select a stage and no school, change email to a valid one and submit again
    await selectOption(stage(), registrationUserData.stage);
    await userEvent.click(noSchool());
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
        rest.post(API_PATH + "/users/request_role_change", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ ...registrationMockUser, teacherPending: true }));
        }),
      ],
    });
    await clickThroughOptions();
    await fillFormCorrectly(true, "teacher");
    const formFields = getFormFields();
    const { submitButton } = formFields;
    await userEvent.click(submitButton());
    expect(registerUserSpy).toHaveBeenCalledWith(
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
      "mocked-recaptcha-token",
    );
    expect(upgradeAccountSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        verificationDetails: registrationUserData.verificationInfo,
        otherInformation: "extra information",
      }),
    );
  });
});
