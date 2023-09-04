import React from "react";
import { render, screen } from "@testing-library/react";
import { PromoContent } from "../../../app/components/elements/PromoContent";
import { mockPromoPods } from "../../../mocks/data";
import { Provider } from "react-redux";
import { store } from "../../../app/state";
import { MemoryRouter } from "react-router";
import { IsaacPodDTO } from "../../../IsaacApiTypes";

const mockItem = mockPromoPods.results[0];

const renderPromoContent = ({
  promoContent,
}: {
  promoContent: IsaacPodDTO;
}) => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <PromoContent item={promoContent} />
      </MemoryRouter>
    </Provider>
  );
};

describe("PromoContent", () => {
  it("renders title, subtitle, image, url, value", () => {
    renderPromoContent({ promoContent: mockItem });
    const title = screen.getByText(mockItem.title);
    const subtitle = screen.getByText(mockItem.subtitle);
    const imageAltText = screen.getByAltText(mockItem.image.altText);
    const value = screen.getByText(mockItem.value);
    const titleLink = screen.getByRole("link", { name: mockItem.title });
    const imageSrc = screen
      .getByRole("img", { name: mockItem.image.altText })
      .getAttribute("src");
    expect(title).toBeInTheDocument();
    expect(subtitle).toBeInTheDocument();
    expect(imageAltText).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", mockItem.url);
    expect(value).toBeInTheDocument();
    expect(imageSrc).toContain(mockItem.image.src);
  });

  it("if image is not present, default image and alt text are used", () => {
    renderPromoContent({ promoContent: { ...mockItem, image: undefined } });
    const image = screen.getByAltText("promo image");
    expect(image).toBeInTheDocument();
    const imageSrc = image.getAttribute("src");
    expect(imageSrc).toContain("/assets/ics_hero.svg");
  });
});
