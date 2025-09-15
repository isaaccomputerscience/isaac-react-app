import React from "react";
import { Container, Row, Col } from "reactstrap";
import CompetitionButton from "../Buttons/CompetitionButton";
import { isBeforeCompetitionOpenDate, isBeforeEndDate, isWithinFourWeeksAfterEndDate } from "../dateUtils";
import { CLOSED_MESSAGE } from "../constants";

const HomepageHighlight = () => {
  const currentDate = new Date();

  const getBannerContent = () => {
    if (isBeforeCompetitionOpenDate(currentDate)) {
      return {
        title: "National Computer Science Competition 2025/26",
        subtitle: "Opening November 2025",
        button: {
          to: "https://forms.office.com/e/23bsQuZfjm",
          label: "Be the first one to know",
        },
      };
    } else if (isBeforeEndDate(currentDate)) {
      return {
        title: "Entries are now open",
        subtitle: "National Computer Science Competition 2025/26",
        button: {
          to: "/national-computer-science-competition",
          label: "Enter the competition",
        },
        titleBelowSubtitle: true, // Special flag for this case
      };
    } else if (isWithinFourWeeksAfterEndDate(currentDate)) {
      return {
        title: "National Computer Science Competition 2025/26",
        subtitle: CLOSED_MESSAGE,
        button: null,
      };
    }
    return null;
  };

  const bannerContent = getBannerContent();

  if (!bannerContent) return null;

  return (
    <Container className="pt-2 pb-5">
      <Row className="homepage-highlight rounded justify-content-center">
        <Col xs={12} className="text-center">
          {bannerContent.titleBelowSubtitle ? (
            <>
              <h1 className="homepage-highlight-sub-title py-4">{bannerContent.subtitle}</h1>
              <h1 className="homepage-highlight-title pb-4">{bannerContent.title}</h1>
            </>
          ) : (
            <>
              <h1 className="homepage-highlight-title pb-4">{bannerContent.title}</h1>
              <h1 className="homepage-highlight-sub-title py-4">{bannerContent.subtitle}</h1>
            </>
          )}
        </Col>
        {bannerContent.button && (
          <Col xs={12} className="pb-4 text-center d-flex justify-content-center">
            <CompetitionButton buttons={[bannerContent.button]} />
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default HomepageHighlight;
