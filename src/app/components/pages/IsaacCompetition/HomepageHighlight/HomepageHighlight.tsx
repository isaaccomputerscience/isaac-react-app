import React from "react";
import { Container } from "reactstrap";
import CompetitionWrapper from "../CompetitionWrapper";
import CompetitionBanner from "./CompetitionBanner";
import ExpressionOfInterestBanner from "./ExpressionOfInterestBanner";
import ClosedCompetitionBanner from "./ClosedCompetitionBanner";
import { isBeforeCompetitionOpenDate, isBeforeEndDate } from "../dateUtils";

const HomepageHighlight = () => {
  const currentDate = new Date();

  const renderBanner = () => {
    if (isBeforeCompetitionOpenDate(currentDate)) {
      return <ExpressionOfInterestBanner />;
    } else if (isBeforeEndDate(currentDate)) {
      return <CompetitionBanner />;
    }
    return null;
  };

  return (
    <CompetitionWrapper
      closedCompetitionContent={
        <Container className="pt-2 pb-5">
          <ClosedCompetitionBanner />
        </Container>
      }
    >
      <Container className="pt-2 pb-5">{renderBanner()}</Container>
    </CompetitionWrapper>
  );
};

export default HomepageHighlight;
