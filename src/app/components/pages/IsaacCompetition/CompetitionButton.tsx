import React from "react";
import { Link } from "react-router-dom";
import { Button, Col, Row } from "reactstrap";

const CompetitionButton = () => {
  const competitionInterestButton = [{ to: "/competition-interest", label: "Express your interest" }];

  return (
    <Row>
      {competitionInterestButton.map(({ to, label }) => (
        <Col xs={12} className="py-1" key={to}>
          <Button size="lg" tag={Link} to={to} block className="primary-button text-light">
            {label}
          </Button>
        </Col>
      ))}
    </Row>
  );
};

export default CompetitionButton;
