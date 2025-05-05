import React, { useState } from "react";
import { Col, Row } from "reactstrap";

interface ConsentProps {
  consentText: string;
  required?: boolean;
  onConsentChange?: (checked: boolean) => void;
}

const Consent = ({ consentText, required = true, onConsentChange }: ConsentProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (onConsentChange) {
      onConsentChange(newCheckedState);
    }
  };

  return (
    <Row className="mt-2">
      <Col xs="auto" className="d-flex align-items-center">
        <input
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
        <label>{consentText}</label>
      </Col>
    </Row>
  );
};

export default Consent;
