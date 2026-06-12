import { screen } from "@testing-library/react";
import { renderTestEnvironment } from "../../utils";
import { IsaacCard } from "../../../app/components/content/IsaacCard";
import { IsaacCardDTO } from "../../../IsaacApiTypes";

const renderIsaacCard = (doc: IsaacCardDTO) => {
  renderTestEnvironment({
    PageComponent: IsaacCard,
    componentProps: { doc },
    initialRouteEntries: ["/"],
    role: "ANONYMOUS",
  });
};

describe("IsaacCard", () => {
  it("renders the title and subtitle", () => {
    renderIsaacCard({ title: "Card title", subtitle: "Card subtitle", verticalContent: true });
    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("Card subtitle")).toBeInTheDocument();
  });

  it("renders a custom, centred button when buttonText and clickUrl are provided", () => {
    renderIsaacCard({
      title: "Careers",
      subtitle: "Explore computing careers",
      clickUrl: "/careers_in_computer_science",
      buttonText: "Read more",
      verticalContent: true,
    });
    const button = screen.getByRole("link", { name: "Read more" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "/careers_in_computer_science");
    expect(button).toHaveClass("isaac-card-link");
    expect(button.parentElement).toHaveClass("isaac-card-link-container");
  });

  it("opens external button links in a new tab", () => {
    renderIsaacCard({
      title: "External",
      subtitle: "An external resource",
      clickUrl: "https://example.com/resource",
      buttonText: "Visit resource",
      verticalContent: true,
    });
    const button = screen.getByRole("link", { name: "Visit resource" });
    expect(button).toHaveAttribute("href", "https://example.com/resource");
    expect(button).toHaveAttribute("target", "_blank");
    expect(button).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("falls back to a stretched whole-card link when no buttonText is provided", () => {
    renderIsaacCard({
      title: "Create a Group",
      subtitle: "Create and manage student groups.",
      clickUrl: "/groups",
      verticalContent: true,
    });
    expect(screen.queryByRole("link", { name: /read more/i })).not.toBeInTheDocument();
    const link = document.querySelector("a.stretched-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/groups");
  });
});
