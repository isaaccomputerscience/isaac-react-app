import React from "react";
import { Input } from "reactstrap";

interface ConfirmPasswordProps {
  type: "password" | "text";
  invalid?: boolean;
  disabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConfirmPassword: React.FC<ConfirmPasswordProps> = (props) => {
  const {
    type,
    invalid, 
    disabled,
    onChange
  } = props;

  return (
    <div className="password-group">
      <Input
        id="password-confirm"
        type={type}
        name="password-confirm"
        autoComplete="new-password"
        required
        aria-describedby={invalid ? "invalidPassword" : undefined}
        disabled={disabled}
        invalid={invalid}
        onChange={(e) => {
            onChange(e);
        }}
      />
    </div>
  );
};

export default ConfirmPassword;
