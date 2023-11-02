import { GenderDetails, countGenders } from "../../../../../app/components/elements/panels/SelectedEventDetails";
import { asPercentage } from "../../../../../app/services";
import { mockEventBookings } from "../../../../../mocks/data";
import { renderTestEnvironment } from "../../../../utils";
import { screen } from "@testing-library/react";

describe("GenderDetails", () => {
  const setupTest = (props = {}) => {
    renderTestEnvironment({
      PageComponent: GenderDetails,
      componentProps: {
        ...props,
      },
      initialRouteEntries: ["/admin/events/"],
    });
  };

  it("renders a list of 0 count genders when there are no event bookings", () => {
    setupTest({ eventBookings: [] });
    const eventGenders = screen.getByTestId("event-genders");
    expect(eventGenders).toHaveTextContent("Gender:");
    const genderStats = screen.getByRole("list");
    const expectedValues = ["Male", "Female", "Other", "Prefer not to say", "Unknown"];
    expectedValues.forEach((value) => {
      expect(genderStats).toHaveTextContent(`${value}: 0 (0%)`);
    });
  });

  it("renders a list of genders with correct counts when there are event bookings", () => {
    setupTest({ eventBookings: mockEventBookings });
    const genderStats = screen.getByRole("list");
    const { male, female, other, preferNotToSay, unknown } = countGenders(mockEventBookings);
    const numberOfConfirmedOrAttendedBookings = mockEventBookings.filter((mockEventBookings) => {
      return mockEventBookings.bookingStatus === "CONFIRMED" || mockEventBookings.bookingStatus === "ATTENDED";
    }).length;
    const expectedValues = [
      `Male: ${male} (${asPercentage(male, numberOfConfirmedOrAttendedBookings)}%)`,
      `Female: ${female} (${asPercentage(female, numberOfConfirmedOrAttendedBookings)}%)`,
      `Other: ${other} (${asPercentage(other, numberOfConfirmedOrAttendedBookings)}%)`,
      `Prefer not to say: ${preferNotToSay} (${asPercentage(preferNotToSay, numberOfConfirmedOrAttendedBookings)}%)`,
      `Unknown: ${unknown} (${asPercentage(unknown, numberOfConfirmedOrAttendedBookings)}%)`,
    ];
    expectedValues.forEach((value) => {
      expect(genderStats).toHaveTextContent(value);
    });
  });
});
