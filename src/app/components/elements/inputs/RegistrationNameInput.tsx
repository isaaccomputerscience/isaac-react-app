import { Immutable } from "immer";
import React from "react";
import { Col, FormFeedback, FormGroup, Input, Label } from "reactstrap";
import { ValidationUser } from "../../../../IsaacAppTypes";
import { validateName } from "../../../services";

interface RegistrationNameProps {
  userToUpdate: Immutable<ValidationUser>;
  setUserToUpdate: (user: Immutable<ValidationUser>) => void;
  attemptedSignUp: boolean;
}

export const RegistrationNameInput = ({
  userToUpdate,
  setUserToUpdate,
  attemptedSignUp,
}: RegistrationNameProps) => {
  const givenNameIsValid = validateName(userToUpdate.givenName);
  const familyNameIsValid = validateName(userToUpdate.familyName);

  return (
    <>
      <Col md={6}>
        <FormGroup>
          <Label htmlFor="first-name-input">First name</Label>
          <Input
            id="first-name-input"
            type="text"
            name="givenName"
            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUserToUpdate({ ...userToUpdate, givenName: e.target.value });
            }}
            invalid={attemptedSignUp && !givenNameIsValid}
            aria-describedby="firstNameValidationMessage"
            required
          />
          <FormFeedback id="firstNameValidationMessage">
            {attemptedSignUp && !givenNameIsValid ? "Enter a valid name" : null}
          </FormFeedback>
        </FormGroup>
      </Col>
      <Col md={6}>
        <FormGroup>
          <Label htmlFor="last-name-input">Last name</Label>
          <Input
            id="last-name-input"
            type="text"
            name="familyName"
            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUserToUpdate({ ...userToUpdate, familyName: e.target.value });
            }}
            invalid={attemptedSignUp && !familyNameIsValid}
            aria-describedby="lastNameValidationMessage"
            required
          />
          <FormFeedback id="lastNameValidationMessage">
            {attemptedSignUp && !familyNameIsValid
              ? "Enter a valid name"
              : null}
          </FormFeedback>
        </FormGroup>
      </Col>
    </>
  );
};
