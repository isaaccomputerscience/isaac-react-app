import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../../services";
import { TitleAndBreadcrumb } from "../../elements/TitleAndBreadcrumb";
import { Button, Col, Container, Row } from "reactstrap";
import { Link } from "react-router-dom";
import content from "./content";

const { section1 } = content;

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

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

  return (
    <>
      <Container>
        <TitleAndBreadcrumb currentPageTitle="Isaac Competition" breadcrumbTitleOverride="Isaac Competition" />
      </Container>
      <div id="competition-headline-section">
        <Container className="pt-4 pb-4 z1">
          <Row>
            <h1 className="primary-heading pl-3">National Computer Science Competition</h1>
            <Col xs={12} md={6} lg={8} className="pb-3">
              <p className="mt-4 body-text">{section1.header.section}</p>
              <p className="mt-4 mb-0 body-text">
                <span style={{ fontWeight: 700 }}>{section1.note.heading}</span> {section1.note.entryDetails}{" "}
                <a
                  href={section1.note.xLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  X
                </a>{" "}
                and{" "}
                <a
                  href={section1.note.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  Facebook
                </a>{" "}
                {section1.note.callToAction}
              </p>
              <Row className="justify-content-left mt-4">
                <Col xs="auto">
                  <CompetitionButton />
                </Col>
              </Row>
            </Col>
            <Col lg={4} md={6} className="order-lg-2 order-3 mt-4 mt-lg-0 pb-5 pb-md-0">
              <img
                src="/assets/competition-image.png"
                alt="Competition"
                className="img-fluid d-none d-md-block"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};
