import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../../services";
import { TitleAndBreadcrumb } from "../../elements/TitleAndBreadcrumb";
import { Button, Col, Container, Row } from "reactstrap";
import { Link } from "react-router-dom";

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
        <Container className="pt-4 z1">
          <Row>
            <h1 className="primary-heading pl-3">National Computer Science Competition</h1>
            <Col xs={12} md={6} lg={8} className="pb-3">
              <p className="mt-4 body-text">
                Calling all computer science fans! Isaac Computer Science, ran by the National Centre for Computing
                Education (NCCE), is hosting a national competition that challenges students to imagine, design, and
                pitch a groundbreaking new product for the Internet of Everything. The competition is a fantastic
                opportunity for students to apply their knowledge to real-world ideas
              </p>
              <p className="mt-4 mb-0 body-text">
                <span style={{ fontWeight: 700 }}>Please note:</span> Competition entries open in January and last two
                months. Students will be able to submit their entries until 17 March. Follow our{" "}
                <a
                  href="https://x.com/isaaccompsci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  X
                </a>{" "}
                and{" "}
                <a
                  href="https://www.facebook.com/IsaacComputerScience"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  Facebook
                </a>{" "}
                accounts for updates and teachers can sign up to our expression of interest form below.
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
