import { screen, within } from "@testing-library/react";
import { fillTextField, renderTestEnvironment } from "../utils";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import * as actions from "../../app/state/actions";

describe("ErrorClear", () => {
  it("If a error is received from API and stored into state, this will display on the page, but when changing route it will clear", async () => {
    const clearErrorSpy = jest.spyOn(actions, 'clearError');

    renderTestEnvironment({
      role: "ANONYMOUS",
      extraEndpoints: [
        rest.post(API_PATH + "/auth/SEGUE/authenticate", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              errorMessage: "Incorrect credentials provided.",
              bypassGenericSiteErrorPage: false,
            })
          );
        }),
      ],
    });
    // Locate "Log In" in the header and click on it
    const header = await screen.findByTestId("header");
    const logIn = within(header).getByRole("link", { name: "LOG IN" });
    await userEvent.click(logIn);
    // Wait for Log In page to load and check that the page title is correct
    const title = screen.getByRole("heading", {
      name: /log in or sign up:/i,
    });
    expect(title).toBeInTheDocument();
    // Fill in the form with incorrect details to trigger an error
    const emailInput = screen.getByRole("textbox", {
      name: /email address/i,
    });
    const passwordInput = screen.getByLabelText(/password/i);
    await fillTextField(emailInput, "randomTestEmail@test.com");
    await fillTextField(passwordInput, "randomTestPassword123!");
    // Click on the Log In button
    const logInButton = screen.getByRole("button", { name: "Log in" });
    await userEvent.click(logInButton);
    // Check that the error message is displayed
    const errorMessage = screen.queryByText(/incorrect credentials/i);
    expect(errorMessage).toBeInTheDocument();
    // navigate to the student registration page, which should clear the error
    const signUp = within(header).getByRole("link", { name: "SIGN UP" });
    await userEvent.click(signUp);
    // Check that the page title is correct
    const newTitle = screen.getByRole("heading", {
      name: "Register for a free account",
    });
    expect(newTitle).toBeInTheDocument();
    // Locate the radio button for teacher or student and click on it
    const radioButton = screen.getByLabelText("Student");
    await userEvent.click(radioButton);
    // Locate the "Submit" button and click on it
    const submitButton = screen.getByRole("button", { name: "Continue" });
    await userEvent.click(submitButton);
    // Check that new page title is correct
    const newTitle2 = screen.getByRole("heading", {
      name: "Register as a student",
    });
    expect(newTitle2).toBeInTheDocument();
    // expect clearError to have happened 4 times - once on homepage, once on Login page, once on Registration page, once on Student registration page
    expect(clearErrorSpy).toHaveBeenCalledTimes(4);
    // check if error message is still present:
    const errorMessage2 = screen.queryByText(/incorrect credentials/i);
    expect(errorMessage2).not.toBeInTheDocument();
    clearErrorSpy.mockRestore();
  });
});
