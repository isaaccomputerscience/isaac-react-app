import { screen } from "@testing-library/react";
import {
  SelectedEventDetails,
  countStudentsAndTeachers,
} from "../../../../../app/components/elements/panels/SelectedEventDetails";
import { ACTION_TYPE, API_PATH, asPercentage, augmentEvent, formatAddress } from "../../../../../app/services";
import { renderTestEnvironment } from "../../../../utils";
import { mockEvent, mockEventBookings } from "../../../../../mocks/data";
import { AugmentedEvent } from "../../../../../IsaacAppTypes";
import { EventBookingDTO, IsaacEventPageDTO } from "../../../../../IsaacApiTypes";
import { FRIENDLY_DATE_AND_TIME } from "../../../../../app/components/elements/DateString";
import { store } from "../../../../../app/state";
import { rest } from "msw";
import { countEventDetailsByRole } from "../../../../../app/components/elements/panels/EventGenderDetails";

describe("SelectedEventDetails", () => {
  const setupTest = (eventPage: IsaacEventPageDTO) => {
    renderTestEnvironment({
      PageComponent: SelectedEventDetails,
      componentProps: {
        eventId: mockEvent.id,
      },
      initialRouteEntries: ["/admin/events/"],
      extraEndpoints: [
        rest.get(API_PATH + `/events/${mockEvent.id}`, (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(eventPage));
        }),
      ],
    });
    store.dispatch({
      type: ACTION_TYPE.EVENT_BOOKINGS_RESPONSE_SUCCESS,
      eventBookings: mockEventBookings,
    });
  };

  const findExpectedValues = (event: AugmentedEvent, eventBookings: EventBookingDTO[]) => {
    const { genders: studentGenders, numberOfConfirmedOrAttendedBookings: studentBookingsCount } =
      countEventDetailsByRole("STUDENT", eventBookings);
    const { genders: teacherGenders, numberOfConfirmedOrAttendedBookings: teacherBookingsCount } =
      countEventDetailsByRole("TEACHER", eventBookings);
    const title = `${event.title as string} - ${event.subtitle as string}`;
    const location = event.isVirtual ? "Online" : formatAddress(event.location);
    const status = event.eventStatus as string;
    const date = `${FRIENDLY_DATE_AND_TIME.format(event.date)} - ${FRIENDLY_DATE_AND_TIME.format(event.endDate)}`;
    const bookingDeadline = FRIENDLY_DATE_AND_TIME.format(event.bookingDeadline);
    const { studentCount, teacherCount } = countStudentsAndTeachers(eventBookings);
    const placesAvailable = `${event.placesAvailable} / ${event.numberOfPlaces}`;
    const numberOfStudents = `${studentCount} / ${event.numberOfPlaces}`;
    const numberOfTeachers = `${teacherCount} / ${event.numberOfPlaces}`;
    const studentMaleGender = `${studentGenders.male} (${asPercentage(studentGenders.male, studentBookingsCount)}%)`;
    const studentFemaleGender = `${studentGenders.female} (${asPercentage(
      studentGenders.female,
      studentBookingsCount,
    )}%)`;
    const studentOtherGender = `${studentGenders.other} (${asPercentage(studentGenders.other, studentBookingsCount)}%)`;
    const studentPreferNotToSayGender = `${studentGenders.preferNotToSay} (${asPercentage(
      studentGenders.preferNotToSay,
      studentBookingsCount,
    )}%)`;
    const studentUnknownGender = `${studentGenders.unknown} (${asPercentage(
      studentGenders.unknown,
      studentBookingsCount,
    )}%)`;
    const teacherMaleGender = `${teacherGenders.male} (${asPercentage(teacherGenders.male, teacherBookingsCount)}%)`;
    const teacherFemaleGender = `${teacherGenders.female} (${asPercentage(
      teacherGenders.female,
      teacherBookingsCount,
    )}%)`;
    const teacherOtherGender = `${teacherGenders.other} (${asPercentage(teacherGenders.other, teacherBookingsCount)}%)`;
    const teacherPreferNotToSayGender = `${teacherGenders.preferNotToSay} (${asPercentage(
      teacherGenders.preferNotToSay,
      teacherBookingsCount,
    )}%)`;
    const teacherUnknownGender = `${teacherGenders.unknown} (${asPercentage(
      teacherGenders.unknown,
      teacherBookingsCount,
    )}%)`;

    return [
      title,
      location,
      status,
      date,
      bookingDeadline,
      placesAvailable,
      numberOfStudents,
      numberOfTeachers,
      studentMaleGender,
      studentFemaleGender,
      studentOtherGender,
      studentPreferNotToSayGender,
      studentUnknownGender,
      teacherMaleGender,
      teacherFemaleGender,
      teacherOtherGender,
      teacherPreferNotToSayGender,
      teacherUnknownGender,
    ];
  };

  it("renders all event details when event is selected", async () => {
    const eventDetails = mockEvent;
    const augmentedEvent = augmentEvent(eventDetails);
    setupTest(eventDetails);
    const eventInfo = await screen.findByTestId("event-details");
    const expectedValues = findExpectedValues(augmentedEvent, mockEventBookings);
    expectedValues.forEach((each) => expect(eventInfo).toHaveTextContent(each));
    const title = screen.getByText("Selected event details");
    expect(title).toBeInTheDocument();
  });

  it("renders address if event is not virtual, and address is provided", async () => {
    const eventDetails = {
      ...mockEvent,
      tags: ["student", "booster"],
      location: {
        address: {
          addressLine1: "Fake Street",
          town: "Fake Town",
          postalCode: "FAKE 123",
        },
      },
    };
    const augmentedEvent = augmentEvent(eventDetails);
    setupTest(eventDetails);
    const eventInfo = await screen.findByTestId("event-details");
    const location = findExpectedValues(augmentedEvent, mockEventBookings)[1];
    expect(eventInfo).toHaveTextContent(location);
  });

  it("shows Prepwork deadline if present in the event details", async () => {
    const eventDetails = {
      ...mockEvent,
      prepWorkDeadline: 1695897589235,
    };
    setupTest(eventDetails);
    const eventInfo = await screen.findByTestId("event-details");
    const prepWorkDeadline = FRIENDLY_DATE_AND_TIME.format(eventDetails.prepWorkDeadline);
    expect(eventInfo).toHaveTextContent(prepWorkDeadline);
    expect(eventInfo).toHaveTextContent("Prepwork deadline");
  });

  it("does not show Prepwork deadline if not present in the event details", async () => {
    setupTest(mockEvent);
    const eventInfo = await screen.findByTestId("event-details");
    expect(eventInfo).not.toHaveTextContent("Prepwork deadline");
  });

  it("shows private event badge if event is private", async () => {
    setupTest({ ...mockEvent, privateEvent: true });
    const eventInfo = await screen.findByTestId("event-details");
    expect(eventInfo).toHaveTextContent("Private Event");
  });

  it("does not show private event badge if event is not private", async () => {
    setupTest(mockEvent);
    const eventInfo = await screen.findByTestId("event-details");
    expect(eventInfo).not.toHaveTextContent("Private Event");
  });

  it("does not show booking deadline if not present in the event details", async () => {
    setupTest({ ...mockEvent, bookingDeadline: undefined });
    const eventInfo = await screen.findByTestId("event-details");
    expect(eventInfo).not.toHaveTextContent("Booking deadline");
  });

  it("shows message if event details are not found", async () => {
    renderTestEnvironment({
      PageComponent: SelectedEventDetails,
      componentProps: {
        eventId: mockEvent.id,
      },
      initialRouteEntries: ["/admin/events/"],
      extraEndpoints: [
        rest.get(API_PATH + `/events/${mockEvent.id}`, (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({}));
        }),
      ],
    });
    const eventInfo = await screen.findByTestId("event-details-not-found");
    expect(eventInfo).toHaveTextContent("Event details not found.");
  });
});
