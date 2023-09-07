import { fireEvent, screen } from "@testing-library/react";
import { renderTestEnvironment } from "../../../utils";
import { RegistrationNameInput } from "../../../../app/components/elements/inputs/RegistrationNameInput";
import { mockUserToUpdate } from "../../../../mocks/data";

const setUserToUpdateMock = jest.fn();

describe("RegistrationNameInput", () => {
  const setupTest = (props = {}) => {
    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: RegistrationNameInput,
      componentProps: {
        userToUpdate: mockUserToUpdate,
        setUserToUpdate: setUserToUpdateMock,
        attemptedSignUp: false,
        ...props,
      },
      initialRouteEntries: ["/register/student"],
    });
  };

  it("renders the component with first and last name inputs", () => {
    setupTest();

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");

    expect(firstNameInput).toBeInTheDocument();
    expect(lastNameInput).toBeInTheDocument();
  });

  it("updates user's first name in the userToUpdate object when input changes", () => {
    setupTest();
    const firstNameInput = screen.getByLabelText("First name");
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.blur(firstNameInput);
    expect(setUserToUpdateMock).toHaveBeenCalledWith({
      ...mockUserToUpdate,
      givenName: "John",
    });
  });

  it("updates user's last name in the userToUpdate object when input changes", () => {
    setupTest();
    const familyNameInput = screen.getByLabelText("Last name");
    fireEvent.change(familyNameInput, { target: { value: "Test" } });
    fireEvent.blur(familyNameInput);
    expect(setUserToUpdateMock).toHaveBeenCalledWith({
      ...mockUserToUpdate,
      familyName: "Test",
    });
  });

  it("displays validation message when givenName is invalid and signup attempted", () => {
    setupTest({
      userToUpdate: {
        ...mockUserToUpdate,
        givenName: "123*",
        familyName: "Test",
      },
      attemptedSignUp: true,
    });
    const firstNameValidationMessage = screen.getByText("Enter a valid name");
    expect(firstNameValidationMessage).toBeInTheDocument();
  });

  it("displays validation message when familyName is invalid and signup attempted", () => {
    setupTest({
      userToUpdate: {
        ...mockUserToUpdate,
        givenName: "Test",
        familyName: "123*",
      },
      attemptedSignUp: true,
    });
    const firstNameValidationMessage = screen.getByText("Enter a valid name");
    expect(firstNameValidationMessage).toBeInTheDocument();
  });

  it("displays two validation messages when both givenName and familyName are invalid and signup attempted", () => {
    setupTest({
      userToUpdate: {
        ...mockUserToUpdate,
        givenName: "123*",
        familyName: "123*",
      },
      attemptedSignUp: true,
    });
    const validationMessages = screen.queryAllByText("Enter a valid name");
    expect(validationMessages).toHaveLength(2);
  });

  it("does not display validation message when both names are valid", () => {
    setupTest({
      userToUpdate: {
        ...mockUserToUpdate,
        givenName: "John",
        familyName: "Test",
      },
      attemptedSignUp: true,
    });
    const nameValidationMessage = screen.queryByText("Enter a valid name");
    expect(nameValidationMessage).toBeNull();
  });
});
