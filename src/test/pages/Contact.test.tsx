import { TestUserRole, checkPageTitle, clickButton, renderTestEnvironment } from "../utils";
import { screen, waitFor, within } from "@testing-library/react";
import { USER_ROLES } from "../../IsaacApiTypes";
import { Contact } from "../../app/components/pages/Contact";
import { API_PATH, SOCIAL_LINKS } from "../../app/services";
import { rest } from "msw";
import userEvent from "@testing-library/user-event";
import * as actions from "../../app/state/actions";

const renderContactUs = ({
  role = "STUDENT",
  successfulRequest = true,
}: {
  role?: TestUserRole;
  successfulRequest?: boolean;
} = {}) => {
  renderTestEnvironment({
    role: role,
    PageComponent: Contact,
    initialRouteEntries: ["/"],
    extraEndpoints: [
      rest.post(API_PATH + "/contact", (req, res, ctx) => {
        return successfulRequest
          ? res(ctx.status(200), ctx.json({}))
          : res(
              ctx.status(400),
              ctx.json({
                responseCode: 400,
                responseCodeType: "Bad Request",
                errorMessage: "Missing form details.",
                bypassGenericSiteErrorPage: false,
              }),
            );
      }),
    ],
  });
};

const formFields = {
  firstName: () => screen.getByRole("textbox", { name: /first name/i }),
  lastName: () => screen.getByRole("textbox", { name: /last name/i }),
  email: () => screen.getByRole("textbox", { name: /email address/i }),
  subject: () => screen.getByRole("textbox", { name: /message subject/i }),
  message: () => screen.getByRole("textbox", { name: "Message" }),
};

const contactFormSubmitSpy = jest.spyOn(actions, "submitMessage");

describe("Contact", () => {
  const userRoles: TestUserRole[] = [...USER_ROLES, "ANONYMOUS"];

  it.each(userRoles)("renders with form and expected headings for %s", (role) => {
    renderContactUs({ role });
    checkPageTitle("Contact us");
    const contactForm = screen.getByRole("form");
    const upcomingEvents = screen.getByRole("heading", {
      name: /upcoming events/i,
    });
    const problemWithSite = screen.getByRole("heading", {
      name: /problems with the site\?/i,
    });
    const followUs = screen.getByRole("heading", {
      name: /follow us/i,
    });
    [contactForm, upcomingEvents, problemWithSite, followUs].forEach((el) => expect(el).toBeInTheDocument());
  });

  it("renders expected social links", () => {
    renderContactUs();
    const contactLinks = screen.getByTestId("contact-links");
    Object.values(SOCIAL_LINKS).forEach(({ name, href }) => {
      const link = within(contactLinks).getByRole("link", { name: new RegExp(name, "i") });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", href);
    });
  });

  it("shows correct fields in form and auto-populates user details when a user is logged in", async () => {
    renderContactUs();
    const { firstName } = formFields;
    const allFormFields = Object.values(formFields).map((field) => field());
    allFormFields.forEach((el) => expect(el).toBeInTheDocument());
    await waitFor(() => expect(firstName()).not.toHaveValue(""));
    const expectedValues = ["Test", "Admin", "test-admin@test.com", "", ""];
    allFormFields.forEach((field, index) => expect(field).toHaveValue(expectedValues[index]));
  });

  const fillOutForm = async () => {
    const { firstName, subject, message } = formFields;
    await waitFor(() => expect(firstName()).not.toHaveValue(""));
    const error = screen.queryByRole("alert");
    expect(error).toBeNull();
    await userEvent.type(subject(), "Test subject");
    await userEvent.type(message(), "Test message");
    await clickButton("Submit");
    expect(contactFormSubmitSpy).toHaveBeenCalledWith({
      firstName: "Test",
      lastName: "Admin",
      emailAddress: "test-admin@test.com",
      subject: "Test subject",
      message: "Test message",
    });
  };

  it("submits with expected values when form is filled correctly, and shows success message", async () => {
    renderContactUs();
    await fillOutForm();
    const successMessage = screen.getByText(/Thank you for your message/i);
    expect(successMessage).toBeInTheDocument();
    const error = screen.queryByRole("alert");
    expect(error).toBeNull();
  });

  it("shows error message if form submission fails", async () => {
    renderContactUs({ successfulRequest: false });
    await fillOutForm();
    const successMessage = screen.queryByText(/Thank you for your message/i);
    expect(successMessage).toBeNull();
    const error = screen.getByRole("alert");
    expect(error).toBeInTheDocument();
  });
});

describe("Contact form presets", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  const presetTestCases = [
    { preset: "contentProblem", expected: "Content problem" },
    { preset: "teacherRequest", expected: "Teacher Account Request" },
    { preset: "accountDeletion", expected: "Account Deletion Request" },
  ];
  it.each(presetTestCases)(
    "shows $expected in subject if this information is provided in the URL",
    async ({ preset, expected }) => {
      renderContactUs();
      const mockLocation = {
        search: `?preset=${preset}`,
      };
      Object.defineProperty(window, "location", {
        value: mockLocation,
      });
      const { firstName, subject } = formFields;
      await waitFor(() => expect(firstName()).not.toHaveValue(""));
      expect(subject()).toHaveValue(expected);
    },
  );

  const testCases = ["accordion", "page", "section"];
  it.each(testCases)(
    "shows %s ID in subject if this information is provided and user arrives from a page with a problem",
    async (testCase) => {
      renderContactUs();
      const mockLocation = {
        search: `?preset=contentProblem&${testCase}=example_id`,
      };
      Object.defineProperty(window, "location", {
        value: mockLocation,
      });
      const { firstName, subject } = formFields;
      await waitFor(() => expect(firstName()).not.toHaveValue(""));
      if (testCase === "section") {
        expect((subject() as HTMLInputElement).value).toEqual(expect.stringContaining(', section "example_id"'));
      } else {
        expect(subject()).toHaveValue(`Content problem in "example_id"`);
      }
    },
  );

  it("submitting a form with a content problem report includes the page URL in the message", async () => {
    renderContactUs();
    const mockLocation = {
      search: "?preset=contentProblem&url=https://example.com",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
    });
    const { firstName, message } = formFields;
    await waitFor(() => expect(firstName()).not.toHaveValue(""));
    await userEvent.type(message(), "Test message");
    await clickButton("Submit");
    expect(contactFormSubmitSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("https://example.com") }),
    );
  });
});
