import React, {useRef, useState} from "react";
import {Alert, Button, Col, Row} from "reactstrap";
import * as ApiTypes from "../../../IsaacApiTypes";
import {ContentDTO} from "../../../IsaacApiTypes";
import {IsaacContentValueOrChildren} from "./IsaacContentValueOrChildren";
import {useDispatch} from "react-redux";
import {logAction} from "../../state/actions";
import {determineFastTrackSecondaryAction, useFastTrackInformation} from "../../services/fastTrack";
import {RouteComponentProps, withRouter} from "react-router";
import uuid from "uuid";
import {ConfidenceQuestions} from "../elements/inputs/QuestionConfidence";

export const IsaacQuickQuestion = withRouter(({doc, location}: {doc: ApiTypes.IsaacQuickQuestionDTO} & RouteComponentProps) => {
    const dispatch = useDispatch();
    const fastTrackInfo = useFastTrackInformation(doc, location);
    const [isVisible, setVisible] = useState(false);
    const [hideOptions, setHideOptions] = useState(false);
    const answer: ContentDTO = doc.answer as ContentDTO;
    const secondaryAction = determineFastTrackSecondaryAction(fastTrackInfo);
    const attemptUuid = useRef(uuid.v4().slice(0, 8));
    const showConfidence = doc.showConfidence;

    const toggle = (payload?: string) => {
        if (showConfidence) {
            if (isVisible) {
                const eventDetails = {type: "QUICK_QUESTION_CORRECT", questionId: doc.id, attemptUuid: attemptUuid.current, correct: payload};
                dispatch(logAction(eventDetails));
                setHideOptions(true);
                attemptUuid.current = uuid.v4().slice(0, 8);
            } else {
                const eventDetails = {type: "QUICK_QUESTION_CONFIDENCE", questionId: doc.id, attemptUuid: attemptUuid.current, confidence: payload};
                dispatch(logAction(eventDetails));
                const isNowVisible = !isVisible;
                setVisible(isNowVisible);
            }
        } else {
            const isNowVisible = !isVisible;
            setVisible(isNowVisible);
            if (isNowVisible) {
                const eventDetails = {type: "QUICK_QUESTION_SHOW_ANSWER", questionId: doc.id};
                dispatch(logAction(eventDetails));
            }
        }
    };

    const hideAnswer = () => {
        setVisible(false);
        setHideOptions(false);
        attemptUuid.current = uuid.v4().slice(0, 8);
    };

    const defaultOptions = <Row>
        <Col sm="12" md={{size: 10, offset: 1}}>
            <Button color="secondary" block className={isVisible ? "active" : ""} onClick={() => toggle()}>
                {isVisible ? "Hide answer" : "Show answer"}
            </Button>
        </Col>
    </Row>

    return <form onSubmit={e => e.preventDefault()}>
        <div className="question-component p-md-5">
            <div className={!fastTrackInfo.isFastTrackPage ? "quick-question" : ""}>
                <div className="question-content clearfix">
                    <IsaacContentValueOrChildren {...doc} />
                </div>
                {!fastTrackInfo.isFastTrackPage ?
                    showConfidence ?
                        ConfidenceQuestions({hideOptions, isVisible, toggle})
                        :
                        defaultOptions
                    :
                    <div className={`d-flex align-items-stretch flex-column-reverse flex-sm-row flex-md-column-reverse flex-lg-row mb-4`}>
                        {secondaryAction && <div className={`m-auto pt-3 pb-1 w-100 w-sm-50 w-md-100 w-lg-50 pr-sm-2 pr-md-0 pr-lg-3`}>
                            <input {...secondaryAction} className="h-100 btn btn-outline-primary btn-block" />
                        </div>}
                        <div className={`m-auto pt-3 pb-1 w-100 w-sm-50 w-md-100 w-lg-50 "pl-sm-2 pl-md-0 pl-lg-3`}>
                            <input
                                onClick={() => toggle("fasttrack")} value={isVisible ? "Hide answer" : "Show answer"}
                                className={`h-100 btn btn-secondary btn-block {isVisible ? "active" : ""}`}
                            />
                        </div>
                    </div>
                }
                {isVisible && showConfidence && !fastTrackInfo.isFastTrackPage  && <Row className="mt-3">
                    <Col sm="12" md="12">
                        <Button color="secondary" block className="active" onClick={hideAnswer}>
                            Hide answer
                        </Button>
                    </Col>
                </Row>
                }
                {isVisible && <Row>
                    <Col sm="12" md={!fastTrackInfo.isFastTrackPage ? {size: 10, offset: 1} : {}}>
                        <Alert color="secondary">
                            <IsaacContentValueOrChildren {...answer} />
                        </Alert>
                    </Col>
                </Row>}
            </div>
        </div>
    </form>;
});
