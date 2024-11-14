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
            <h1 className="homepage-title">National Computer Science Competition 2024/25</h1>
            <Col lg={6} xs={12} className="pb-3">
              <p className="mt-4 homepage-text">
                Calling all computer science enthusiasts! Isaac Computer Science, ran by the National Centre for
                Computing Education (NCCE), is hosting a national competition that challenges you to imagine, design,
                and pitch a groundbreaking new product for the Internet of Everything (IoE). The competition is a
                fantastic opportunity for students to apply their knowledge to real-world ideas
              </p>
              <p className="mt-4 mb-0 homepage-text">
                Please note: the competition will open in January and last two months. For now, find out more below,
                follow our{" "}
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
                account for updates on when you can enter, and teachers can sign up to our expression of interest form.
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
