import React, { useState } from "react";
import {
  FormFeedback,
  FormGroup,
  Input,
  Label,
  UncontrolledTooltip,
} from "reactstrap";
import { PasswordFeedback, ValidationUser } from "../../../../IsaacAppTypes";
import { Immutable } from "immer";
import { passwordDebounce, validatePassword } from "../../../services";

interface PasswordInputProps {
  fieldType: "password" | "confirmPassword";
  userToUpdate: Immutable<ValidationUser>;
  setUserToUpdate: (user: Immutable<ValidationUser>) => void;
  setUnverifiedPassword: (password: string) => void;
  submissionAttempted: boolean;
  unverifiedPassword: string | undefined;
  defaultPassword?: string;
}

export const PasswordInput = ({
  fieldType,
  userToUpdate,
  setUserToUpdate,
  unverifiedPassword,
  setUnverifiedPassword,
  submissionAttempted,
  defaultPassword,
}: PasswordInputProps) => {
  const [passwordFeedback, setPasswordFeedback] =
    useState<PasswordFeedback | null>(null);

  const passwordIsValid =
    userToUpdate.password == unverifiedPassword &&
    validatePassword(userToUpdate.password || "");

  const newPassword = (
    <FormGroup>
      <Label htmlFor="password-input">Password</Label>
      <span id={`password-help-tooltip`} className="icon-help ml-1" />
      <UncontrolledTooltip target={`password-help-tooltip`} placement="bottom">
        {
          "Passwords must be at least 12 characters, containing at least one number, one lowercase letter, one uppercase letter, and one punctuation character."
        }
      </UncontrolledTooltip>
      <Input
        id="password-input"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        defaultValue={defaultPassword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setUnverifiedPassword(e.target.value);
          passwordDebounce(e.target.value, setPasswordFeedback);
        }}
        onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
          passwordDebounce(e.target.value, setPasswordFeedback);
        }}
      />
      {passwordFeedback && (
        <span className="float-right small mt-1">
          <strong>Password strength: </strong>
          <span id="password-strength-feedback">
            {passwordFeedback.feedbackText}
          </span>
        </span>
      )}
    </FormGroup>
  );

  const confirmPassword = (
    <FormGroup>
      <Label htmlFor="password-confirm">Re-enter password</Label>
      <Input
        id="password-confirm"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        aria-describedby="invalidPassword"
        disabled={!unverifiedPassword}
        invalid={submissionAttempted && !passwordIsValid}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setUserToUpdate({...userToUpdate, password: e.target.value });
        }}
      />
      {/* Feedback that appears for password match before submission */}
      <FormFeedback id="password-match-feedback" className="always-show">
        {userToUpdate.password &&
          !(userToUpdate.password == unverifiedPassword) &&
          "Passwords don't match."}
      </FormFeedback>
      {/* Feedback that is hidden until after form submission attempt */}
      <FormFeedback id="password-validation-feedback">
        {submissionAttempted &&
          userToUpdate.password == unverifiedPassword &&
          !validatePassword(userToUpdate.password || "") &&
          "Please ensure your password is at least 12 characters, containing at least one number, one lowercase letter, one uppercase letter, and one punctuation character."}
      </FormFeedback>
    </FormGroup>
  );

  return fieldType=="password" ? newPassword : confirmPassword;
};

