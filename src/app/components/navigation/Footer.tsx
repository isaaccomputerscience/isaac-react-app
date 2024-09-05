import React from "react";
import { Container, Col, Row } from "reactstrap";
import { ListGroupFooter } from "../elements/list-groups/ListGroupFooter";
import { ListGroupSocial } from "../elements/list-groups/ListGroupSocial";
import { ListGroupFooterBottom } from "../elements/list-groups/ListGroupFooterBottom";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer>
    <div className="footerTop d-print-none">
      <Container>
        <Row className="px-3 px-sm-0 pb-3 pb-md-4">
          <Col md="4" lg="3" className="pt-5 logo-col ">
            <div className="d-flex flex-row">
              <Link to="/">
                <img src="/assets/logo_footer.svg" className="footerLogo" alt="Isaac Computer Science homepage" />
              </Link>
            </div>
            <div className="footer-links logo-text pt-3">
              <p>
                Isaac Computer Science is part of the
                <Link to="/teachcomputing" style={{ color: "white", textDecoration: "none" }}>
                  National Centre for Computing Education.
                </Link>
              </p>
            </div>
          </Col>
          <Col md="8" lg="9">
            <Row>
              <Col md="8" lg="9" className="pt-5 pl-md-4">
                <ListGroupFooter />
                <ListGroupSocial />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
    <div className="footerBottom">
      <Container>
        <Row className="pt-3 px-3 px-sm-0 pb-3">
          <ListGroupFooterBottom />
        </Row>
      </Container>
    </div>
  </footer>
);
