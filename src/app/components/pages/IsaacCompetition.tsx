import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../services";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import { Button, Col, Container, Row } from "reactstrap";
import { Link } from "react-router-dom";

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  const CompetitionButton = ({ loggedIn }: { loggedIn: boolean | undefined }) => {
    const competitionInterestButton = [{ to: "/competition-sign-up", label: "Express your interest" }];

    return (
      <Row>
        {competitionInterestButton.map(({ to, label }) => (
          <Col xs={12} lg={loggedIn ? 12 : 4} className="py-1" key={to}>
            <Button size="lg" tag={Link} to={to} block className="homepage-button text-light">
              {label}
            </Button>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Container>
      <TitleAndBreadcrumb currentPageTitle="Isaac Competition" breadcrumbTitleOverride="Isaac Competition" />

      <div id="section1">
        <Container className="pt-4 z1">
          <Row>
            <h1 className="homepage-title">National Computer Science Competition</h1>
            <Col lg={6} xs={12} className="pb-3">
              <p className="mt-4 homepage-text">
                Calling all computer science fans! Isaac Computer Science, ran by the National Centre for Computing
                Education (NCCE), is hosting a national competition that challenges students to imagine, design, and
                pitch a groundbreaking new product for the Internet of Everything. The competition is a fantastic
                opportunity for students to apply their knowledge to real-world ideas
              </p>
              <p className="mt-4 mb-0 homepage-text">
                Please note: Competition entries open in January and last two months. Students will be able to submit
                their entries until 17 March. Follow our{" "}
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
                  <CompetitionButton loggedIn={undefined} />
                </Col>
              </Row>
            </Col>
            <Col lg={6} className="order-lg-2 order-3 mt-4 mt-lg-0 pb-5 pb-md-0">
              <img
                src="/assets/competition-image.png"
                alt="Competition"
                className="img-fluid d-none d-md-block"
                style={{ maxWidth: "360px", height: "360px" }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      <div id="section2">
        <h1>Section 2</h1>
      </div>
    </Container>
  );
};
