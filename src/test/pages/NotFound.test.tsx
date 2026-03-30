import { screen } from "@testing-library/react";
import { renderTestEnvironment } from "../utils";
import { NotFound } from "../../app/components/pages/NotFound";

describe("NotFound page", () => {
  it("adds a prefilled subject when linking to contact us", () => {
    renderTestEnvironment({
      PageComponent: NotFound,
      initialRouteEntries: ["/missing-page"],
    });

    const contactLink = screen.getByRole("link", { name: /contact us/i });
    expect(contactLink).toHaveAttribute("href", '/contact?subject=Page%20not%20found%20%22%2Fmissing-page%22');
  });
});
