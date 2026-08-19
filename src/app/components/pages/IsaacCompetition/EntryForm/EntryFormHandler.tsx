import React from "react";
import { Container, Col } from "reactstrap";
import CompetitionEntryForm from "./CompetitionEntryForm";
import { selectors, useAppSelector } from "../../../../state";
import { isStudent, isAdmin, isTeacher, isLoggedIn } from "../../../../services";
import CompetitionWrapper from "../CompetitionWrapper";
import { CLOSED_MESSAGE, STUDENT_MESSAGE } from "../constants";
import { isBeforeCompetitionOpenDate } from "../dateUtils";
import { PotentialUser } from "../../../../../IsaacAppTypes";
import { Immutable } from "immer";

const EOI_FORM_URL = "https://forms.cloud.microsoft/e/K4GmaA3QEF";
const ENTRY_FORM_ANCHOR = "#competition-entry-form";

export const getHeadlineCtaButton = (user?: Immutable<PotentialUser> | null) => {
  const beforeOpen = isBeforeCompetitionOpenDate(new Date());
  if (beforeOpen) {
    return { to: EOI_FORM_URL, label: "Express your interest" };
  }

  if (isLoggedIn(user) && (isTeacher(user) || isAdmin(user))) {
    return { to: ENTRY_FORM_ANCHOR, label: "Submit your project" };
  }

  return { to: "/login", label: "Submit your project" };
};

const StudentMessage = () => (
  <Container>
    <Col className="d-flex flex-column align-items-start pb-4 pl-0" xs="auto">
      <p className="body-text">{STUDENT_MESSAGE}</p>
    </Col>
  </Container>
);

interface EntryFormHandlerProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const EntryFormHandler = ({ handleTermsClick }: EntryFormHandlerProps) => {
  const user = useAppSelector(selectors.user.orNull);

  const renderEntryForm = () => {
    // Revert this: Only ADMIN users can see and submit the competition form
    if (isAdmin(user) || isTeacher(user)) {
      return (
        <CompetitionWrapper>
          <CompetitionEntryForm handleTermsClick={handleTermsClick} />
        </CompetitionWrapper>
      );
    } else if (isStudent(user)) {
      return <StudentMessage />;
    }

    // Logged-out CTA lives in the headline (teacher copy + Submit your project)
    return null;
  };

  return (
    <CompetitionWrapper
      // EOI button is rendered in the headline text column for correct alignment
      beforeCompetitionOpenContent={null}
      closedCompetitionContent={
        <Container>
          <Col className="d-flex flex-column align-items-start pb-4 pl-0" xs="auto">
            <p className="pb-3 body-text">{CLOSED_MESSAGE}</p>
          </Col>
        </Container>
      }
    >
      {renderEntryForm()}
    </CompetitionWrapper>
  );
};

export default EntryFormHandler;
