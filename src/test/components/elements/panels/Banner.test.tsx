import React from "react";
import { Banner } from "../../../../app/components/elements/panels/Banner";
import { renderTestEnvironment } from "../../../utils";
import { screen, within } from "@testing-library/react";

const testBannerDescription = <div className="text-left">This is a test description.</div>;

const mockBannerProps = {
  id: "test-banner",
  title: "Test Banner",
  subtitle: "Here is a test subtitle",
  src: "testimage.png",
  link: "https://examplelink.com",
  alt: "description of image",
  content: testBannerDescription,
};

describe("Banner", () => {
  const setupTest = (props = {}) => {
    renderTestEnvironment({
      PageComponent: Banner,
      componentProps: {
        ...props,
      },
      initialRouteEntries: ["/events/"],
    });
  };

  it("renders title, subtitle, image, link and description with expected attributes", () => {
    setupTest(mockBannerProps);
    const banner = screen.getByTestId(`${mockBannerProps.id}-banner`);
    const title = screen.getByRole("button", { name: mockBannerProps.title });
    const subtitle = screen.getByText(mockBannerProps.subtitle);
    const image = within(banner).getByRole("img");
    const link = screen.getByRole("link", { name: mockBannerProps.subtitle });
    const description = screen.getByTestId("banner-description");
    [banner, title, subtitle, link, description].forEach((element) => {
      expect(element).toBeInTheDocument();
    });
    expect(image).toHaveAttribute("src", mockBannerProps.src);
    expect(image).toHaveAttribute("alt", mockBannerProps.alt);
    expect(description).toHaveTextContent(/test description/i);
    expect(link).toHaveAttribute("href", mockBannerProps.link);
  });

  it("uses a default alt text if none is provided", () => {
    setupTest({ ...mockBannerProps, alt: undefined });
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt", "banner image");
  });
});
