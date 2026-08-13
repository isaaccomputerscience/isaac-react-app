import React, { useEffect, useRef, useState } from "react";
import { SITE_SUBJECT_TITLE } from "../../../services";
import { BreadcrumbTrail } from "../../elements/TitleAndBreadcrumb";
import { Col, Container, Row } from "reactstrap";
import content from "./content";
import "../../../../scss/cs/competition.scss";
import Accordion from "./Accordion/Accordion";
import InformationCard from "./CompetitionInformation/InformationCard";
import CompetitionTimeline from "./CompetitionInformation/CompetitionTimeline";
import EntryFormHandler, { eoiButton } from "./EntryForm/EntryFormHandler";
import CompetitionButton from "./Buttons/CompetitionButton";
import CompetitionWrapper from "./CompetitionWrapper";
import { liveQandASessionDate } from "./dateUtils";

const { section1, section3, accordion } = content;

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  const buttons = [
    {
      to: "/login",
      label: "Submit a project",
    },
  ];

  const [open, setOpen] = useState<string | null>(null);

  const setOpenState = (id?: string) => {
    setOpen(id ?? null);
  };

  const accordionRef = useRef<HTMLDivElement>(null);

  const handleTermsClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    if (accordionRef.current) {
      accordionRef.current.scrollIntoView({ behavior: "smooth" });
      setOpen("7");
    }
  };

  const handleRulesAndSupportClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    if (accordionRef.current) {
      accordionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const accordionSections = [
    { id: "0", title: accordion.internetOfEverything.title, section: accordion.internetOfEverything.section },
    { id: "1", title: accordion.entryRequirements.title, section: accordion.entryRequirements.section },
    { id: "2", title: accordion.assessmentCriteria.title, section: accordion.assessmentCriteria.section },
    { id: "3", title: accordion.groupEntry.title, section: accordion.groupEntry.section },
    {
      id: "4",
      title: accordion.availableSupportAndResources.title,
      section: accordion.availableSupportAndResources.section,
    },
    { id: "5", title: accordion.termsAndConditions.title, section: accordion.termsAndConditions.section },
  ];

  return (
    <>
      <Container>
        <BreadcrumbTrail currentPageTitle="Isaac Competition" />
      </Container>
      <section id="competition-headline-section">
        <Container className="pt-4 z1">
          <Row className="pb-5">
            <h1 className="primary-heading pl-3">National Computer Science Competition</h1>
            <Col xs={12} md={6} className="pb-3">
              <p className="mt-4 body-text">{section1.header.section1}</p>
              <p className="mt-4 body-text">{section1.header.section2}</p>
              <p className="mt-4 mb-0 body-text">
                <span>{section1.note.entryDetails} </span>
                <a
                  href={section1.note.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-underline"
                >
                  Facebook
                </a>
                {` and `}
                <a
                  href={section1.note.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-underline"
                >
                  Instagram
                </a>
                {` ${section1.note.callToAction}`}
              </p>
              <Row className="justify-content-left mt-4">
                <Col xs="auto">
                  <CompetitionWrapper beforeCompetitionOpenContent={<CompetitionButton buttons={[eoiButton]} />}>
                    {null}
                  </CompetitionWrapper>
                </Col>
              </Row>
            </Col>
            <Col xs={12} md={6} className="mt-4 mt-md-0 pb-md-0 d-none d-md-block">
              <figure className="competition-hero-image mb-3">
                <img
                  src="/assets/new_homepage_image.png"
                  alt="The 2025/2026 competition winners"
                  className="img-fluid"
                />
              </figure>
              <p className="competition-hero-caption text-center mt-2 mb-0 px-5">{section1.imageCaption}</p>
            </Col>
          </Row>
        </Container>
        <EntryFormHandler buttons={buttons} handleTermsClick={handleTermsClick} />
      </section>
      <section id="internetOfEverything" className="event-section">
        <div className="event-section-background-img"></div>
      </section>

      <section id="competition-information-section">
        <Container className="pt-5 pb-4 z1">
          <Row className="py-4">
            <Col xs={12} lg={6}>
              <InformationCard
                title={section3.howItWorks.title}
                content={section3.howItWorks.steps}
                className="competition-information-default-background"
                onRulesAndSupportClick={handleRulesAndSupportClick}
              />
            </Col>
            {liveQandASessionDate > new Date() ? (
              <Col xs={12} lg={6} className="mt-4 mt-lg-0">
                <InformationCard
                  title={section3.whyJoin.title}
                  content={section3.whyJoin.benefits}
                  isList
                  className="competition-information-default-background"
                />
              </Col>
            ) : (
              <Col xs={12} lg={6} className="mt-4 mt-lg-0">
                <InformationCard
                  title={section3.qanda.title}
                  content={[section3.qanda.description]}
                  videoUrl={section3.qanda.videoUrl}
                  className="competition-information-default-background"
                />
              </Col>
            )}
          </Row>
          <Row className="py-4">
            <Col xs={12} lg={6}>
              <InformationCard
                title={section3.eligibility.title}
                content={section3.eligibility.joinList}
                isList
                className="competition-information-default-background"
              />
            </Col>
            <Col xs={12} lg={6} className="mt-4 mt-lg-0">
              <InformationCard
                title={section3.prizes.title}
                description={section3.prizes.description}
                content={section3.prizes.prizeList}
                isList
                className="competition-information-prizes-background"
              />
            </Col>
          </Row>
          <CompetitionTimeline
            title={section3.timeline.title}
            content={section3.timeline.content}
            entries={section3.timeline.entries}
          />
        </Container>
      </section>
      <section id="accordion" className="event-section">
        <Container>
          <Row className="py-4">
            <Col>
              <div ref={accordionRef}>
                <Accordion
                  title={accordion.title}
                  sections={accordionSections}
                  open={open}
                  setOpenState={setOpenState}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};
