import React from "react";
import { Input } from "reactstrap";

interface NewPasswordProps {
  type: "password" | "text";
  disabled?: boolean;
  invalid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleIcon?: React.ReactNode;
  defaultValue?: string;
}

const NewPassword: React.FC<NewPasswordProps> = (props) => {
  const {
    type,
    disabled,
    invalid,
    onChange,
    onBlur,
    onFocus,
    toggleIcon,
    defaultValue,
  } = props;

  return (
    <div className="password-group">
      <Input
        id="new-password"
        type={type}
        name="new-password"
        autoComplete="new-password"
        required
        disabled={disabled}
        invalid={invalid}
        onChange={(e) => {
          onChange(e);
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-describedby={invalid ? "invalidPassword" : undefined}
        defaultValue={defaultValue}
      />
      {toggleIcon && (
        <span id="password-toggle" className="password-toggle-icon">
          {toggleIcon}
        </span>
      )}
    </div>
  );
};

export default NewPassword;
