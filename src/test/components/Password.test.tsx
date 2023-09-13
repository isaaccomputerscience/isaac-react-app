import React from "react";
import { render, fireEvent } from "@testing-library/react";
import Password, {
  PasswordProps,
} from "../../app/components/elements/inputs/Password";

describe("Password Component", () => {
  let setIsPasswordVisibleMock: jest.Mock;
  let onChange: jest.Mock;
  let onBlur: jest.Mock;
  let onFocus: jest.Mock;
  let passwordInput: HTMLInputElement;
  let toggleIcon: HTMLElement | null;

  beforeEach(() => {
    setIsPasswordVisibleMock = jest.fn();
    onChange = jest.fn();
    onBlur = jest.fn();
    onFocus = jest.fn();
  });

  const passwordFieldTypes = [
    { type: "New", expectedName: "new-password" },
    { type: "Confirm", expectedName: "password-confirm" },
    { type: "Current", expectedName: "current-password" },
  ] as const;

  const renderPassword = (props: Partial<PasswordProps> = {}) => {
    const defaultProps: PasswordProps = {
      passwordFieldType: "New",
      isPasswordVisible: false,
      setIsPasswordVisible: setIsPasswordVisibleMock,
      onChange,
      onBlur,
      onFocus,
      ...props,
    };

    return render(<Password {...defaultProps} />);
  };

  describe("Event Handling", () => {
    test("handles onChange, onBlur, and onFocus events when typing", () => {
      const { container } = renderPassword();

      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: "newPassword123" } });
      expect(onChange).toHaveBeenCalledTimes(1);

      fireEvent.blur(passwordInput);
      expect(onBlur).toHaveBeenCalledTimes(1);

      fireEvent.focus(passwordInput);
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("Toggle Icon", () => {
    test("shows toggle icon and handles click, changing password to visible", () => {
      const { getByTestId, container } = renderPassword({
        showToggleIcon: true,
      });
      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;
      toggleIcon = getByTestId("show-password-icon");
      expect(passwordInput).toHaveAttribute("type", "password");
      fireEvent.click(toggleIcon);
      expect(setIsPasswordVisibleMock).toHaveBeenCalledTimes(1);
      expect(setIsPasswordVisibleMock).toHaveBeenCalledWith(true);
    });

    test("shows toggle icon and handles click, changing password to hidden", () => {
      const { getByTestId, container } = renderPassword({
        isPasswordVisible: true,
        showToggleIcon: true,
      });
      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;
      expect(passwordInput).toHaveAttribute("type", "text");
      const hideIcon = getByTestId("hide-password-icon");
      fireEvent.click(hideIcon);
      expect(setIsPasswordVisibleMock).toHaveBeenCalledTimes(1);
      expect(setIsPasswordVisibleMock).toHaveBeenCalledWith(false);
    });

    test("does not show toggle icon when 'showToggleIcon' prop is not provided", () => {
      const { queryByTestId } = renderPassword();

      toggleIcon = queryByTestId("show-password-icon");
      expect(toggleIcon).toBe(null);
    });
  });

  describe("Rendering Styles", () => {
    test("renders with invalid style when 'invalid' prop is true", () => {
      const { container } = renderPassword({ invalid: true });

      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;

      expect(passwordInput.classList.contains("is-invalid")).toBe(true);
    });

    test.each(passwordFieldTypes)(
      "renders with correct name attribute for passwordFieldType: %s",
      ({ type, expectedName }) => {
        const { container } = renderPassword({
          passwordFieldType: type,
        });

        passwordInput = container.querySelector(
          `input[name="${expectedName}"]`
        ) as HTMLInputElement;

        expect(passwordInput.name).toBe(expectedName);
      }
    );

    test("renders with disabled attribute when 'disabled' prop is true", () => {
      const { container } = renderPassword({
        disabled: true,
      });

      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;

      expect(passwordInput).toHaveAttribute("disabled");
    });

    test("renders with aria-describedby attribute when 'ariaDescribedBy' prop is provided", () => {
      const ariaDescribedByValue = "examplePasswordError";

      const { container } = renderPassword({
        ariaDescribedBy: ariaDescribedByValue,
      });

      passwordInput = container.querySelector(
        'input[name="new-password"]'
      ) as HTMLInputElement;

      expect(passwordInput).toHaveAttribute(
        "aria-describedby",
        ariaDescribedByValue
      );
    });
  });
});
