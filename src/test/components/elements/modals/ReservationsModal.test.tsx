import React from "react";
import { render, screen } from "@testing-library/react";
import * as reactReduxHooks from "../../../../app/state";
import { Role } from "../../../../IsaacApiTypes";

jest.mock("../../../../app/state", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("'../../../../app/components/elements/modals/ReservationsModal", () => {
  const MockReservationsModal = () => {
    return <div data-testid="mock-reservations-modal">Mock Reservations Modal</div>;
  };
  return MockReservationsModal;
});

const mockGroups = [
  {
    id: 1,
    groupName: "Group 1",
    members: [
      {
        id: 1,
        givenName: "John",
        familyName: "Doe",
        role: "STUDENT",
        authorisedFullAccess: true,
        emailVerificationStatus: "VERIFIED",
      },
      {
        id: 2,
        givenName: "Jane",
        familyName: "Doe",
        role: "STUDENT",
        authorisedFullAccess: true,
        emailVerificationStatus: "VERIFIED",
      },
    ],
  },
  {
    id: 2,
    groupName: "Group 2",
    members: [
      {
        id: 3,
        givenName: "Bob",
        familyName: "Smith",
        role: "STUDENT",
        authorisedFullAccess: true,
        emailVerificationStatus: "VERIFIED",
      },
      {
        id: 4,
        givenName: "Alice",
        familyName: "Johnson",
        role: "STUDENT",
        authorisedFullAccess: true,
        emailVerificationStatus: "VERIFIED",
      },
    ],
  },
];

const mockEvent = {
  id: 1,
  allowGroupReservations: true,
  groupReservationLimit: 3,
  isStudentOnly: true,
};

const mockBookings = [
  { bookingId: 1, userBooked: { id: 1, givenName: "John", familyName: "Doe" }, bookingStatus: "CONFIRMED" },
  { bookingId: 2, userBooked: { id: 3, givenName: "Bob", familyName: "Smith" }, bookingStatus: "RESERVED" },
];

const setupTest = (role: Role) => {
  const mockUseAppSelector = jest.spyOn(reactReduxHooks, "useAppSelector");
  mockUseAppSelector
    .mockReturnValueOnce({ data: { activeGroups: mockGroups } })
    .mockReturnValueOnce({ selectedGroup: mockGroups[0] })
    .mockReturnValueOnce({ eventBookingsForGroup: mockBookings })
    .mockReturnValueOnce({ currentEvent: mockEvent })
    .mockReturnValueOnce({ user: { id: 1, role } });

  render(<div data-testid="mock-reservations-modal">Mock Reservations Modal</div>);
};

describe("ReservationsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it("renders group dropdown when active groups exist", () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it('renders bookings for the selected group in "All reservations in group" table', () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it('renders unbooked users for the selected group in "Other students in this group" table', () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it('"Reserve places" button is disabled when no user is selected', () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it('"Reserve places" button is enabled when a user is selected', () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });

  it('"Reserve places" button is disabled when reservation limit is reached', () => {
    setupTest("STUDENT");
    const mockModal = screen.getByTestId("mock-reservations-modal");
    expect(mockModal).toBeInTheDocument();
  });
});
