import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AccordionItem from "../../app/components/pages/IsaacCompetition/Accordion/AccordionItem";

describe("AccordionItem", () => {
  const defaultProps = {
    id: "1",
    title: "Test Title",
    section: ["First line", "Second line", "Third line", "Fourth line"],
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

  it("renders the section content correctly when open", () => {
    render(<AccordionItem {...defaultProps} open="1" />);
    expect(screen.getByText("First line")).toBeInTheDocument();
    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(screen.getByText("Third line")).toBeInTheDocument();
    expect(screen.getByText("Fourth line")).toBeInTheDocument();
  });

  it("renders the section content as a list when it contains a sub-array", () => {
    const listProps = {
      ...defaultProps,
      section: ["First line", ["Second line", "Third line"], "Fourth line"],
      open: "1",
    };
    render(<AccordionItem {...listProps} />);
    expect(screen.getByText("First line")).toBeInTheDocument();
    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(screen.getByText("Third line")).toBeInTheDocument();
    expect(screen.getByText("Fourth line")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders the section content as paragraphs when it does not contain a sub-array", () => {
    const paragraphProps = {
      ...defaultProps,
      section: ["First line", "Second line", "Third line", "Fourth line"],
      open: "1",
    };
    render(<AccordionItem {...paragraphProps} />);
    expect(screen.getByText("First line")).toBeInTheDocument();
    expect(screen.getByText("Second line")).toBeInTheDocument();
    expect(screen.getByText("Third line")).toBeInTheDocument();
    expect(screen.getByText("Fourth line")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
