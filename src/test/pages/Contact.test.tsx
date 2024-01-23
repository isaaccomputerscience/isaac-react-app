import { TestUserRole, checkPageTitle, renderTestEnvironment } from "../utils";
import { screen, within } from "@testing-library/react";
import { USER_ROLES } from "../../IsaacApiTypes";
import { Contact } from "../../app/components/pages/Contact";
import { SOCIAL_LINKS } from "../../app/services";

describe("Contact", () => {
  const renderContactUs = ({ role = "STUDENT" }: { role?: TestUserRole } = {}) => {
    renderTestEnvironment({
      role: role,
      PageComponent: Contact,
      initialRouteEntries: ["/"],
    });
  };

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

  it.todo("submits with expected values when form is filled correctly");

  it.todo("shows error message if applicable");

  it.todo("shows success message if form successfully submits");

  it.todo("shows pre-populated form if user arrives from a page with a problem");

  it.todo("submitting a form with a content problem report includes the page URL in the report");
});
