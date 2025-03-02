import { apiHelper, atLeastOne, isTeacherOrAbove, STAGE, STAGES_CS, zeroOrLess } from "./";
import { IsaacEventPageDTO, Location } from "../../IsaacApiTypes";
import { AugmentedEvent, PotentialUser } from "../../IsaacAppTypes";
import { DateString, FRIENDLY_DATE, TIME_ONLY } from "../components/elements/DateString";
import React from "react";
import { Link } from "react-router-dom";
import { Immutable } from "immer";
import dayjs from "dayjs";

export const studentOnlyEventMessage = (eventId?: string) => (
  <React.Fragment>
    {"This event is aimed at students. If you are not a student but still wish to attend, please "}
    <Link to={`/contact?subject=${encodeURI("Non-student attendance at " + eventId)}`}>contact us</Link>.
  </React.Fragment>
);

export const augmentEvent = (event: IsaacEventPageDTO): AugmentedEvent => {
  const augmentedEvent: AugmentedEvent = Object.assign({}, event);
  if (event.date != null) {
    const startDate = new Date(event.date);
    const now = Date.now();
    if (event.endDate != null) {
      // Non-breaking change; if endDate not specified, behaviour as before
      const endDate = new Date(event.endDate);
      augmentedEvent.isMultiDay = startDate.toDateString() != endDate.toDateString();
      augmentedEvent.hasExpired = now > endDate.getTime();
      augmentedEvent.isInProgress = startDate.getTime() <= now && now <= endDate.getTime();
    } else {
      augmentedEvent.hasExpired = now > startDate.getTime();
      augmentedEvent.isInProgress = false;
      augmentedEvent.isMultiDay = false;
    }
    augmentedEvent.isWithinBookingDeadline =
      !augmentedEvent.hasExpired && (event.bookingDeadline ? now <= new Date(event.bookingDeadline).getTime() : true);
  }

  if (event.tags) {
    augmentedEvent.isATeacherEvent = event.tags.includes("teacher");
    augmentedEvent.isAStudentEvent = event.tags.includes("student");
    augmentedEvent.isVirtual = event.tags.includes("virtual");
    augmentedEvent.isRecurring = event.tags.includes("recurring");
    augmentedEvent.isStudentOnly = event.tags.includes("student_only");
  }

  augmentedEvent.isNotClosed = !["CLOSED", "CANCELLED"].includes(event.eventStatus as string);
  augmentedEvent.isCancelled = event.eventStatus === "CANCELLED";
  augmentedEvent.isWaitingListOnly = event.eventStatus === "WAITING_LIST_ONLY";

  // we have to fix the event image url.
  if (augmentedEvent.eventThumbnail?.src) {
    augmentedEvent.eventThumbnail.src = apiHelper.determineImageUrl(augmentedEvent.eventThumbnail.src);
  } else {
    if (augmentedEvent.eventThumbnail == null) {
      augmentedEvent.eventThumbnail = {};
    }
    augmentedEvent.eventThumbnail.src = "http://placehold.it/500x276";
  }

  if (event.privateEvent) {
    augmentedEvent.isPrivateEvent = true;
  }

  return augmentedEvent;
};

export const formatEventDetailsDate = (event: AugmentedEvent) => {
  if (event.isRecurring) {
    return (
      <span>
        Series starts <DateString>{event.date}</DateString>
      </span>
    );
  } else if (event.isMultiDay) {
    return (
      <>
        <DateString>{event.date}</DateString>
        {" — "}
        <DateString>{event.endDate}</DateString>
      </>
    );
  } else {
    return (
      <>
        <DateString>{event.date}</DateString>
        {" — "}
        <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
      </>
    );
  }
};

export const formatEventCardDate = (event: AugmentedEvent, podView?: boolean) => {
  if (event.isRecurring) {
    return (
      <span>
        Series starts <DateString formatter={FRIENDLY_DATE}>{event.date}</DateString>
        <DateString formatter={TIME_ONLY}>{event.date}</DateString> —{" "}
        <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
      </span>
    );
  } else if (event.isMultiDay) {
    return (
      <>
        From <DateString>{event.date}</DateString>
        <br />
        to <DateString>{event.endDate}</DateString>
      </>
    );
  } else {
    return (
      <>
        <DateString formatter={FRIENDLY_DATE}>{event.endDate}</DateString> {podView}
        <DateString formatter={TIME_ONLY}>{event.date}</DateString> —{" "}
        <DateString formatter={TIME_ONLY}>{event.endDate}</DateString>
      </>
    );
  }
};

export const formatAvailabilityMessage = (event: AugmentedEvent) => {
  if (event.isWaitingListOnly) {
    //  in this case, the waiting list is for booking requests that must be approved
    return "Bookings available by request!";
  }
  // this is an event which can be freely joined, however it happens to be full
  return "Waiting list booking is available!";
};

export const formatWaitingListBookingStatusMessage = (event: AugmentedEvent) => {
  if (event.isWaitingListOnly) {
    return "You have requested a place on this event.";
  }
  return "You are on the waiting list for this event.";
};

export const formatMakeBookingButtonMessage = (event: AugmentedEvent) => {
  if (event.userBookingStatus === "RESERVED") {
    return "Confirm your reservation";
  }
  if (event.isWaitingListOnly) {
    return "Request a place";
  }
  if (zeroOrLess(event.placesAvailable)) {
    return "Join waiting list";
  }
  return "Book a place";
};

