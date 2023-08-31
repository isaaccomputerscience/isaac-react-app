import React from "react";
import { Input } from "reactstrap";

interface CurrentPasswordProps {
  type: "password" | "text";
  disabled?: boolean;
  invalid?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleIcon?: React.ReactNode;
}

const CurrentPassword: React.FC<CurrentPasswordProps> = (props) => {
  const {
    type,
    invalid,
    onChange,
    toggleIcon,
  } = props;

  return (
    <div className="password-group">
      <Input
        id="current-password"
        type={type}
        name="current-password"
        autoComplete="current-password"
        required
        invalid={invalid}
        onChange={(e) => {
          onChange(e);
        }}
      />
      {toggleIcon && (
        <span id="password-toggle" className="password-toggle-icon">
          {toggleIcon}
        </span>
      )}
    </div>
  );
};

export default CurrentPassword;
