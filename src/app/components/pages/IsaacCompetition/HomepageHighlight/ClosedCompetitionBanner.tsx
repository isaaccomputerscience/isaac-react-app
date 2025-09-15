import React from "react";
import { Row, Col } from "reactstrap";
import { CLOSED_MESSAGE } from "../constants";

const ClosedCompetitionBanner = () => {
  return (
    <Row className="homepage-highlight rounded justify-content-center">
      <Col xs={12} className="text-center">
        <h1 className="homepage-highlight-title py-4">2025 National Computer Science competition</h1>
        <h1 className="homepage-highlight-sub-title pb-4">{CLOSED_MESSAGE}</h1>
      </Col>
    </Row>
  );
};

export default ClosedCompetitionBanner;
