import React from "react";
import { ListGroup, ListGroupItem } from "reactstrap";
import { ExternalLink } from "../ExternalLink";
import { Link } from "react-router-dom";
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
  right: [
    <FooterLink key="accessibility-footer-link" linkTo="/accessibility">
      Accessibility
    </FooterLink>,
    <FooterLink key="cookie-policy-footer-link" linkTo="/cookies">
      Cookie policy
    </FooterLink>,
    <FooterLink key="privacy-policy-footer-link" linkTo="/privacy">
      Privacy policy
    </FooterLink>,
    <FooterLink key="terms-of-use-footer-link" linkTo="/terms">
      Terms of use
    </FooterLink>,
  ],
};

export const ListGroupFooterBottom = () => (
  <div className="footer-links footer-bottom d-flex flex-column w-100">
    <div className="footer-bottom-links-row mb-3">
      <div className="footer-bottom-links d-md-flex flex-md-row align-items-center">
        <h2 className="h5 mb-3 mb-md-0 mr-md-4">Links</h2>
        <ListGroup className="d-md-flex flex-md-row">{footerLinks.right}</ListGroup>
      </div>
    </div>

    <div className="footer-bottom-row d-flex flex-column flex-lg-row align-items-lg-end justify-content-between">
      <div className="footer-bottom-section footer-bottom-info-section mb-3 mb-lg-0">
        <div className="footer-bottom-info">
          <p className="mb-0">
            All teaching materials on this site are available under the{" "}
            <ExternalLink
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              className="d-inline fw-bold print-font"
            >
              Open Government Licence v3.0
            </ExternalLink>
            , except where otherwise stated.
          </p>
        </div>
      </div>

      <div className="footer-bottom-logos d-flex align-items-end d-print-none">
        <div className="footer-bottom-logo d-flex align-items-center justify-content-center mb-3 mb-lg-0">
          <ExternalLink href="https://teachcomputing.org/">
            <img
              src="/assets/logos/ncce.svg"
              alt="National Centre for Computing Education website"
              className="footer-ncce-logo"
            />
          </ExternalLink>
        </div>

        <div className="footer-bottom-logo d-flex align-items-center justify-content-center mb-3 mb-lg-0">
          <ExternalLink href="https://www.gov.uk/government/organisations/department-for-education">
            <img src="/assets/logos/dfe.svg" alt="UK Department for Education" className="footer-dfe-logo" />
          </ExternalLink>
        </div>

        <div className="footer-bottom-logo d-flex align-items-center justify-content-center">
          <ExternalLink href="https://www.stem.org.uk/">
            <img src="/assets/logos/new_stem_footer.svg" alt="STEM Learning" className="footer-stem-logo" />
          </ExternalLink>
        </div>
      </div>
    </div>
  </div>
);
