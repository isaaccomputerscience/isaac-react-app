import { fireEvent, screen } from "@testing-library/react";
import { renderTestEnvironment } from "../../../utils";
import { RegistrationDobInput } from "../../../../app/components/elements/inputs/RegistrationDobInput";
import { mockUserToUpdate } from "../../../../mocks/data";

const mockSetUserToUpdate = jest.fn();
const mockSetDobOver13CheckboxChecked = jest.fn();

describe("RegistrationDobInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupTest = (
    path: "/register/student" | "/register/teacher",
    props = {}
  ) => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: path,
      },
      writable: true,
    });

    renderTestEnvironment({
      role: "ANONYMOUS",
      PageComponent: RegistrationDobInput,
      componentProps: {
        userToUpdate: mockUserToUpdate,
        setUserToUpdate: mockSetUserToUpdate,
        submissionAttempted: false,
        dobOver13CheckboxChecked: false,
        setDobOver13CheckboxChecked: mockSetDobOver13CheckboxChecked,
        ...props,
      },
      initialRouteEntries: ["/"],
    });
  };

  it("renders correctly for student registration", () => {
    setupTest("/register/student");
    const dateOfBirthInputs = ["day", "month", "year"].map((unit) =>
      screen.getByRole("combobox", {
        name: new RegExp(`${unit} of birth`, "i"),
      })
    );
    dateOfBirthInputs.forEach((input) => expect(input).toBeInTheDocument());
    const over13Checkbox = screen.getByRole("checkbox", {
      name: /i am at least 13 years old/i,
    });
    expect(over13Checkbox).toBeInTheDocument();
  });

  it("renders correctly for teacher registration", () => {
    setupTest("/register/teacher");
    const dateOfBirthInputs = ["day", "month", "year"].map((unit) =>
      screen.getByRole("combobox", {
        name: new RegExp(`${unit} of birth`, "i"),
      })
    );
    dateOfBirthInputs.forEach((input) => expect(input).toBeInTheDocument());
    const over13Checkbox = screen.queryByRole("checkbox", {
      name: /i am at least 13 years old/i,
    });
    expect(over13Checkbox).not.toBeInTheDocument();
  });

  it("changes the user details when the date of birth dropdowns are changed", async () => {
    setupTest("/register/student");
    const dateOfBirthInputs = ["day", "month", "year"].map((unit) =>
      screen.getByRole("combobox", {
        name: new RegExp(`${unit} of birth`, "i"),
      })
    );
    fireEvent.change(dateOfBirthInputs[0], { target: { value: "15" } });
    fireEvent.change(dateOfBirthInputs[1], { target: { value: "3" } });
    fireEvent.change(dateOfBirthInputs[2], { target: { value: "2006" } });
    const expectedDate = new Date("2006-03-15");
    expect(mockSetUserToUpdate).toHaveBeenCalledTimes(3);
    expect(mockSetUserToUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOfBirth: expectedDate,
      })
    );
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledTimes(3);
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledWith(false);
  });

  it("updates the over-13 value if checkbox is checked", async () => {
    setupTest("/register/student");
    const over13Checkbox = screen.getByRole("checkbox", {
      name: /i am at least 13 years old/i,
    });
    fireEvent.click(over13Checkbox);
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledTimes(1);
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledWith(true);
  });

  it("if a valid date of birth is selected, the over 13 checkbox is disabled", async () => {
    setupTest("/register/student", {
      userToUpdate: {
        ...mockUserToUpdate,
        dateOfBirth: new Date("2006-03-15"),
      },
      dobOver13CheckboxChecked: true,
    });
    const over13Checkbox = screen.getByRole("checkbox", {
      name: /i am at least 13 years old/i,
    });
    expect(over13Checkbox).toBeDisabled();
    const dobError = screen.queryByText(/please enter a valid date of birth/i);
    expect(dobError).toBeNull();
  });

  it("if an invalid date of birth is selected, an error is shown", async () => {
    setupTest("/register/student", {
      userToUpdate: {
        ...mockUserToUpdate,
        dateOfBirth: new Date("2019-03-15"),
      },
    });
    const dateOfBirthInputs = ["day", "month", "year"].map((unit) =>
      screen.getByRole("combobox", {
        name: new RegExp(`${unit} of birth`, "i"),
      })
    );
    dateOfBirthInputs.forEach((input) => expect(input).toBeInvalid());
    const over13Checkbox = screen.getByRole("checkbox", {
      name: /i am at least 13 years old/i,
    });
    expect(over13Checkbox).toBeInvalid();
    const dobError = screen.getByText(/please enter a valid date of birth/i);
    expect(dobError).toBeInTheDocument();
  });

  it("if date of birth is selected, user can clear it using X button", async () => {
    setupTest("/register/student", {
      userToUpdate: {
        ...mockUserToUpdate,
        dateOfBirth: new Date("2006-03-15"),
      },
      over13CheckboxChecked: true,
    });
    const clearDobButton = screen.getByRole("button", {
      name: /clear date of birth/i,
    });
    fireEvent.click(clearDobButton);
    expect(mockSetUserToUpdate).toHaveBeenCalledTimes(1);
    expect(mockSetUserToUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        dateOfBirth: undefined,
      })
    );
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledTimes(1);
    expect(mockSetDobOver13CheckboxChecked).toHaveBeenCalledWith(false);
  });

  it("show error if user selects Feb 29th in a non-leap year", async () => {
    setupTest("/register/student", {
      userToUpdate: {
        ...mockUserToUpdate,
        dateOfBirth: new Date("2023-02-29"),
      },
    });
    const dobError = screen.getByText(/please enter a valid date of birth/i);
    expect(dobError).toBeInTheDocument();
  });
});
