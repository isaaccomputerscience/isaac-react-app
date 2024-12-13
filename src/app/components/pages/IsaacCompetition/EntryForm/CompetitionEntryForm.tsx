import React, { useEffect, useState } from "react";
import { Form, Row, Col, Button, Container, FormGroup, Label, Input } from "reactstrap";
import { InputType } from "reactstrap/es/Input";
import { AppGroup } from "../../../../../IsaacAppTypes";
import { isaacApi, useAppSelector } from "../../../../state";
import { selectors } from "../../../../state/selectors";
import { SchoolInput } from "../../../elements/inputs/SchoolInput";

interface CompetitionEntryFormProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const renderFormGroup = (
  label: string,
  type: string,
  id: string,
  defaultValue: string = "",
  options: string[] = [],
  disabled: boolean = false,
) => (
  <FormGroup>
    <Label className="entry-form-sub-title">{label}</Label>
    {type === "select" ? (
      <Input type="select" id={id} disabled={disabled}>
        {options?.length > 0 &&
          options.map((option, index) => (
            <option key={`${option}-${index}`} value={option === "Please select from the list" ? "" : option}>
              {option}
            </option>
          ))}
      </Input>
    ) : (
      <Input type={type as InputType} id={id} defaultValue={defaultValue} disabled={disabled} />
    )}
  </FormGroup>
);

const CompetitionEntryForm = ({ handleTermsClick }: CompetitionEntryFormProps) => {
  const [activeGroups, setActiveGroups] = useState<AppGroup[]>([]);
  const { data: groups } = isaacApi.endpoints.getGroups.useQuery(false);
  const targetUser = useAppSelector(selectors.user.orNull);

  useEffect(() => {
    if (groups) {
      setActiveGroups(groups);
    }
  }, [groups]);

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
                {renderFormGroup(
                  "First Name",
                  "text",
                  "formSubtitle1",
                  targetUser?.loggedIn ? targetUser.givenName || "" : "",
                  [],
                  true,
                )}
                {renderFormGroup(
                  "Last Name",
                  "text",
                  "formSubtitle2",
                  targetUser?.loggedIn ? targetUser?.familyName || "" : "",
                  [],
                  true,
                )}
                {targetUser && (
                  <FormGroup>
                    <Label className="entry-form-sub-title">School</Label>
                    <SchoolInput
                      disableInput={true}
                      userToUpdate={{ ...targetUser, password: null }}
                      submissionAttempted={false}
                      required={true}
                      showLabel={false}
                    />
                  </FormGroup>
                )}
              </Col>
              <Col lg={6}>
                {renderFormGroup("Link to submission", "text", "formSubtitle4")}
                {renderFormGroup("Group", "select", "formSubtitle5", "", [
                  "Please select from the list",
                  ...activeGroups.map((group) => group.groupName || ""),
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
