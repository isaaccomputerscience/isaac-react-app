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
  activeGroups?: { groupName: string }[];
  setSelectedGroup?: (group: { groupName: string } | null) => void;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type,
  id,
  disabled,
  options = [],
  defaultValue,
  activeGroups = [],
  setSelectedGroup,
}) => {
  return (
    <FormGroup>
      <Label className="entry-form-sub-title">{label}</Label>
      {type === "select" ? (
        <Input
          type="select"
          id={id}
          disabled={disabled}
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
        <Input type={type as InputType} id={id} defaultValue={defaultValue} disabled={disabled} />
      )}
    </FormGroup>
  );
};

export default FormInput;
