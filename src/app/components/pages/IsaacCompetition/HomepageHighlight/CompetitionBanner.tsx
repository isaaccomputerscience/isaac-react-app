import React from "react";
import { Row, Col } from "reactstrap";
import CompetitionButton from "../Buttons/CompetitionButton";

const CompetitionBanner = () => {
  return (
    <Row className="homepage-highlight rounded justify-content-center">
      <Col xs={12} className="text-center">
        <h1 className="homepage-highlight-sub-title py-4">2025 National Computer Science competition</h1>
        <h1 className="homepage-highlight-title pb-4">Entries are now open</h1>
      </Col>
      <Col xs={12} className="pb-4 text-center d-flex justify-content-center">
        <CompetitionButton
          buttons={[
            {
              to: "/national-computer-science-competition",
              label: "Enter the competition",
            },
          ]}
        />
      </Col>
    </Row>
  );
};

export default CompetitionBanner;
