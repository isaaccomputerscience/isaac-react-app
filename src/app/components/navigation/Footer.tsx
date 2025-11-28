import React from "react";
import { Container, Col, Row } from "reactstrap";
import { ListGroupFooter } from "../elements/list-groups/ListGroupFooter";
import { ListGroupSocial } from "../elements/list-groups/ListGroupSocial";
import { ListGroupFooterBottom } from "../elements/list-groups/ListGroupFooterBottom";
import { Link } from "react-router-dom";
// import { ExternalLink } from "../elements/ExternalLink";

export const Footer = () => (
  <footer>
    <div className="footerTop d-print-none">
      <Container>
        <Row className="px-sm-0 pb-3 pb-md-4 footer-content">
          <Col xs="12" lg="3" className="pt-5 logo-col">
            <Link to="/">
              <img
                src="/assets/logo_footer.svg"
                className="footerLogo d-block w-100"
                alt="Isaac Computer Science homepage"
              />
            </Link>
            <div className="footer-links logo-text mb-1 mt-4">
              <p>
                Isaac Computer Science is part of the
                <Link to="/teachcomputing" style={{ color: "white", textDecoration: "none" }}>
                  National Centre for Computing Education.
                </Link>
              </p>
            </div>
          </Col>
          <Col xs="12" lg="9" xl={{ size: 8, offset: 1 }} className="pt-5 links-col">
            <ListGroupFooter />
            <ListGroupSocial />
          </Col>
        </Row>
      </Container>
    </div>
    <div className="footer-container d-flex flex-row justify-content-between pl-5 mb-3">
      <ListGroupFooterBottom />
    </div>
  </footer>
);
