import { TestUserRole, checkPageTitle, renderTestEnvironment } from "../utils";
import { mockEvent } from "../../mocks/data";
import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { IsaacEventPageDTO } from "../../IsaacApiTypes";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as eventServices from "../../app/services/events";
import { formatAddress } from "../../app/components/pages/EventDetails";
import { FRIENDLY_DATE_AND_TIME, TIME_ONLY } from "../../app/components/elements/DateString";

describe("EventDetails", () => {
  const setupTest = async ({ role, event }: { role: TestUserRole; event: IsaacEventPageDTO }) => {
    renderTestEnvironment({
      role: role,
      extraEndpoints: [
        rest.get(API_PATH + "/events", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ results: [event], totalResults: 0 }));
        }),
        rest.get(API_PATH + "/events/:eventId", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(event));
        }),
      ],
    });
    const eventCards = await screen.findAllByTestId("event-card");
    const eventCardViewDetails = within(eventCards[0]).getByText("View details");
    await userEvent.click(eventCardViewDetails);
  };

  it("renders without crashing", async () => {
    await setupTest({ role: "STUDENT", event: mockEvent as IsaacEventPageDTO });
    checkPageTitle(mockEvent.title);
  });

  it("displays event title a second time with image, if image is defined", async () => {
    await setupTest({ role: "STUDENT", event: mockEvent as IsaacEventPageDTO });
    const secondTitle = screen.getByTestId("event-details-title");
    const image = screen.getByTestId("event-details-image");
    expect(secondTitle).toBeInTheDocument();
    expect(image).toHaveAttribute("src", mockEvent.eventThumbnail.src);
  });

  it("uses a placeholder image if no image is specified", async () => {
    await setupTest({ role: "STUDENT", event: { ...mockEvent, eventThumbnail: undefined } as IsaacEventPageDTO });
    const image = screen.getByTestId("event-details-image");
    expect(image).toHaveAttribute("src", "http://placehold.it/500x276");
  });

  it("shows a map and address details if location, latitude and longitude are specified, and event is not tagged as online", async () => {
    const mapLocation = {
      address: { addressLine1: "Mock street", town: "Mock town", postalCode: "ABC 123" },
      latitude: 53.95038292218263,
      longitude: -1.0510007751299424,
    };
    await setupTest({
      role: "STUDENT",
      event: { ...mockEvent, tags: ["booster", "student"], location: mapLocation } as IsaacEventPageDTO,
    });
    const map = screen.getByTestId("event-map");
    const location = screen.getByTestId("event-location");
    expect(map).toBeInTheDocument();
    expect(location).toHaveTextContent(formatAddress(mapLocation));
  });

  it("shows location as online if event is tagged as virtual", async () => {
    await setupTest({ role: "STUDENT", event: { ...mockEvent, tags: ["virtual"] } as IsaacEventPageDTO });
    const location = screen.getByTestId("event-location");
    expect(location).toHaveTextContent("Online");
  });

  it("shows private event badge if event is private", async () => {
    await setupTest({ role: "STUDENT", event: { ...mockEvent, privateEvent: true } as IsaacEventPageDTO });
    const privateBadge = screen.getByText("Private Event");
    expect(privateBadge).toBeVisible();
  });

  it("does not show private event badge if even is not private", async () => {
    await setupTest({ role: "STUDENT", event: { ...mockEvent, privateEvent: false } as IsaacEventPageDTO });
    const privateBadge = screen.queryByText("Private Event");
    expect(privateBadge).not.toBeInTheDocument();
  });

  it.each(["ADMIN", "EVENT_MANAGER", "CONTENT_EDITOR"] as TestUserRole[])(
    "if user is %s, a google calendar button shows and can be clicked",
    async (role) => {
      const mockGoogleCalendarTemplate = jest.fn();
      jest.spyOn(eventServices, "googleCalendarTemplate").mockImplementation(mockGoogleCalendarTemplate);
      await setupTest({ role: role, event: mockEvent as IsaacEventPageDTO });
      const googleCalendarButton = screen.getByText("Add to Calendar");
      expect(googleCalendarButton).toBeVisible();
      await userEvent.click(googleCalendarButton);
      expect(mockGoogleCalendarTemplate).toHaveBeenCalled();
    },
  );

  it("if user is STUDENT, a google calendar button does not show", async () => {
    await setupTest({ role: "STUDENT", event: mockEvent as IsaacEventPageDTO });
    const googleCalendarButton = screen.queryByText("Add to Calendar");
    expect(googleCalendarButton).not.toBeInTheDocument();
  });

  it("shows event date and time, and message if event was in the past", async () => {
    const startDate = new Date(new Date().setMonth(new Date().getMonth() - 2));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const pastEvent = { ...mockEvent, date: startDate, endDate: endDate } as IsaacEventPageDTO;
    await setupTest({
      role: "STUDENT",
      event: pastEvent as IsaacEventPageDTO,
    });
    const eventDate = screen.getByTestId("event-date");
    const eventDateText = `${FRIENDLY_DATE_AND_TIME.format(startDate)} — ${TIME_ONLY.format(endDate)}`;
    expect(eventDate).toHaveTextContent(eventDateText);
    expect(eventDate).toHaveTextContent("This event is in the past.");
  });

  it("if event is in the future, no past event warning shows", async () => {
    const startDate = new Date(new Date().setMonth(new Date().getMonth() + 2));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const futureEvent = { ...mockEvent, date: startDate, endDate: endDate } as IsaacEventPageDTO;
    await setupTest({
      role: "STUDENT",
      event: futureEvent as IsaacEventPageDTO,
    });
    const eventDate = screen.getByTestId("event-date");
    expect(eventDate).not.toHaveTextContent("This event is in the past.");
  });

  it("if event has available places, number of available spaces is shown, and `book a place` button is shown for logged in users", async () => {
    const event = { ...mockEvent, placesAvailable: 10 } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const placesAvailable = screen.getByTestId("event-availability");
    expect(placesAvailable).toHaveTextContent("10 spaces");
    const bookButton = screen.getByRole("button", { name: "Book a place" });
    expect(bookButton).toBeInTheDocument();
  });

  it("if event has no available places, Full badge and `join waiting list` button is shown for logged in users", async () => {
    const event = { ...mockEvent, placesAvailable: 0 } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const placesAvailable = screen.getByTestId("event-availability");
    expect(placesAvailable).toHaveTextContent("Full");
    const bookButton = screen.getByRole("button", { name: "Join waiting list" });
    expect(bookButton).toBeInTheDocument();
  });

  it("if event has no available places and is WAITING_LIST_ONLY, `request a place` button is shown for logged in users", async () => {
    const event = { ...mockEvent, placesAvailable: 0, eventStatus: "WAITING_LIST_ONLY" } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const placesAvailable = screen.getByTestId("event-availability");
    expect(placesAvailable).toHaveTextContent("Full");
    const bookButton = screen.getByRole("button", { name: "Request a place" });
    expect(bookButton).toBeInTheDocument();
  });

  it("if event has no available places and user is RESERVED, `complete reservation` and `cancel registration` buttons are shown for logged in users", async () => {
    const event = {
      ...mockEvent,
      placesAvailable: 0,
      eventStatus: "WAITING_LIST_ONLY",
      userBookingStatus: "RESERVED",
    } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const placesAvailable = screen.getByTestId("event-availability");
    expect(placesAvailable).toHaveTextContent("Full");
    const confirmBookingButton = screen.getByRole("button", { name: /Complete your registration below/i });
    expect(placesAvailable).toContainElement(confirmBookingButton);
    const cancelButton = screen.getByRole("button", { name: "Cancel your reservation" });
    expect(cancelButton).toBeInTheDocument();
  });

  it("if not logged in and places available, `login to book` button is shown", async () => {
    const event = { ...mockEvent, placesAvailable: 10 } as IsaacEventPageDTO;
    await setupTest({ role: "ANONYMOUS", event });
    const bookButton = screen.getByRole("button", { name: "Login to book" });
    expect(bookButton).toBeInTheDocument();
  });

  it("if not logged in and no places available, `login to apply` button is shown", async () => {
    const event = { ...mockEvent, placesAvailable: 0 } as IsaacEventPageDTO;
    await setupTest({ role: "ANONYMOUS", event });
    const bookButton = screen.getByRole("button", { name: "Login to apply" });
    expect(bookButton).toBeInTheDocument();
  });

  it("if user is able to make reservations, `manage reservations` button is shown", async () => {
    const event = { ...mockEvent, placesAvailable: 10 } as IsaacEventPageDTO;
    await setupTest({ role: "TEACHER", event });
    const manageReservationsButton = screen.getByRole("button", { name: "Manage reservations" });
    expect(manageReservationsButton).toBeInTheDocument();
  });

  it("if user is already CONFIRMED on the event, `cancel booking` button is shown", async () => {
    const event = { ...mockEvent, placesAvailable: 10, userBookingStatus: "CONFIRMED" } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const cancelBookingButton = screen.getByRole("button", { name: "Cancel your booking" });
    expect(cancelBookingButton).toBeInTheDocument();
  });

  it("if user is already RESERVED on the event, `cancel reservation` button is shown", async () => {
    const event = { ...mockEvent, placesAvailable: 10, userBookingStatus: "RESERVED" } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const cancelBookingButton = screen.getByRole("button", { name: "Cancel your reservation" });
    expect(cancelBookingButton).toBeInTheDocument();
  });

  it("if user is already WAITING_LIST and event is WAITING_LIST_ONLY, `cancel booking request` button is shown", async () => {
    const event = {
      ...mockEvent,
      userBookingStatus: "WAITING_LIST",
      eventStatus: "WAITING_LIST_ONLY",
    } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const cancelBookingButton = screen.getByRole("button", { name: "Cancel booking request" });
    expect(cancelBookingButton).toBeInTheDocument();
  });

  it("if user is already WAITING_LIST and event is not WAITING_LIST_ONLY, `leave waiting list` button is shown", async () => {
    const event = {
      ...mockEvent,
      userBookingStatus: "WAITING_LIST",
    } as IsaacEventPageDTO;
    await setupTest({ role: "STUDENT", event });
    const cancelBookingButton = screen.getByRole("button", { name: "Leave waiting list" });
    expect(cancelBookingButton).toBeInTheDocument();
  });
});
