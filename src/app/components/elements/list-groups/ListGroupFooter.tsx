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

let key = 0;
const footerLinks = {
  left: [
    <FooterLink key={key++} linkTo="/about">
      About us
    </FooterLink>,
    <FooterLink key={key++} linkTo="/contact">
      Contact us
    </FooterLink>,
    <FooterLink key={key++} linkTo="/safeguarding">
      Safeguarding
    </FooterLink>,
    <FooterLink key={key++} linkTo="/support/student">
      Student Support
    </FooterLink>,
    <FooterLink key={key++} linkTo="/support/teacher">
      Teacher Support
    </FooterLink>,
  ],
};

export const ListGroupFooter = () => (
  <div className="footer-links">
    <div className="footer-support-links d-md-flex flex-md-row mt-3 pb-5 py-lg-3">
      <h2 className="h5">Support</h2>
      <ListGroup className="d-md-flex flex-md-row">{footerLinks.left}</ListGroup>
    </div>
  </div>
);
