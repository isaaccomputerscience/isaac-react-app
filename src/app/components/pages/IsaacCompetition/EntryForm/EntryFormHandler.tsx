import React from "react";
import { Container, Col } from "reactstrap";
import CompetitionEntryForm from "./CompetitionEntryForm";
import CompetitionButton from "../Buttons/CompetitionButton";
import { selectors, useAppSelector } from "../../../../state";
import { isStudent, isAdmin, isTeacher } from "../../../../services";
import CompetitionWrapper from "../CompetitionWrapper";
import { CLOSED_MESSAGE, STUDENT_MESSAGE, TEACHER_MESSAGE } from "../constants";

// EOI button configuration - same as HomepageHighlight
export const eoiButton = {
  to: "https://forms.cloud.microsoft/e/K4GmaA3QEF",
  label: "Express your interest",
};

const StudentMessage = () => (
  <Container>
    <Col className="d-flex flex-column align-items-start pb-4 pl-0" xs="auto">
      <p className="body-text">{STUDENT_MESSAGE}</p>
    </Col>
  </Container>
);

interface DefaultMessageProps {
  buttons: { to: string; label: string }[];
}

const DefaultMessage: React.FC<DefaultMessageProps> = ({ buttons }) => (
  <Container>
    <Col className="d-flex flex-column align-items-start pb-4 pl-0" xs="auto">
      <p className="pb-3 body-text">{TEACHER_MESSAGE}</p>
      <CompetitionButton buttons={buttons} />
    </Col>
  </Container>
);

interface EntryFormHandlerProps {
  buttons: { to: string; label: string }[];
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const EntryFormHandler = ({ buttons, handleTermsClick }: EntryFormHandlerProps) => {
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
    } else {
      return <DefaultMessage buttons={buttons} />;
    }
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
