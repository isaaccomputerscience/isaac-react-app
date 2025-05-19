import React, { useState } from "react";
import { Col, Row } from "reactstrap";
import { Link } from "react-router-dom";

interface ConsentText {
  beforeLink: string;
  linkText: string;
  afterLink: string;
}

interface ConsentProps {
  consentText: (string | ConsentText)[];
  required?: boolean;
  onConsentChange?: (checked: boolean) => void;
}

const VirtualConsent = ({ consentText, required = true, onConsentChange }: ConsentProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const inputId = "virtual-consent-checkbox";

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (onConsentChange) {
      onConsentChange(newCheckedState);
    }
  };

  const renderConsentText = (text: string | ConsentText) => {
    if (typeof text === "string") {
      return text;
    }
    return (
      <>
        {text.beforeLink}
        <Link to="/account-settings" target="_blank">
          {text.linkText}
        </Link>
        {text.afterLink}
      </>
    );
  };

  return (
    <Row className="mt-2">
      <Col xs="auto" className="d-flex pt-4">
        <input
          id={inputId}
          name="consent"
          aria-label="Consent checkbox for virtual event registration"
          className="large-checkbox"
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          required={required}
          aria-required={required}
        />
        {required && <span className="asterisk ml-2 text-danger">*</span>}
      </Col>
      <Col>
        <label htmlFor={inputId}>
          {consentText.map((text, index) => (
            <React.Fragment key={`consent-${typeof text === "string" ? "text" : "link"}-${index}`}>
              {renderConsentText(text)}
              {index < consentText.length - 1 && <div className="mt-2" />}
            </React.Fragment>
          ))}
        </label>
      </Col>
    </Row>
  );
};

export default VirtualConsent;
