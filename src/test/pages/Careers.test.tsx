import { screen } from "@testing-library/react";
import { Careers } from "../../app/components/pages/Careers";
import { renderTestEnvironment } from "../utils";
import careerVideos from "../../app/assets/career_videos.json";

const renderCareers = () => {
  renderTestEnvironment({
    PageComponent: Careers,
    initialRouteEntries: ["/careers_in_computer_science"],
  });
};

describe("Careers", () => {
  it("displays the page title correctly", () => {
    renderCareers();
    const pageTitle = screen.getByRole("heading", { name: "Careers" });
    expect(pageTitle).toBeInTheDocument();
  });

  it("shows the events section", () => {
    renderCareers();
    const eventsSection = screen.getByRole("heading", { name: "Events" });
    expect(eventsSection).toBeInTheDocument();
  });

  it.each(careerVideos)(
    "shows $title video, with link to content page, correct speaker name, role, description and link to video",
    ({ id, title, description, name, job, url }) => {
      renderCareers();
      // Career videos render through IsaacVideo, which titles its player container
      // "Embedded video: <altText>." — in jsdom the YouTube iframe API never loads,
      // so there is no iframe/src to assert on.
      const careerVideo = screen.getByTitle(`Embedded video: ${title}.`);
      const speakerName = screen.getAllByTestId("video-speaker");
      const speakerRole = screen.getAllByTestId("speaker-role");
      const videoDescription = screen.getAllByTestId("video-description");
      const videoTitleAndLink = screen.getByText(title);
      expect(careerVideo).toBeInTheDocument();
      expect(speakerName[id - 1]).toHaveTextContent(name);
      expect(speakerRole[id - 1]).toHaveTextContent(job);
      const expectedText = description.trim();
      const receivedText = videoDescription[id - 1].textContent?.trim();
      expect(receivedText).toBe(expectedText);
      expect(videoTitleAndLink).toHaveAttribute("href", expect.stringContaining(url));
    },
  );
});
