import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../../services";
import { TitleAndBreadcrumb } from "../../elements/TitleAndBreadcrumb";
import "../../../../scss/cs/competition.scss";
import { Col, Container, Row } from "reactstrap";
import content from "./content";
import IoECard from "./Section2/IoECard";
import TestimonialComment from "../../elements/TestimonialComment";

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  const { section2 } = content;

  return (
    <>
      <TitleAndBreadcrumb currentPageTitle="Isaac Competition" breadcrumbTitleOverride="Isaac Competition" />

      <div id="section1">
        <h1>Section 1</h1>
      </div>

      <section id="internetOfEverything" className="event-section">
        <div className="event-section-background-img">
          <Container>
            <Row className="py-4">
              <Col xs={12} lg={6}>
                <IoECard title={section2.ioe.title} content={section2.ioe.section} />
              </Col>
              <Col xs={12} lg={6} className="mt-4 mt-lg-0">
                <IoECard title={section2.examples.title} content={section2.examples.section} isList />
              </Col>
            </Row>
            <div className="pb-4">
              <TestimonialComment imageSrc="/assets/star.svg" altText="Star" text={section2.testamonial.text} />
            </div>
          </Container>
        </div>
      </section>
    </>
  );
};