export const formatCancelBookingButtonMessage = (event: AugmentedEvent) => {
  if (event.userBookingStatus == "CONFIRMED") {
    return "Cancel your booking";
  } else if (event.userBookingStatus == "RESERVED") {
    return "Cancel your reservation";
  } else if (event.userBookingStatus == "WAITING_LIST") {
    return event.isWaitingListOnly ? "Cancel booking request" : "Leave waiting list";
  }
};

export const formatManageBookingActionButtonMessage = (event: AugmentedEvent) => {
  if (event.userBookingStatus === "RESERVED") {
    return "Confirm reservation";
  }
  if (event.isWaitingListOnly) {
    return "Make booking request";
  }
  if (zeroOrLess(event.placesAvailable)) {
    return "Add to waiting list";
  }
  return "Book a place";
};

export const formatBookingModalConfirmMessage = (event: AugmentedEvent, userCanMakeEventBooking?: boolean) => {
  if (userCanMakeEventBooking) {
    return "Book now";
  } else {
    return event.isWithinBookingDeadline ? "Apply" : "Apply - deadline past";
  }
};

export const stageExistsForSite = (stage: string) => {
  return STAGES_CS.has(stage as STAGE);
};

export const userSatisfiesStudentOnlyRestrictionForEvent = (
  user: Immutable<PotentialUser> | null,
  event: AugmentedEvent,
) => {
  return event.isStudentOnly ? !isTeacherOrAbove(user) : true;
};

export const userIsTeacherAtAStudentEvent = (user: Immutable<PotentialUser> | null, event: AugmentedEvent) => {
  return event.isAStudentEvent && isTeacherOrAbove(user);
};

export const userCanMakeEventBooking = (user: Immutable<PotentialUser> | null, event: AugmentedEvent) => {
  return (
    event.isNotClosed &&
    event.isWithinBookingDeadline &&
    !event.isWaitingListOnly &&
    event.userBookingStatus !== "CONFIRMED" &&
    userSatisfiesStudentOnlyRestrictionForEvent(user, event) &&
    (atLeastOne(event.placesAvailable) ||
      userIsTeacherAtAStudentEvent(user, event) ||
      event.userBookingStatus === "RESERVED")
  );
};

export const userCanBeAddedToEventWaitingList = (user: Immutable<PotentialUser> | null, event: AugmentedEvent) => {
  return (
    !userCanMakeEventBooking(user, event) &&
    event.isNotClosed &&
    !event.hasExpired &&
    (event.userBookingStatus === undefined ||
      !["WAITING_LIST", "CONFIRMED", "RESERVED"].includes(event.userBookingStatus)) &&
    userSatisfiesStudentOnlyRestrictionForEvent(user, event)
  );
};

// Tutors cannot reserve event spaces for members of their groups
export const userCanReserveEventSpaces = (user: Immutable<PotentialUser> | null, event: AugmentedEvent) => {
  return (
    event.allowGroupReservations &&
    event.isNotClosed &&
    event.isWithinBookingDeadline &&
    !event.isWaitingListOnly &&
    isTeacherOrAbove(user)
  );
};

export function createCalendarFile(event: AugmentedEvent) {
  const formatDate = (date: EpochTimeStamp) => {
    return dayjs(date).format("YYYYMMDD[T]HHmmss");
  };

  if (event.date && event.endDate && event.title) {
    const address = event.location?.address
      ? [
          event.location.address.addressLine1,
          event.location.address.addressLine2,
          event.location.address.town,
          event.location.address.county,
          event.location.address.postalCode,
          event.location.address.country,
        ]
      : [];

    const eventDetails = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:stem-learning/isaac-cs
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${event.title} ${event.subtitle ? `- ${event.subtitle}` : ""}
DESCRIPTION:Isaac Computer Science Event - www.isaaccomputerscience.org/events/${event.id}
URL:${event.isVirtual && event.meetingUrl ? event.meetingUrl : ""}
DTSTAMP:${formatDate(Date.now())}Z
DTSTART;TZID=Europe/London:${formatDate(event.date)}
DTEND;TZID=Europe/London:${formatDate(event.endDate)}
LOCATION:${address.filter((s) => !!s).join(", ")}
UID:${formatDate(event.date)}-${event.title.replace(/\s+/g, "_")}
END:VEVENT
END:VCALENDAR`;

    const filename = `${event.title.replace(/\s+/g, "_")}.ics`;
    const file: Blob = new File([eventDetails], filename, { type: "text/calendar" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const formatAddress = (location: Location | undefined) => {
  if (!location?.address) return "Unknown Location";
  const addressLine1 = location.address.addressLine1 ?? "";
  const addressLine2 = location.address.addressLine2 ?? "";
  const town = location.address.town ?? "";
  const postalCode = location.address.postalCode ?? "";
  const addressComponents = [addressLine1, addressLine2, town, postalCode].filter(Boolean);
  return addressComponents.join(", ");
};

export function asPercentage(value: number | undefined, total: number) {
  const result = value !== undefined ? Math.round((100 * value) / total) : 0;
  return isNaN(result) ? 0 : result;
}
