import { screen } from "@testing-library/react";
import { Homepage } from "../../app/components/site/Homepage";
import { renderTestEnvironment } from "../utils";

describe("Homepage", () => {
  it("renders the 'Why choose us' section with the correct content and links", () => {
    renderTestEnvironment({
      PageComponent: Homepage,
      initialRouteEntries: ["/"],
      role: "ANONYMOUS",
    });

    const section = document.getElementById("why-choose-us");
    expect(section).toBeInTheDocument();

    expect(
      screen.getByRole("img", {
        name: "A teacher sat with students in a library, talking about content in a textbook in front of them.",
      }),
    ).toHaveAttribute("src", "/assets/homepage-students-image.png");

    const teacherLink = screen.getByRole("link", { name: /Benefits for teachers/i });
    const studentLink = screen.getByRole("link", { name: /Benefits for students/i });

    expect(teacherLink).toHaveAttribute("target", "_blank");
    expect(studentLink).toHaveAttribute("target", "_blank");
  });
});
