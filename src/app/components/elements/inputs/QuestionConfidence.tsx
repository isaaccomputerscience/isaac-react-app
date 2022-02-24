import {Button, Col, Row} from "reactstrap";
import React from "react";
import {closeActiveModal, openActiveModal} from "../../../state/actions";
import {useDispatch} from "react-redux";


interface QuestionConfidenceProps {
    hideOptions: boolean;
    isVisible: boolean;
    toggle: (payload?: string) => void;
}

export const ConfidenceQuestions = ({hideOptions, isVisible, toggle}: QuestionConfidenceProps) => {
    const dispatch = useDispatch();

    function quickQuestionInformationModal() {
        dispatch(openActiveModal({
            closeAction: () => {dispatch(closeActiveModal())},
            title: "Information",
            body: <Row className="mb-3">
                <Col>
                    <span>
                    We regularly review and update the Isaac platform’s content and would like your input in order to
                    prioritise content and assess the impact of updates. Data captured with these buttons will help us
                    identify priority areas.
                    </span>
                </Col>
            </Row>
        }))
    }

    return <div className="quick-question-options" hidden={hideOptions}>
        {!isVisible && <Row>
            <Col md="9">
                <h4>Click a button to show the answer</h4>
            </Col>
            <Col md="3" className="text-center not-mobile">
                <Button outline color="primary" className="confidence-help" size="sm" onClick={() => quickQuestionInformationModal()}><i>i</i></Button>
            </Col>
        </Row>}
        <Row className="mb-2">
            <Col>
                {isVisible ? "Is your own answer correct?" : "What is your level of confidence that your own answer is correct?"}
            </Col>
        </Row>
        <Row>
            <Col sm="3" md="3" className="mx-auto mb-2">
                <Button color="negative" block className={isVisible ? "active" : ""} onClick={() => toggle(isVisible ? "No" : "Low")}>
                    {isVisible ? "No" : "Low"}
                </Button>
            </Col>
            <Col sm="3" md="3" className="mx-auto mb-2">
                <Button color="neutral" block className={isVisible ? "active" : ""} onClick={() => toggle(isVisible ? "Partly" : "Medium")}>
                    {isVisible ? "Partly" : "Medium"}
                </Button>
            </Col>
            <Col sm="3" md="3" className="mx-auto mb-2">
                <Button color="positive" block className={isVisible ? "active" : ""} onClick={() => toggle(isVisible ? "Yes" : "High")}>
                    {isVisible ? "Yes" : "High"}
                </Button>
            </Col>
        </Row>
    </div>;
};
