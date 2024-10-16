import React from "react";
import { Link } from "react-router-dom";
import { ListGroup, ListGroupItem } from "reactstrap";

interface FooterLinkProps {
  linkTo: string;
  children?: React.ReactNode | string;
}

const FooterLink = ({ linkTo, children }: FooterLinkProps) => {
  return (
    <ListGroupItem className="border-0 px-0 py-0 bg-transparent align-items-stretch">
      <Link className="footerLink" to={linkTo}>
        {children}
      </Link>
    </ListGroupItem>
  );
};

const footerLinks = {
  left: [
    <FooterLink key="about-us-footer-link" linkTo="/about">
      About us
    </FooterLink>,
    <FooterLink key="contact-us-footer-link" linkTo="/contact">
      Contact us
    </FooterLink>,
    <FooterLink key="safeguarding-footer-link" linkTo="/safeguarding">
      Safeguarding
    </FooterLink>,
    <FooterLink key="student-support-footer-link" linkTo="/support/student">
      Student Support
    </FooterLink>,
    <FooterLink key="teacher-support-footer-link" linkTo="/support/teacher">
      Teacher Support
    </FooterLink>,
  ],
};

export const ListGroupFooter = () => (
  <div className="footer-links">
    <div className="footer-support-links d-md-flex flex-md-row mt-3 pb-4 py-lg-3">
      <h2 className="h5">Support</h2>
      <ListGroup className="d-md-flex flex-md-row">{footerLinks.left}</ListGroup>
    </div>
  </div>
);
