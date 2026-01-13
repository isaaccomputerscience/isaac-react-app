import React, { useState } from "react";
import { Col, FormGroup, Label, Row, UncontrolledTooltip } from "reactstrap";
import { ValidationUser } from "../../../../IsaacAppTypes";
import { Immutable } from "immer";
import {
  PASSWORD_REQUIREMENTS,
  validatePassword,
  validatePasswordMatch,
  getPasswordValidationErrors,
} from "../../../services";
import Password from "./Password";

interface PasswordInputProps {
  userToUpdate: Immutable<ValidationUser>;
  setUserToUpdate: (user: Immutable<ValidationUser>) => void;
  setUnverifiedPassword: (password: string) => void;
  submissionAttempted: boolean;
  unverifiedPassword: string | undefined;
  defaultPassword?: string;
}

export const RegistrationPasswordInputs = ({
  userToUpdate,
  setUserToUpdate,
  submissionAttempted,
  unverifiedPassword,
  setUnverifiedPassword,
  defaultPassword,
}: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordIsValid = validatePassword(unverifiedPassword || "");
  const passwordsMatch = validatePasswordMatch(unverifiedPassword || "", userToUpdate.password || "");
  const bothPasswordsValid = passwordIsValid && passwordsMatch;

  // Get specific validation errors for display
  const passwordErrors = unverifiedPassword ? getPasswordValidationErrors(unverifiedPassword) : [];

  // Show errors if submission attempted OR if user has touched the field and there are errors
  const showPasswordErrors = (submissionAttempted || passwordTouched) && !!unverifiedPassword && !passwordIsValid;
  const showMatchError = (submissionAttempted || confirmTouched) && !!userToUpdate.password && !passwordsMatch;

  return (
    <Row>
      <Col md={6}>
        <FormGroup>
          <Label htmlFor="new-password">
            Password <span className="asterisk">*</span>
          </Label>
          <span id={`password-help-tooltip`} className="icon-help ml-1" />
          <UncontrolledTooltip target={`password-help-tooltip`} placement="bottom">
            {PASSWORD_REQUIREMENTS}
          </UncontrolledTooltip>
          <Password
            passwordFieldType="New"
            isPasswordVisible={isPasswordVisible}
            setIsPasswordVisible={setIsPasswordVisible}
            defaultValue={defaultPassword}
            invalid={showPasswordErrors ? true : undefined}
            onChange={(e) => {
              const newValue = e.target.value;
              setUnverifiedPassword(newValue);
              // Mark as touched when user starts typing
              if (newValue.length > 0) {
                setPasswordTouched(true);
              }
            }}
            onBlur={(e) => {
              const newValue = e.target.value;
              setUnverifiedPassword(newValue);
              setPasswordTouched(true);
            }}
            showToggleIcon={true}
            required={true}
          />

          {/* Show validation errors */}
          {showPasswordErrors && passwordErrors.length > 0 && (
            <div className="invalid-feedback d-block mt-2">
              <strong>Password requirements:</strong>
              <ul className="mb-0 pl-3 mt-1" style={{ fontSize: "0.875rem" }}>
                {passwordErrors.map((error) => {
                  const parts = error.split(/\n/);
                  return (
                    <li key={error}>
                      {parts.map((line, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <br />}
                          {line}
                        </React.Fragment>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* If no password entered on submit */}
          {submissionAttempted && (!unverifiedPassword || unverifiedPassword.length === 0) && (
            <div className="invalid-feedback d-block mt-2">Password is required</div>
          )}
        </FormGroup>
      </Col>
      <Col md={6}>
        <FormGroup>
          <Label htmlFor="password-confirm">
            Re-enter password <span className="asterisk">*</span>
          </Label>
          <Password
            passwordFieldType="Confirm"
            isPasswordVisible={isPasswordVisible}
            setIsPasswordVisible={setIsPasswordVisible}
            disabled={!unverifiedPassword}
            invalid={showMatchError || (submissionAttempted && !bothPasswordsValid) ? true : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUserToUpdate({ ...userToUpdate, password: e.target.value });
              if (e.target.value.length > 0) {
                setConfirmTouched(true);
              }
            }}
            onBlur={() => {
              setConfirmTouched(true);
            }}
            ariaDescribedBy="invalidPassword"
            required={true}
          />

          {/* Feedback for password match */}
          {showMatchError && <div className="invalid-feedback d-block mt-2">Passwords do not match</div>}

          {(submissionAttempted || confirmTouched) && userToUpdate.password && passwordsMatch && !passwordIsValid && (
            <div className="invalid-feedback d-block mt-2">Please ensure your password meets all requirements</div>
          )}

          {submissionAttempted && (!userToUpdate.password || userToUpdate.password.length === 0) && (
            <div className="invalid-feedback d-block mt-2">Please confirm your password</div>
          )}
        </FormGroup>
      </Col>
    </Row>
  );
};
