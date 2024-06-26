import React, { ChangeEvent } from "react";
import { ValidationUser } from "../../../../IsaacAppTypes";
import { FormFeedback, FormGroup, Input, Label } from "reactstrap";
import { validateUserGender } from "../../../services";
import { Immutable } from "immer";
import { Gender } from "../../../../IsaacApiTypes";

interface GenderInputProps {
  userToUpdate: Immutable<ValidationUser>;
  setUserToUpdate: (user: Immutable<ValidationUser>) => void;
  submissionAttempted: boolean;
  idPrefix?: string;
}
export const GenderInput = ({
  userToUpdate,
  setUserToUpdate,
  submissionAttempted,
  idPrefix = "account",
}: GenderInputProps) => {
  return (
    <FormGroup>
      <Label htmlFor={`${idPrefix}-gender-select`}>Gender</Label>
      <Input
        className="pl-2"
        type="select"
        name="gender"
        id={`${idPrefix}-gender-select`}
        value={userToUpdate.gender || ""}
        invalid={submissionAttempted && !validateUserGender(userToUpdate)}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setUserToUpdate({ ...userToUpdate, gender: e.target.value as Gender })
        }
        aria-describedby="genderValidationMessage"
        required
      >
        <option disabled value="">
          Please select your gender
        </option>
        <option value="FEMALE">Female</option>
        <option value="MALE">Male</option>
        <option value="OTHER">Other gender identity</option>
        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
      </Input>
      <FormFeedback id="genderValidationMessage">{submissionAttempted ? "Please select an option" : null}</FormFeedback>
    </FormGroup>
  );
};
