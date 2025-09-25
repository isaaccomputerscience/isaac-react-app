import React from "react";
import { FormGroup, Label, Input } from "reactstrap";
import { InputType } from "reactstrap/es/Input";
import { AppGroup } from "../../../../../IsaacAppTypes";

interface FormInputProps {
  label: string;
  subLabel?: string;
  type: string;
  id: string;
  disabled: boolean;
  options?: string[];
  defaultValue?: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  activeGroups?: AppGroup[];
  setSelectedGroup?: (group: AppGroup | null) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormInput = ({
  label,
  subLabel,
  type,
  id,
  disabled,
  options = [],
  defaultValue,
  required = true,
  value,
  placeholder,
  activeGroups = [],
  setSelectedGroup,
  onChange,
}: FormInputProps) => {
  return (
    <FormGroup>
      <Label className="entry-form-sub-title">
        {label} {required && <span className="entry-form-asterisk">*</span>}
      </Label>
      {subLabel && <div className="entry-form-sub-title">{subLabel}</div>}
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
        <Input
          type={type as InputType}
          id={id}
          defaultValue={defaultValue}
          disabled={disabled}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
    </FormGroup>
  );
};

export default FormInput;
