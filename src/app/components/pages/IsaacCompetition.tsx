import React, { useEffect } from "react";
import { SITE_SUBJECT_TITLE } from "../../services";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import { Container } from "reactstrap";

export const IsaacCompetition = () => {
  useEffect(() => {
    document.title = "Isaac " + SITE_SUBJECT_TITLE;
  }, []);

  return (
    <Container>
      <TitleAndBreadcrumb currentPageTitle="Isaac Competition" breadcrumbTitleOverride="Isaac Competition" />

      <div id="section1">
        <h1>Section 1</h1>
      </div>

      <div id="section2">
        <h1>Section 2</h1>
      </div>
    </Container>
  );
};
