import React, { useEffect, useState } from "react";
import * as RS from "reactstrap";
import {
  AppState,
  getEvent,
  useAppDispatch,
  useAppSelector,
} from "../../../state";
import { Link } from "react-router-dom";
import { DateString } from "../DateString";
import { NOT_FOUND, zeroOrLess } from "../../../services";

export const SelectedEventDetails = ({ eventId }: { eventId: string }) => {
  const dispatch = useAppDispatch();

  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);

  useEffect(() => {
    dispatch(getEvent(eventId));
  }, [dispatch, eventId]);

  const selectedEvent = useAppSelector((state: AppState) => {
    return state && state.currentEvent;
  });
  const eventBookings = useAppSelector(
    (state: AppState) => (state && state.eventBookings) || []
  );

  useEffect(() => {
    console.log("running rolesOfBookedUsers");
    let newStudentCount = 0;
    let newTeacherCount = 0;

    eventBookings.forEach((booking) => {
      const role = booking.userBooked?.role;
      if (role === "STUDENT") {
        newStudentCount++;
      } else if (role === "TEACHER") {
        newTeacherCount++;
      }
    });

    setStudentCount(newStudentCount);
    setTeacherCount(newTeacherCount);
  }, [eventBookings]);

  return (
    <RS.Card>
      <RS.CardBody>
        <h3 className="h-subtitle mb-1">Selected event details</h3>
        {selectedEvent && selectedEvent !== NOT_FOUND && (
          <p className="m-0">
            <strong>Event: </strong>
            <Link to={`/events/${selectedEvent.id}`} target="_blank">
              {selectedEvent.title} {selectedEvent.subtitle}
            </Link>
            <br />
            {selectedEvent.location &&
              selectedEvent.location.address &&
              selectedEvent.location.address.addressLine1 && (
                <React.Fragment>
                  <strong>Location: </strong>
                  {selectedEvent.isVirtual
                    ? "Online"
                    : `${selectedEvent.location.address.addressLine1}, ${selectedEvent.location.address.town}, ${selectedEvent.location.address.postalCode}`}
                  <br />
                </React.Fragment>
              )}
            <strong>Event status: </strong>
            <span
              className={
                selectedEvent.isCancelled ? "text-danger font-weight-bold" : ""
              }
            >
              {selectedEvent.eventStatus}
            </span>
            <br />
            <strong>Event start: </strong>
            <DateString>{selectedEvent.date}</DateString> -{" "}
            <DateString>{selectedEvent.endDate}</DateString>
            <br />
            <strong>Booking deadline: </strong>
            <DateString>{selectedEvent.bookingDeadline}</DateString>
            <br />
            <strong>Prepwork deadline: </strong>
            <DateString>{selectedEvent.prepWorkDeadline}</DateString>
            <br />
            {/* Group token is currently JSON Ignored by the API */}
            {/*<strong>Group Auth Code:</strong>*/}
            {/*{selectedEvent.isaacGroupToken}*/}
            {/*<br />*/}
            <span
              className={
                zeroOrLess(selectedEvent.placesAvailable) ? "text-danger" : ""
              }
            >
              <strong>Number of places available: </strong>
              {selectedEvent.placesAvailable} / {selectedEvent.numberOfPlaces}
            </span>
            <br />
            <strong>Number of students: </strong>
            {studentCount} / {selectedEvent.numberOfPlaces}
            <br />
            <strong>Number of teachers: </strong>
            {teacherCount} / {selectedEvent.numberOfPlaces}
          </p>
        )}
      </RS.CardBody>
    </RS.Card>
  );
};
