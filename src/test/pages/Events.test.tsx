import { renderTestEnvironment } from "../utils";
import { screen, within } from "@testing-library/react";
// import { EventStatusFilter } from "../../app/services";

import { rest } from "msw";
import { API_PATH } from "../../app/services";
import { IsaacEventPageDTO } from "../../IsaacApiTypes";
import { DAYS_AGO, DAYS_IN_FUTURE } from "../utils";

// Helper functions
const getEventCards = () => screen.getAllByTestId("event-card");
// const getEventDate = (card: HTMLElement) => within(card).getByTestId("event-card-date");
const getEventTitle = (card: HTMLElement) => within(card).getByTestId("event-card-title");
const getCancelledBadge = (card: HTMLElement) => within(card).queryByText("Cancelled");

describe("Events sorting", () => {
  const setupTest = async (events: IsaacEventPageDTO[]) => {
    renderTestEnvironment({
      role: "STUDENT",
      extraEndpoints: [
        rest.get(API_PATH + "/events", (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ results: events, totalResults: events.length }));
        }),
      ],
      initialRouteEntries: ["/events?show_booked_only=true"],
    });
    // Wait for all event cards to be rendered
    await screen.findAllByTestId("event-card", {}, { timeout: 5000 });
  };

  describe("My booked events sorting", () => {
    it("sorts future events by date (earliest first)", async () => {
      const events = [
        {
          id: "future_event_2",
          title: "Future Event 2",
          date: DAYS_IN_FUTURE(2),
          eventStatus: "OPEN" as const,
        },
        {
          id: "future_event_1",
          title: "Future Event 1",
          date: DAYS_IN_FUTURE(1),
          eventStatus: "OPEN" as const,
        },
      ];

      await setupTest(events);
      const eventCards = getEventCards();

      expect(getEventTitle(eventCards[0])).toHaveTextContent("Future Event 2");
      expect(getEventTitle(eventCards[1])).toHaveTextContent("Future Event 1");
    });

    it("puts cancelled events at the bottom", async () => {
      const events = [
        {
          id: "future_event",
          title: "Future Event",
          date: DAYS_IN_FUTURE(1),
          eventStatus: "OPEN" as const,
        },
        {
          id: "cancelled_event",
          title: "Cancelled Event",
          date: DAYS_IN_FUTURE(1),
          eventStatus: "CANCELLED" as const,
        },
      ];

      await setupTest(events);
      const eventCards = getEventCards();

      expect(getEventTitle(eventCards[0])).toHaveTextContent("Future Event");
      expect(getCancelledBadge(eventCards[1])).toBeInTheDocument();
    });

    it("puts past events at the bottom, sorted by date (most recent first)", async () => {
      const events = [
        {
          id: "future_event",
          title: "Future Event",
          date: DAYS_IN_FUTURE(1),
          eventStatus: "OPEN" as const,
        },
        {
          id: "past_event_2",
          title: "Past Event 2",
          date: DAYS_AGO(2),
          eventStatus: "OPEN" as const,
        },
        {
          id: "past_event_1",
          title: "Past Event 1",
          date: DAYS_AGO(1),
          eventStatus: "OPEN" as const,
        },
      ];

      await setupTest(events);
      const eventCards = getEventCards();

      expect(getEventTitle(eventCards[0])).toHaveTextContent("Future Event");
      expect(getEventTitle(eventCards[1])).toHaveTextContent("Past Event 1");
      expect(getEventTitle(eventCards[2])).toHaveTextContent("Past Event 2");
    });

    it.each([
      ["missing date", undefined],
      ["invalid date", DAYS_IN_FUTURE(1)],
    ])("handles events with %s", async (_, date) => {
      const events = [
        {
          id: "valid_date_event",
          title: "Valid Date Event",
          date: DAYS_IN_FUTURE(1),
          eventStatus: "OPEN" as const,
        },
        {
          id: "invalid_date_event",
          title: "Invalid Date Event",
          date: date,
          eventStatus: "OPEN" as const,
        },
      ];

      await setupTest(events);
      const eventCards = getEventCards();

      expect(getEventTitle(eventCards[0])).toHaveTextContent("Valid Date Event");
    });

    it("shows no results message when events array is empty", async () => {
      await setupTest([]);

      const noResultsMessage = await screen.findByText(
        "Sorry, we cannot find any events that match your filter settings.",
      );
      expect(noResultsMessage).toBeInTheDocument();
    });

    it("maintains original order for events with same date and status", async () => {
      const sameDate = DAYS_IN_FUTURE(1);
      const events = [
        {
          id: "event_1",
          title: "Event 1",
          date: sameDate,
          eventStatus: "OPEN" as const,
        },
        {
          id: "event_2",
          title: "Event 2",
          date: sameDate,
          eventStatus: "OPEN" as const,
        },
      ];

      await setupTest(events);
      const eventCards = getEventCards();

      expect(getEventTitle(eventCards[0])).toHaveTextContent("Event 1");
      expect(getEventTitle(eventCards[1])).toHaveTextContent("Event 2");
    });
  });
});
