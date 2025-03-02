import { screen } from "@testing-library/react";
import { TestUserRole, renderTestEnvironment } from "../../utils";
import { CareersBanner } from "../../../app/components/elements/CareersBanner";
import { USER_ROLES } from "../../../app/services";

const renderCareers = async (role?: TestUserRole) => {
  renderTestEnvironment({
    PageComponent: CareersBanner,
    initialRouteEntries: ["/"],
    role: role ?? "ANONYMOUS",
  });
};

describe("Careers", () => {
  it("renders section title, video, description and more videos button for logged out user", () => {
    renderCareers();
    const sectionTitle = screen.getByRole("heading", { name: /Careers/i, level: 4 });
    const video = screen.getByTitle(/career-video/i);
    const videoDescription = screen.getByText(/Enrich your understanding of computer science curriculum/i);
    const button = screen.getByRole("link", { name: /see more career videos/i });
    [button, sectionTitle, video, videoDescription].forEach((element) => expect(element).toBeInTheDocument());
    expect(button).toHaveAttribute("href", "/careers_in_computer_science");
    expect(video).toHaveAttribute("src", expect.stringContaining("https://www.youtube-nocookie.com/embed/"));
  });

  it("renders CS Journeys", async () => {
    await renderCareers();
    const csJourneys = screen.getByText(/Computer Science Journeys/i);
    const csJourneysDescription = screen.getByText(/Discover our interview series/i);
    const csJourneysImage = screen.getByRole("img", { name: /cs journeys/i });
    const csJourneysLink = screen.getByRole("link", { name: /read our interviews/i });
    expect(csJourneys).toBeInTheDocument();
    expect(csJourneysLink).toHaveAttribute("href", "/pages/computer_science_journeys_gallery");
    expect(csJourneysDescription).toBeInTheDocument();
    expect(csJourneysImage).toBeInTheDocument();
    expect(csJourneysImage).toHaveAttribute("src", "/assets/cs_journeys.png");
  });

  it.each(USER_ROLES)("shows correct video title for %s role", async (role) => {
    await renderCareers(role);
    const expectedTitle =
      role === "STUDENT" ? /linking computer science to the real world/i : /computer science at work/i;
    const title = await screen.findByText(expectedTitle);
    expect(title).toBeInTheDocument();
  });

  it.each(USER_ROLES)("shows correct video description and more videos button for %s role", async (role) => {
    await renderCareers(role);
    const studentDescription = /Wondering how studying computer science/i;
    const otherRoleDescription = /Looking at how to connect your/i;
    const expectedDescription = role === "STUDENT" ? studentDescription : otherRoleDescription;
    const description = await screen.findByText(expectedDescription);
    const button = screen.getByRole("link", { name: /see more career videos/i });
    expect(description).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/careers_in_computer_science");
  });
});
