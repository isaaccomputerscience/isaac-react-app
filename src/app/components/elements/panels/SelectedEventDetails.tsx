import React, { useEffect } from "react";
import { Badge, Card, CardBody, CardTitle, ListGroup, ListGroupItem, UncontrolledTooltip } from "reactstrap";
import { AppState, getEvent, selectors, useAppDispatch, useAppSelector } from "../../../state";
import { Link } from "react-router-dom";
import { DateString } from "../DateString";
import { NOT_FOUND, formatAddress, asPercentage, zeroOrLess } from "../../../services";
import { EventBookingDTO, Location } from "../../../../IsaacApiTypes";

export const countStudentsAndTeachers = (eventBookings: EventBookingDTO[]) => {
  let studentCount = 0;
  let teacherCount = 0;

  eventBookings.forEach((booking) => {
    const role = booking.userBooked?.role;
    const bookingStatus = booking.bookingStatus;

    if (role && bookingStatus) {
      const validStatus = ["CONFIRMED", "ATTENDED", "ABSENT"].includes(bookingStatus);

      if (role === "STUDENT" && validStatus) {
        studentCount++;
      } else if (role === "TEACHER" && validStatus) {
        teacherCount++;
      }
    }
  });
  return {
    studentCount,
    teacherCount,
  };
};

export const countGenders = (eventBookings: EventBookingDTO[]) => {
  const genders = {
    male: 0,
    female: 0,
    other: 0,
    preferNotToSay: 0,
    unknown: 0,
  };

  eventBookings.forEach((booking) => {
    const gender = booking.userBooked?.gender;
    const bookingStatus = booking.bookingStatus;

    if (gender && bookingStatus) {
      const validStatus = ["CONFIRMED", "ATTENDED"].includes(bookingStatus);

      if (gender === "MALE" && validStatus) genders.male++;
      else if (gender === "FEMALE" && validStatus) genders.female++;
      else if (gender === "OTHER" && validStatus) genders.other++;
      else if (gender === "PREFER_NOT_TO_SAY" && validStatus) genders.preferNotToSay++;
      else if (gender === "UNKNOWN" && validStatus) genders.unknown++;
    }
  });
  return genders;
};

export const LocationDetails = ({ isVirtual, location }: { isVirtual?: boolean; location?: Location }) => {
  return (
    <>
      <strong>Location: </strong>
      {isVirtual ? "Online" : formatAddress(location)}
      <br />
    </>
  );
};

export const SelectedEventDetails = ({ eventId }: { eventId: string }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getEvent(eventId));
  }, [dispatch, eventId]);

  const selectedEvent = useAppSelector((state: AppState) => {
    return state && state.currentEvent;
  });
  const eventBookings = useAppSelector(selectors.events.eventBookings);
  const { studentCount, teacherCount } = countStudentsAndTeachers(eventBookings);
  const { male, female, other, preferNotToSay, unknown } = countGenders(eventBookings);
  const numberOfConfirmedOrAttendedBookings = eventBookings.filter((eventBooking) => {
    return eventBooking.bookingStatus === "CONFIRMED" || eventBooking.bookingStatus === "ATTENDED";
  }).length;

  return (
    <Card>
      <CardBody>
        <CardTitle tag="h3">Selected event details</CardTitle>
        {selectedEvent && selectedEvent !== NOT_FOUND && (
          <div className="m-0" data-testid="event-details">
            <strong>Event: </strong>
            <Link to={`/events/${selectedEvent.id}`} target="_blank">
              {selectedEvent.title} - {selectedEvent.subtitle}
            </Link>
            {selectedEvent.isPrivateEvent && (
              <Badge className="ml-2" color="primary">
                Private Event
              </Badge>
            )}
            <br />
            <LocationDetails isVirtual={selectedEvent.isVirtual} location={selectedEvent.location} />
            <strong>Event status: </strong>
            <span className={selectedEvent.isCancelled ? "text-danger font-weight-bold" : ""}>
              {selectedEvent.eventStatus}
            </span>
            <br />
            <strong>Event Date & Time: </strong>
            <DateString>{selectedEvent.date}</DateString> - <DateString>{selectedEvent.endDate}</DateString>
            <br />
            {selectedEvent.bookingDeadline && (
              <>
                <strong>Booking deadline: </strong>
                <DateString>{selectedEvent.bookingDeadline}</DateString>
                <br />
              </>
            )}
            {selectedEvent.prepWorkDeadline && (
              <>
                <strong>Prepwork deadline: </strong>
                <DateString>{selectedEvent.prepWorkDeadline}</DateString>
                <br />
              </>
            )}
            {/* Group token is currently JSON Ignored by the API */}
            {/*<strong>Group Auth Code:</strong>*/}
            {/*{selectedEvent.isaacGroupToken}*/}
            {/*<br />*/}
            <span className={zeroOrLess(selectedEvent.placesAvailable) ? "text-danger" : ""}>
              <strong>Number of places available: </strong>
              {selectedEvent.placesAvailable} / {selectedEvent.numberOfPlaces}
            </span>
            <br />
            <strong>Number of students: </strong>
            {studentCount} / {selectedEvent.numberOfPlaces}
            <br />
            <strong>Number of teachers: </strong>
            {teacherCount} / {selectedEvent.numberOfPlaces}
            <br />
            <strong>Gender:</strong>
            <span id={`gender-stats-tooltip`} className="icon-help ml-1" />
            <UncontrolledTooltip className="text-nowrap" target={`gender-stats-tooltip`} placement="right">
              User gender of CONFIRMED or ATTENDED bookings
            </UncontrolledTooltip>
            <br />
            <ListGroup>
              <ListGroupItem className="py-0">{`Male: ${male} (${asPercentage(
                male,
                numberOfConfirmedOrAttendedBookings,
              )}%)`}</ListGroupItem>
              <ListGroupItem className="py-0">{`Female: ${female} (${asPercentage(
                female,
                numberOfConfirmedOrAttendedBookings,
              )}%)`}</ListGroupItem>
              <ListGroupItem className="py-0">{`Other: ${other} (${asPercentage(
                other,
                numberOfConfirmedOrAttendedBookings,
              )}%)`}</ListGroupItem>
              <ListGroupItem className="py-0">{`Prefer not to say: ${preferNotToSay} (${asPercentage(
                preferNotToSay,
                numberOfConfirmedOrAttendedBookings,
              )}%)`}</ListGroupItem>
              <ListGroupItem className="py-0">{`Unknown: ${unknown} (${asPercentage(
                unknown,
                numberOfConfirmedOrAttendedBookings,
              )}%)`}</ListGroupItem>
            </ListGroup>
          </div>
        )}
        {selectedEvent && selectedEvent === NOT_FOUND && (
          <p className="m-0" data-testid="event-details-not-found">
            Event details not found.
          </p>
        )}
      </CardBody>
    </Card>
  );
};
