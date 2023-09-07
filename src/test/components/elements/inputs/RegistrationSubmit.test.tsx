import { screen } from "@testing-library/react";
import { RegistrationSubmit } from "../../../../app/components/elements/inputs/RegistrationSubmit";
import { renderTestEnvironment } from "../../../utils";

describe("RegistrationSubmit", () => {
  const setupTest = (props = {}) => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: RegistrationSubmit,
      componentProps: {
        isRecaptchaTicked: true,
        ...props,
      },
      initialRouteEntries: ["/register/student"],
    });
  };

  it("renders the component, and submit button is enabled when isRecaptchaTicked is true", async () => {
    setupTest();
    expect(
      screen.getByText(/by clicking 'register my account'/i)
    ).toBeInTheDocument();
    const submitButton = screen.getByRole("button", {
      name: /register my account/i,
    });
    expect(submitButton).not.toBeDisabled();
  });

  it("disables the submit button when isRecaptchaTicked is false", async () => {
    setupTest({
      isRecaptchaTicked: false,
    });
    const submitButton = screen.getByRole("button", {
      name: /register my account/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("renders Terms of Use link", async () => {
    setupTest();
    const termsLink = screen.getByRole("link", { name: /terms of use/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.getAttribute("href")).toBe("/terms");
  });

  it("renders Privacy Policy link", async () => {
    setupTest();
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.getAttribute("href")).toBe("/privacy");
  });
});
