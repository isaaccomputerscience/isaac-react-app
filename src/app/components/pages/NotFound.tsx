import React from "react";
import { useLocation } from "react-router-dom";
import { Container } from "reactstrap";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";

export const NotFound = () => {
  const { pathname, state } = useLocation<{ overridePathname?: string }>();
  console.log(state);
  const missingPageId = (state && state.overridePathname) || pathname;
  const contactSubject = encodeURIComponent(`Page not found "${missingPageId}"`);
  return (
    <Container>
      <div>
        <TitleAndBreadcrumb breadcrumbTitleOverride="Unknown page" currentPageTitle="Page not found" />
        <h3 className="my-4">
          <small>
            {"Sorry, we couldn't find the page you were looking for: "}
            <code>{missingPageId}</code>
            <br />
            <br />
            {"If you entered a web address, check it was correct."}
            <br />
            <br />
            {"If you pasted the web address, check you copied the entire address."}
            <br />
            <br />
            {"If the web address is correct or you selected a link or button, please"}{" "}
            <a href={`/contact?subject=${contactSubject}`} style={{ textDecoration: "none", color: "#2B77B4" }}>
              contact us
            </a>{" "}
            {"to let us know."}
          </small>
        </h3>
      </div>
    </Container>
  );
};
