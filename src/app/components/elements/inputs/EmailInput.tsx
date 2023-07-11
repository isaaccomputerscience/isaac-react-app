import { Immutable } from "immer";
import React from "react";
import { FormFeedback, FormGroup, Input, Label } from "reactstrap";
import { ValidationUser } from "../../../../IsaacAppTypes";
import { validateEmail } from "../../../services";

interface EmailInputProps {
  submissionAttempted: boolean;
  userToUpdate: Immutable<ValidationUser>;
  setUserToUpdate: (user: Immutable<ValidationUser>) => void;
  emailDefault?: string;
}

export const EmailInput = ({
  submissionAttempted,
  userToUpdate,
  setUserToUpdate,
  emailDefault,
}: EmailInputProps) => {
  const emailIsValid = userToUpdate.email && validateEmail(userToUpdate.email);

  return (
    <FormGroup>
      <Label htmlFor="email-input">Email address</Label>
      <Input
        id="email-input"
        name="email"
        type="email"
        autoComplete="email"
        aria-describedby="email-validation-feedback"
        required
        defaultValue={emailDefault}
        invalid={submissionAttempted && !emailIsValid}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setUserToUpdate({ ...userToUpdate, email: e.target.value });
        }}
      />
      <FormFeedback id="email-validation-feedback">
        {submissionAttempted && !emailIsValid && "Enter a valid email address"}
      </FormFeedback>
    </FormGroup>
  );
};
