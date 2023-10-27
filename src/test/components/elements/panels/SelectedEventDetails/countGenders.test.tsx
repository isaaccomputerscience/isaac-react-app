import { EventBookingDTO } from "../../../../../IsaacApiTypes";
import { countGenders } from "../../../../../app/components/elements/panels/SelectedEventDetails";
import { mockCancelledEventBooking, mockEventBookings } from "../../../../../mocks/data";

describe("countGenders", () => {
  it("returns an object with all genders set to 0 when passed an empty array", () => {
    const result = countGenders([]);
    expect(result).toEqual({ male: 0, female: 0, other: 0, preferNotToSay: 0, unknown: 0 });
  });

  it("should return the correct count of genders when passed an array of Event Bookings", () => {
    const result = countGenders(mockEventBookings);
    expect(result).toEqual({ male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 1 });
  });

  it("should not count bookings with invalid bookingStatus", () => {
    const results = countGenders([...mockEventBookings, mockCancelledEventBooking] as EventBookingDTO[]);
    expect(results).toEqual({ male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 1 });
  });
});
