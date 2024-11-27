import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AccordionItem from "../../app/components/pages/IsaacCompetition/Accordion/AccordionItem";

describe("AccordionItem", () => {
  const defaultProps = {
    id: "1",
    title: "Test Title",
    section: ["First line", "Second line", "Third line"],
    open: null,
    isLast: false,
    isList: true,
    setOpenState: jest.fn(),
  };

  it("renders the title", () => {
    render(<AccordionItem {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("calls setOpenState when clicked", () => {
    render(<AccordionItem {...defaultProps} />);
    fireEvent.click(screen.getByText("Test Title"));
    expect(defaultProps.setOpenState).toHaveBeenCalledWith("1");
  });

  it("applies the correct classes when open", () => {
    render(<AccordionItem {...defaultProps} open="1" />);
    expect(screen.getByText("Test Title").closest(".card-header")).toHaveClass(
      "accordion-button p-3 m-0 d-flex justify-content-between card-header",
    );
  });

  it("applies the correct classes when closed", () => {
    render(<AccordionItem {...defaultProps} open="2" />);
    expect(screen.getByText("Test Title").closest(".card-header")).toHaveClass("border-bottom border-dark");
  });

  it("applies the rounded-bottom class when isLast is true", () => {
    render(<AccordionItem {...defaultProps} isLast={true} />);
    expect(screen.getByText("Test Title").closest(".card-header")).toHaveClass("rounded-bottom border-bottom-0");
  });
});
