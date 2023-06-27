import { screen } from "@testing-library/react";
import { renderTestEnvironment } from "../utils";
import userEvent from "@testing-library/user-event";
import { StudentRegistration } from "../../app/components/pages/StudentRegistration";
import * as actions from "../../app/state/actions";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { registrationMockUser } from "../../mocks/data";

const updateCurrentUserSpy = jest.spyOn(actions, "updateCurrentUser");

const fillTextField = async (
  field: HTMLElement,
  value: string
): Promise<void> => {
  await userEvent.click(field);
  await userEvent.type(field, value);
};

const selectOption = async (
  selectElement: HTMLElement,
  optionValue: string
): Promise<void> => {
  await userEvent.click(selectElement);
  await userEvent.selectOptions(selectElement, optionValue);
};

const sampleUser = {
  givenName: "Test",
  familyName: "User",
  email: "testuser@test.com",
  wrongPassword: "test1234",
  password: "Testing123456!",
  gender: "FEMALE",
  stage: "gcse",
};

const fillFormCorrectly = async (correctly: boolean) => {
  const fields = {
    givenName: screen.getByRole("textbox", { name: "First name" }),
    familyName: screen.getByRole("textbox", { name: "Last name" }),
    noSchool: screen.getByRole("checkbox", {
      name: /not associated with a school/i,
    }),
    overThirteen: screen.getByRole("checkbox", { name: /13 years old/i }),
    email: screen.getByRole("textbox", { name: "Email address" }),
    gender: screen.getByRole("combobox", { name: "Gender" }),
    password: screen.getByLabelText("Password", { selector: "input" }),
    confirmPassword: screen.getByLabelText("Re-enter password", {
      selector: "input",
    }),
    stage: screen.getByRole("combobox", { name: "Stage" }),
    newsPreferences: screen.getByRole("radio", {
      name: /no for news_and_updates/i,
    }),
    events: screen.getByRole("radio", { name: /no for events/i }),
  };

  await fillTextField(fields.givenName, sampleUser.givenName);
  await fillTextField(fields.familyName, sampleUser.familyName);
  await userEvent.click(fields.noSchool);
  await userEvent.click(fields.overThirteen);
  await fillTextField(fields.email, sampleUser.email);
  await selectOption(fields.gender, sampleUser.gender);
  await selectOption(fields.stage, sampleUser.stage);
  if (correctly) {
    await fillTextField(fields.password, sampleUser.password);
    await fillTextField(fields.confirmPassword, sampleUser.password);
    await userEvent.click(fields.newsPreferences);
    await userEvent.click(fields.events);
  } else {
    await fillTextField(fields.password, sampleUser.wrongPassword);
    await fillTextField(fields.confirmPassword, sampleUser.wrongPassword);
  }

  return fields;
};

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
    // find givenName, familyName, current school, DOB, email, gender, password, confirmPassword, contexts, email preferences
    const givenName = screen.getByRole("textbox", { name: "First name" });
    const familyName = screen.getByRole("textbox", { name: "Last name" });
    const currentSchool = screen.getByRole("combobox", {
      name: "My current school",
    });
    const dob = screen.getByText(/Date of birth/i);
    const email = screen.getByRole("textbox", { name: "Email address" });
    const gender = screen.getByRole("combobox", { name: "Gender" });
    const password = screen.getByLabelText("Password", { selector: "input" });
    const confirmPassword = screen.getByLabelText("Re-enter password", {
      selector: "input",
    });
    const stage = screen.getByRole("combobox", {
      name: "Stage",
    }) as HTMLSelectElement;
    const examBoard = screen.getByRole("combobox", { name: "Exam Board" });
    const assignmentPreferences = screen.getByRole("cell", {
      name: /receive assignment/i,
    });
    const newsPreferences = screen.getByRole("cell", { name: /new topics/i });
    const eventsPreferences = screen.getByRole("cell", {
      name: /events happening near you/i,
    });
    // find submit button
    const submitButton = screen.getByRole("button", {
      name: "Register my account",
    });
    // expect each to be visible
    [
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
      eventsPreferences,
      submitButton,
    ].forEach((each) => expect(each).toBeVisible());
    // text should to be "studying" rather than teaching
    expect(form).toHaveTextContent("I am studying");
    // student should not have the option to select all stages
    const allOption = Array.from(stage.options).find(
      (option) => option.value === "all"
    );
    expect(allOption).toBeUndefined();
  });

  it("If fields are filled in wrong, error messages are displayed", async () => {
    renderStudentRegistration();
    // fill out some form fields but choose a PW not meeting requirements
    await fillFormCorrectly(false);
    // Attempt to submit the form
    const submitButton = screen.getByRole("button", {
      name: "Register my account",
    });
    await userEvent.click(submitButton);
    // observe error messages
    const pwErrorMessage = screen.getByText(
      /please ensure your password is at least 12 characters/i
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
          return res(
              ctx.status(200),
              ctx.json(registrationMockUser)
          );
      }),
      ],
    });

    // fill out the form fields correctly
    await fillFormCorrectly(true);

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: "Register my account",
    });
    await userEvent.click(submitButton);

    // Verify that updateCurrentUser was called with the correct arguments
    expect(updateCurrentUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        givenName: sampleUser.givenName,
        familyName: sampleUser.familyName,
        email: sampleUser.email,
        gender: sampleUser.gender,
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
          stage: sampleUser.stage,
          examBoard: "aqa",
        },
      ]),
      null,
      expect.objectContaining({
        givenName: sampleUser.givenName,
        familyName: sampleUser.familyName,
        email: sampleUser.email,
        gender: sampleUser.gender,
        loggedIn: true,
      }),
      true
    );
  });
});
