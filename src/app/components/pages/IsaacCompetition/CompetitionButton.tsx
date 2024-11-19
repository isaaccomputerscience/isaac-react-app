import React from "react";
import { Link } from "react-router-dom";
import { Button, Col, Row } from "reactstrap";

export const IsaacCompetition = () => {
  const CompetitionButton = () => {
    const competitionInterestButton = [{ to: "/competition-sign-up", label: "Express your interest" }];

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
};
