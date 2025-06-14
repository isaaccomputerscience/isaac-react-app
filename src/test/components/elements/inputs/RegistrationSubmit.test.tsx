import { screen } from "@testing-library/react";
import { RegistrationSubmit } from "../../../../app/components/elements/inputs/RegistrationSubmit";
import { getFormFields, renderTestEnvironment } from "../../../utils";
import userEvent from "@testing-library/user-event";

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

  it("renders the component", () => {
    setupTest();
    expect(screen.getByText(/by ticking this box/i)).toBeInTheDocument();
    const { submitButton } = getFormFields();
    expect(submitButton()).toBeInTheDocument();
  });

  it("submit button is enabled when isRecaptchaTicked is true", async () => {
    setupTest();
    const consentCheckbox = screen.getByRole("checkbox", { name: "Consent checkbox" });
    await userEvent.click(consentCheckbox);
    const { submitButton } = getFormFields();
    expect(submitButton()).toBeEnabled();
  });

  it("disables the submit button when isRecaptchaTicked is false", () => {
    setupTest({
      isRecaptchaTicked: false,
    });
    const { submitButton } = getFormFields();
    expect(submitButton()).toBeDisabled();
  });

  it("renders Terms of Use link", () => {
    setupTest();
    const termsLink = screen.getByRole("link", { name: /terms of use/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.getAttribute("href")).toBe("/terms");
  });

  it("renders Privacy Policy link", () => {
    setupTest();
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.getAttribute("href")).toBe("/privacy");
  });
});
