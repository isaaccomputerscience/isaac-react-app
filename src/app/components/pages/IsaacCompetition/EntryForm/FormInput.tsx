import React from "react";
import { FormGroup, Label, Input } from "reactstrap";
import { InputType } from "reactstrap/es/Input";

interface FormInputProps {
  label: string;
  type: string;
  id: string;
  disabled: boolean;
  options?: string[];
  defaultValue?: string;
  required?: boolean;
  activeGroups?: { groupName: string }[];
  setSelectedGroup?: (group: { groupName: string } | null) => void;
}

const FormInput = ({
  label,
  type,
  id,
  disabled,
  options = [],
  defaultValue,
  required = true,
  activeGroups = [],
  setSelectedGroup,
}: FormInputProps) => {
  return (
    <FormGroup>
      <Label className="entry-form-sub-title">
        {label} {required && <span className="entry-form-astrisk">*</span>}
      </Label>
      {type === "select" ? (
        <Input
          type="select"
          id={id}
          disabled={disabled}
          required={required}
          onChange={(e) => setSelectedGroup?.(activeGroups.find((group) => group.groupName === e.target.value) || null)}
        >
          {options.length > 0 &&
            options.map((option, index) => (
              <option key={index} value={option === "Please select from the list" ? "" : option}>
                {option}
              </option>
            ))}
        </Input>
      ) : (
        <Input type={type as InputType} id={id} defaultValue={defaultValue} disabled={disabled} required={required} />
      )}
    </FormGroup>
  );
};

export default FormInput;
