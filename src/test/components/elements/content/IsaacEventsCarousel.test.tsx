import React from "react";
import { screen } from "@testing-library/react";
import { renderTestEnvironment } from "../../../utils";
import { IsaacContent } from "../../../../app/components/content/IsaacContent";

const IsaacEventsCarouselHarness = () => <IsaacContent doc={{ type: "isaacEventsCarousel" }} />;

describe("IsaacEventsCarousel content type", () => {
  const renderInsideIsaacContent = () =>
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: IsaacEventsCarouselHarness,
      initialRouteEntries: ["/"],
    });

  it("renders the events carousel wrapper", () => {
    renderInsideIsaacContent();
    const wrapper = screen.getByTestId("isaac-events-carousel");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders a 'Browse all events' link pointing to /events", () => {
    renderInsideIsaacContent();
    const browseLink = screen.getByRole("link", { name: /browse all events/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute("href", "/events");
  });
});
