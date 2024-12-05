import React from "react";
import { Form, Row, Col, Button, Container, FormGroup, Label, Input } from "reactstrap";
import { InputType } from "reactstrap/es/Input";

interface CompetitionEntryFormProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const renderFormGroup = (label: string, type: string, id: string, options: string[] = []) => (
  <FormGroup>
    <Label className="entry-form-sub-title">{label}</Label>
    {type === "select" ? (
      <Input type="select" id={id}>
        {options?.length > 0 &&
          options.map((option, index) => (
            <option key={`${option}-${index}`} value={option === "Please select from the list" ? "" : option}>
              {option}
            </option>
          ))}
      </Input>
    ) : (
      <Input type={type as InputType} id={id} />
    )}
  </FormGroup>
);

const CompetitionEntryForm = ({ handleTermsClick }: CompetitionEntryFormProps) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="py-5">
      <div className="entry-form-background-img entry-form-section">
        <Container className="pb-2">
          <Form onSubmit={handleSubmit}>
            <h1 className="py-4 entry-form-title">Enter the competition</h1>
            <Row className="d-flex flex-column flex-md-row">
              <Col lg={6}>
                {renderFormGroup("Name", "text", "formSubtitle1")}
                {renderFormGroup("School", "text", "formSubtitle2")}
                {renderFormGroup("Email", "text", "formSubtitle3")}
              </Col>
              <Col lg={6}>
                {renderFormGroup("Link to submission", "text", "formSubtitle4")}
                {renderFormGroup("Group", "select", "formSubtitle5", [
                  "Please select from the list",
                  "Option 1",
                  "Option 2",
                  "Option 3",
                ])}
                <Row className="entry-form-button-label d-flex flex-column flex-md-row">
                  <Col xs="auto">
                    <Button className="entry-form-button btn-sm py-2 px-4" type="submit">
                      Submit
                    </Button>
                  </Col>
                  <Col className="pl-0 mt-2 ml-3 mt-md-0">
                    <Label>
                      By entering the National Computer Science Competition you agree to the{" "}
                      <a href="#terms-and-conditions" onClick={handleTermsClick}>
                        Terms and Conditions
                      </a>
                      .
                    </Label>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </div>
  );
};

export default CompetitionEntryForm;
