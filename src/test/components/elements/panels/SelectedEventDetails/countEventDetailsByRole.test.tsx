import { BookingStatus, EventBookingDTO, Gender, UserRole } from "../../../../../IsaacApiTypes";
import { countEventDetailsByRole } from "../../../../../app/components/elements/panels/EventGenderDetails";
import { mockEventBooking, mockEventBookings } from "../../../../../mocks/data";

const genders = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY", "UNKNOWN"] as Gender[];
const bookingsWithGenderAndStatus: EventBookingDTO[] = mockEventBookings.map((booking, index) => {
  const updatedBooking = {
    ...booking,
    bookingStatus: "CONFIRMED" as BookingStatus,
    userBooked: { ...booking.userBooked, gender: genders[index] },
  };
  return updatedBooking;
});
describe("countEventDetailsByRole", () => {
  it("returns an object with all genders and count set to 0 when there are no bookings", () => {
    const bookings = [] as EventBookingDTO[];
    const result = countEventDetailsByRole(undefined, bookings);
    expect(result).toEqual({
      genders: { male: 0, female: 0, other: 0, preferNotToSay: 0, unknown: 0 },
      numberOfConfirmedOrAttendedBookings: 0,
    });
  });

  it("should return the correct count of genders and count when passed an array of Event Bookings", () => {
    const result = countEventDetailsByRole(undefined, bookingsWithGenderAndStatus);
    expect(result).toEqual({
      genders: { male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 1 },
      numberOfConfirmedOrAttendedBookings: 5,
    });
  });

  it("should not count bookings with invalid bookingStatus", () => {
    const cancelledBooking: EventBookingDTO = {
      ...mockEventBooking,
      bookingStatus: "CANCELLED",
      userBooked: { ...mockEventBooking.userBooked, gender: "FEMALE" },
    };
    const results = countEventDetailsByRole(undefined, [...bookingsWithGenderAndStatus, cancelledBooking]);
    expect(results).toEqual({
      genders: { male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 1 },
      numberOfConfirmedOrAttendedBookings: 5,
    });
  });

  it("should count user bookings without a gender as Unknown", () => {
    const bookingWithUndefinedGender: EventBookingDTO = {
      ...mockEventBooking,
      bookingStatus: "CONFIRMED",
      userBooked: { ...mockEventBooking.userBooked, gender: undefined },
    };
    const results = countEventDetailsByRole(undefined, [...bookingsWithGenderAndStatus, bookingWithUndefinedGender]);
    expect(results).toEqual({
      genders: { male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 2 },
      numberOfConfirmedOrAttendedBookings: 6,
    });
  });

  const bookingsWithRoles: EventBookingDTO[] = bookingsWithGenderAndStatus.map((booking) => {
    const updatedBooking = {
      ...booking,
      userBooked: { ...booking.userBooked, role: "STUDENT" as UserRole },
    };
    return updatedBooking;
  });

  it("filters event details by role", () => {
    const results = countEventDetailsByRole("STUDENT", bookingsWithRoles);
    expect(results).toEqual({
      genders: { male: 1, female: 1, other: 1, preferNotToSay: 1, unknown: 1 },
      numberOfConfirmedOrAttendedBookings: 5,
    });
  });

  it("returns 0 if no event bookings with specified role exist", () => {
    const results = countEventDetailsByRole("TEACHER", bookingsWithRoles);
    expect(results).toEqual({
      genders: { male: 0, female: 0, other: 0, preferNotToSay: 0, unknown: 0 },
      numberOfConfirmedOrAttendedBookings: 0,
    });
  });
});
