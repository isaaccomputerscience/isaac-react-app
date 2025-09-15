import React from "react";
import { Row, Col } from "reactstrap";
import CompetitionButton from "../Buttons/CompetitionButton";

const ExpressionOfInterestBanner = () => {
  return (
    <Row className="homepage-highlight rounded justify-content-center">
      <Col xs={12} className="text-center">
        <h1 className="homepage-highlight-title py-4">National Computer Science Competition 2025/26</h1>
        <h1 className="homepage-highlight-sub-title pb-4">Opening November 2025</h1>
      </Col>
      <Col xs={12} className="pb-4 text-center d-flex justify-content-center">
        <CompetitionButton
          buttons={[
            {
              to: "https://forms.office.com/e/23bsQuZfjm",
              label: "Be the first one to know",
            },
          ]}
        />
      </Col>
    </Row>
  );
};

export default ExpressionOfInterestBanner;
