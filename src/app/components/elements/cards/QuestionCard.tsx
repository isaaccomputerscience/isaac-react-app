import React, { useEffect, useState } from "react";
import { useExpandContent } from "../markup/portals/Tables";
import { useStatefulElementRef } from "../markup/portals/utils";
import { Button, Card, CardBody, Row } from "reactstrap";
import classnames from "classnames";
import { IsaacContent } from "../../content/IsaacContent";
import { getRandomQuestions, selectors, useAppDispatch, useAppSelector } from "../../../state";

const goToQuestionFinder = (
  <>
    <h2>All done! Want more questions?</h2>
    <Row className="w-75 mx-auto mt-5 mb-3">
      <Button href="/gameboards/new" className="btn-block btn-lg btn-primary">
        Go to Question Finder
      </Button>
    </Row>
  </>
);

const QuestionCard = ({ setExpanded }: { setExpanded: (expanded: boolean) => void }) => {
  const [expandRef, updateExpandRef] = useStatefulElementRef<HTMLDivElement>();
  const { expandButton, outerClasses, expanded } = useExpandContent(true, expandRef);
  const [question, setQuestion] = useState<number>(0);
  const questionData = useAppSelector(selectors.questions.randomQuestions);
  const isMoreQuestions = question < 5 && questionData != null;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getRandomQuestions());
  }, [dispatch]);

  useEffect(() => {
    setExpanded(expanded);
  }, [expanded, setExpanded]);

  useEffect(() => {
    console.log(questionData);
  }, [questionData]);

  return (
    <div className={!expanded ? "question-tile" : ""}>
      <Row className="m-0 d-flex justify-content-between">
        <h3 className="font-weight-normal m-0 align-self-baseline">Quick question!</h3>
        {isMoreQuestions && (
          <Button className="next-question bg-transparent border-0 btn-link" onClick={() => setQuestion(question + 1)}>
            Next question
          </Button>
        )}
      </Row>
      <Card
        className={classnames(outerClasses, expanded ? "random-question-panel" : "mt-2 pb-2")}
        style={expanded ? { maxHeight: "560px" } : { maxHeight: "450px" }}
      >
        <CardBody className="p-3">
          <div
            id="question-content"
            ref={updateExpandRef}
            style={expanded ? { maxHeight: "500px" } : { maxHeight: "400px" }}
            className="overflow-auto hidden-scrollbar"
          >
            {isMoreQuestions ? <IsaacContent doc={questionData[question]} /> : goToQuestionFinder}
          </div>
          {expanded ? expandButton : isMoreQuestions && expandButton}
        </CardBody>
      </Card>
    </div>
  );
};

export default QuestionCard;
