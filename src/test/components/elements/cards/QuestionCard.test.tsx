import { screen, waitFor } from "@testing-library/react";
import { clickButton, renderTestEnvironment } from "../../../utils";
import QuestionCard from "../../../../app/components/elements/cards/QuestionCard";
import { mockRandomQuestions } from "../../../../mocks/data";

describe("QuestionCard", () => {
  const mockSetExpanded = jest.fn();

  window.HTMLElement.prototype.scrollIntoView = jest.fn();

  const setupTest = async () => {
    renderTestEnvironment({
      role: "STUDENT",
      PageComponent: QuestionCard,
      componentProps: {
        setExpanded: mockSetExpanded,
        questionData: mockRandomQuestions,
      },
      initialRouteEntries: ["/"],
    });
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });
  };

  it("renders question data, next question button, expand button and a check answer button", async () => {
    await setupTest();
    const questionTile = screen.getByTestId("question-tile");
    const nextQuestion = screen.getByText("Next question");
    const question = screen.getByText(mockRandomQuestions[0].children[0].value!);
    const checkAnswerButton = screen.getByRole("button", { name: "Check my answer" });
    const expandButton = screen.getByRole("button", {
      name: /expand content/i,
    });
    [nextQuestion, questionTile, question, checkAnswerButton, expandButton].forEach((element) => {
      expect(element).toBeInTheDocument();
    });
  });

  it("renders the question tile as minimised by default, and expands to panel when the expand button is clicked", async () => {
    await setupTest();
    const questionTile = screen.getByTestId("question-tile");
    expect(questionTile).toHaveClass("question-tile");
    const questionContents = screen.getByTestId("question-content-card");
    expect(questionContents).not.toHaveClass("random-question-panel");
    await clickButton("Expand content");
    expect(questionTile).not.toHaveClass("question-tile");
    expect(questionContents).toHaveClass("random-question-panel");
  });

  it("renders the next question if next question button is pressed", async () => {
    await setupTest();
    await clickButton("Next question");
    const question = screen.getByText(mockRandomQuestions[1].children[0].value!);
    expect(question).toBeInTheDocument();
  });

  it("offers a link to the question finder if next question button has been pressed 5 times", async () => {
    await setupTest();
    for (let i = 0; i < 5; i++) {
      await clickButton("Next question");
    }
    const questionFinder = screen.getByRole("link", { name: "Go to Question Finder" });
    expect(questionFinder).toHaveAttribute("href", "/gameboards/new");
  });
});
