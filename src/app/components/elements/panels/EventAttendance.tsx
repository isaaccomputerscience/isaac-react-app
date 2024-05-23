import React, { PropsWithChildren, useState } from "react";
import { Accordion } from "../Accordion";
import { AppState, recordEventAttendance, selectors, useAppDispatch, useAppSelector } from "../../../state";
import { atLeastOne, isEventLeader, NOT_FOUND, sortOnPredicateAndReverse } from "../../../services";
import { DetailedEventBookingDTO, UserSummaryWithEmailAddressAndGenderDTO } from "../../../../IsaacApiTypes";
import { DateString } from "../DateString";
import { ATTENDANCE, PotentialUser } from "../../../../IsaacAppTypes";
import { Button, Input, Table } from "reactstrap";

function displayAttendanceAsSymbol(status?: string) {
  switch (status) {
    case "ATTENDED":
      return "✔️";
    case "ABSENT":
      return "❌";
    default:
      return "";
  }
}

const AttendanceHeaderButton = ({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) => (
  <th className="align-middle">
    <Button color="link" onClick={onClick}>
      {children}
    </Button>
  </th>
);

export const EventAttendance = ({ user, eventId }: { user: PotentialUser; eventId: string }) => {
  const dispatch = useAppDispatch();
  const selectedEvent = useAppSelector(
    (state: AppState) => (state && state.currentEvent !== NOT_FOUND && state.currentEvent) || null,
  );
  const bookings = useAppSelector((state: AppState) => (state && state.eventBookings) || []);
  const userIdToSchoolMapping = useAppSelector(selectors.admin.userSchoolLookup) || {};

  const [sortPredicate, setSortPredicate] = useState("bookingDate");
  const [reverse, setReverse] = useState(true);
  const [familyNameFilter, setFamilyNameFilter] = useState("");

  function filterOnSurname(booking: DetailedEventBookingDTO) {
    return (
      // If the family name is undefined (which can happen with Google accounts),
      // we should show it if the filter is empty, otherwise attendance can't be marked
      (booking.userBooked?.familyName === undefined && familyNameFilter === "") ||
      booking.userBooked?.familyName?.toLocaleLowerCase().includes(familyNameFilter.toLocaleLowerCase())
    );
  }

  let canRecordAttendance = false;
  if (selectedEvent?.date) {
    const morningOfEvent = new Date(selectedEvent.date);
    morningOfEvent.setUTCHours(0, 0);
    canRecordAttendance = morningOfEvent <= new Date();
  }

  const sortBooking = (predicate: string) => {
    setSortPredicate(predicate);
    setReverse(!reverse);
  };

  return (
    <React.Fragment>
      {canRecordAttendance && atLeastOne(bookings.length) && (
        <Accordion
          trustedTitle="Record event attendance"
          disabled={selectedEvent?.isCancelled && "You cannot record attendance for a cancelled event"}
        >
          {isEventLeader(user) && (
            <div className="bg-grey p-2 mb-3 text-center">
              As an event leader, you are only able to see the bookings of users who have granted you access to their
              data.
            </div>
          )}
          <div className="overflow-auto">
            <Table bordered className="mb-0 bg-white table-sm table-hover">
              <thead>
                <tr>
                  <th className="align-middle">Actions</th>
                  <AttendanceHeaderButton onClick={() => sortBooking("bookingStatus")}>
                    Attendance
                  </AttendanceHeaderButton>
                  <th className="align-middle" style={{ minWidth: "140px" }}>
                    <Button color="link" onClick={() => sortBooking("userBooked.familyName")}>
                      Name
                    </Button>
                    <Input
                      type="text"
                      className="py-2"
                      value={familyNameFilter}
                      onChange={(e) => setFamilyNameFilter(e.target.value)}
                      placeholder="Surname filter"
                    />
                  </th>
                  <th className="align-middle">Job / year group</th>
                  <th className="align-middle">School</th>
                  <th className="align-middle">Account type</th>
                  <AttendanceHeaderButton onClick={() => sortBooking("userBooked.email")}>Email</AttendanceHeaderButton>
                  <AttendanceHeaderButton onClick={() => sortBooking("bookingDate")}>
                    Booking created
                  </AttendanceHeaderButton>
                  <AttendanceHeaderButton onClick={() => sortBooking("updated")}>
                    Booking updated
                  </AttendanceHeaderButton>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .sort(sortOnPredicateAndReverse(sortPredicate, reverse))
                  .filter(filterOnSurname)
                  .map((booking) => {
                    const userBooked = booking.userBooked as UserSummaryWithEmailAddressAndGenderDTO;
                    const additionalInformation = booking.additionalInformation;
                    const userSchool = booking.userBooked && userIdToSchoolMapping[booking.userBooked.id as number];

                    return (
                      <tr key={booking.bookingId}>
                        <td className="align-middle">
                          {booking.bookingStatus != "ATTENDED" && (
                            <Button
                              color="primary"
                              outline
                              className="btn-sm mb-2"
                              onClick={() =>
                                dispatch(recordEventAttendance(eventId, userBooked.id as number, ATTENDANCE.ATTENDED))
                              }
                            >
                              Mark&nbsp;as Attended
                            </Button>
                          )}
                          {booking.bookingStatus != "ABSENT" && (
                            <Button
                              color="primary"
                              outline
                              className="btn-sm mb-2"
                              onClick={() =>
                                dispatch(recordEventAttendance(eventId, userBooked.id as number, ATTENDANCE.ABSENT))
                              }
                            >
                              Mark&nbsp;as Absent
                            </Button>
                          )}
                        </td>
                        <td className="align-middle text-center">{displayAttendanceAsSymbol(booking.bookingStatus)}</td>
                        <td className="align-middle">
                          {userBooked.familyName}, {userBooked.givenName}
                        </td>
                        <td className="align-middle">
                          {additionalInformation?.jobTitle ?? additionalInformation?.yearGroup ?? ""}
                        </td>
                        {!userSchool?.urn && <td className="align-middle">{userSchool?.name ?? ""}</td>}
                        {userSchool?.urn && <td className="align-middle">{userSchool.name}</td>}{" "}
                        <td className="align-middle">{userBooked.role}</td>
                        <td className="align-middle">{userBooked.email}</td>
                        <td className="align-middle">
                          <DateString>{booking.bookingDate}</DateString>
                        </td>
                        <td className="align-middle">
                          <DateString>{booking.updated}</DateString>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          </div>
        </Accordion>
      )}
    </React.Fragment>
  );
};
