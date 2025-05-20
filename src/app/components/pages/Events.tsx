import React, { useEffect } from "react";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import {
  AppState,
  clearEventsList,
  getEventMapData,
  getEventsList,
  selectors,
  useAppDispatch,
  useAppSelector,
} from "../../state";
import { ShowLoading } from "../handlers/ShowLoading";
import queryString from "query-string";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { EventCard } from "../elements/cards/EventCard";
import { PageFragment } from "../elements/PageFragment";
import {
  EventStageFilter,
  EventStatusFilter,
  EventTypeFilter,
  isTeacherOrAbove,
  stageExistsForSite,
} from "../../services";
import { RenderNothing } from "../elements/RenderNothing";
import { MetaDescription } from "../elements/MetaDescription";
import { Banner } from "../elements/panels/Banner";
import { Button, Container, Form, Input, Label, Row } from "reactstrap";

interface EventsPageQueryParams {
  show_booked_only?: boolean;
  show_reservations_only?: boolean;
  event_status?: "all";
  show_stage_only?: EventStageFilter;
  types?: EventTypeFilter;
}

const EVENTS_PER_PAGE = 6;

const TeacherEventsDescription = () => (
  <div className="text-left">
    The National Centre for Computing Education offers professional development courses to help you teacher computer
    science at GCSE and A Level, free to teachers in state-funded education. Discover the full list on the{" "}
    <a href="https://teachcomputing.org/courses" target="_blank" rel="noopener noreferrer">
      Teach Computing website.
    </a>
  </div>
);

export const Events = withRouter(({ history, location }: RouteComponentProps) => {
  const query: EventsPageQueryParams = queryString.parse(location.search);

  const dispatch = useAppDispatch();
  const eventsState = useAppSelector((state: AppState) => state?.events);
  // const eventMapData = useAppSelector((state: AppState) => state?.eventMapData);
  const user = useAppSelector(selectors.user.orNull);
  const numberOfLoadedEvents = eventsState ? eventsState.events.length : 0;

  const statusFilter =
    (user?.loggedIn && query.show_booked_only && EventStatusFilter["My booked events"]) ||
    (user?.loggedIn && query.show_reservations_only && EventStatusFilter["My event reservations"]) ||
    (query.event_status === "all" && EventStatusFilter["All events"]) ||
    EventStatusFilter["Upcoming events"];
  const typeFilter = query.types ?? EventTypeFilter["All events"];
  const stageFilter = query.show_stage_only ?? EventStageFilter["All stages"];

  useEffect(() => {
    const startIndex = 0;
    dispatch(clearEventsList);
    dispatch(getEventsList(startIndex, EVENTS_PER_PAGE, typeFilter, statusFilter, stageFilter));
    dispatch(getEventMapData(startIndex, -1, typeFilter, statusFilter, stageFilter));
  }, [dispatch, typeFilter, statusFilter, stageFilter]);

  const pageHelp = <span>Follow the links below to find out more about our FREE events.</span>;

  const metaDescriptionCS =
    "A level and GCSE Computer Science live online training. Revision and extension workshops for students.";

  return (
    <>
      <div>
        <Container>
          <TitleAndBreadcrumb currentPageTitle={"Events"} subTitle="Student Events" help={pageHelp} />
          <MetaDescription description={metaDescriptionCS} />
          <div className="my-4">
            {/* Filters */}
            <Form inline className="d-flex justify-content-end">
              <Label>
                Filter by
                <Input
                  id="event-status-filter"
                  className="ml-2 mr-3"
                  type="select"
                  value={statusFilter}
                  onChange={(e) => {
                    const selectedFilter = e.target.value as EventStatusFilter;
                    query.show_booked_only =
                      selectedFilter === EventStatusFilter["My booked events"] ? true : undefined;
                    query.show_reservations_only =
                      selectedFilter === EventStatusFilter["My event reservations"] ? true : undefined;
                    query.event_status = selectedFilter == EventStatusFilter["All events"] ? "all" : undefined;
                    history.push({ pathname: location.pathname, search: queryString.stringify(query as any) });
                  }}
                >
                  {/* Tutors are considered students w.r.t. events currently, so cannot see teacher-only events */}
                  {Object.entries(EventStatusFilter)
                    .filter(
                      ([_, statusValue]) => user?.loggedIn || statusValue !== EventStatusFilter["My booked events"],
                    )
                    .filter(
                      ([_, statusValue]) =>
                        (user && user.loggedIn && isTeacherOrAbove(user)) ||
                        statusValue !== EventStatusFilter["My event reservations"],
                    )
                    .map(([statusLabel, statusValue]) => (
                      <option key={statusValue} value={statusValue}>
                        {statusLabel}
                      </option>
                    ))}
                </Input>
                <Input
                  id="event-type-filter"
                  className="ml-2"
                  type="select"
                  value={typeFilter}
                  onChange={(e) => {
                    const selectedType = e.target.value as EventTypeFilter;
                    query.types = selectedType !== EventTypeFilter["All events"] ? selectedType : undefined;
                    history.push({ pathname: location.pathname, search: queryString.stringify(query as any) });
                  }}
                >
                  {Object.entries(EventTypeFilter).map(([typeLabel, typeValue]) => (
                    <option key={typeValue} value={typeValue}>
                      {typeLabel}
                    </option>
                  ))}
                </Input>
                <Input
                  id="event-stage-filter"
                  className="ml-2"
                  type="select"
                  value={stageFilter}
                  onChange={(e) => {
                    const selectedStage = e.target.value as EventStageFilter;
                    query.show_stage_only =
                      selectedStage !== EventStageFilter["All stages"] ? selectedStage : undefined;
                    history.push({ pathname: location.pathname, search: queryString.stringify(query as any) });
                  }}
                >
                  {Object.entries(EventStageFilter)
                    .filter(([_, stageValue]) => stageExistsForSite(stageValue))
                    .map(([stageLabel, stageValue]) => (
                      <option key={stageValue} value={stageValue}>
                        {stageLabel}
                      </option>
                    ))}
                </Input>
              </Label>
            </Form>

            {/* Results */}
            <ShowLoading
              until={eventsState}
              thenRender={({ events, total }) => (
                <div className="my-4">
                  {/* <Row>
                    {(statusFilter === EventStatusFilter["My booked events"]
                      ? events.sort((bookedEvent1, bookedEvent2) => {
                          const oldEventDate = bookedEvent1.date ? new Date(bookedEvent1.date).getTime() : 0;
                          const newEventDate = bookedEvent2.date ? new Date(bookedEvent2.date).getTime() : 0;
                          // The return value of the subtraction below will always be positive as the timestamp for bookedEvent2 will be bigger than of bookedEvent1. This will sort the events in descending order i.e newest first
                          return newEventDate - oldEventDate;
                        })
                      : events
                    ).map((event) => (
                      <div key={event.id} className="col-xs-12 col-sm-6 col-md-4 d-flex">
                        <EventCard event={event} />
                      </div>
                    ))}
                  </Row> */}

                  <Row>
                    {(statusFilter === EventStatusFilter["My booked events"]
                      ? events.sort((a, b): number => {
                          const currentDate = new Date().getTime();
                          const eventADate = a.date ? new Date(a.date).getTime() : 0;
                          const eventBDate = b.date ? new Date(b.date).getTime() : 0;

                          const eventAPastOrCancelled = a.isCancelled || eventADate < currentDate;
                          const eventBPastOrCancelled = b.isCancelled || eventBDate < currentDate;

                          // If both events are cancelled or past
                          if (eventAPastOrCancelled && eventBPastOrCancelled) {
                            return eventBDate - eventADate;
                          }
                          return eventADate - eventBDate;
                        })
                      : events
                    ).map((event) => (
                      <div key={event.id} className="col-xs-12 col-sm-6 col-md-4 d-flex">
                        <EventCard event={event} />
                      </div>
                    ))}
                  </Row>

                  {/* Load More Button */}
                  {numberOfLoadedEvents < total && (
                    <div className="text-center mb-5">
                      <Button
                        onClick={() => {
                          dispatch(
                            getEventsList(numberOfLoadedEvents, EVENTS_PER_PAGE, typeFilter, statusFilter, stageFilter),
                          );
                        }}
                      >
                        Load more events
                      </Button>
                    </div>
                  )}

                  {/* No Results */}
                  {total === 0 && (
                    <div className="text-center">
                      <p>Sorry, we cannot find any events that match your filter settings.</p>
                      {statusFilter === EventStatusFilter["My booked events"] && (
                        <p>
                          N.B. Events booked via Eventbrite may not appear here; for these if you have received email
                          confirmation you are booked.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            />
            <div className="mb-5">
              <PageFragment fragmentId="event_type_descriptions" ifNotFound={RenderNothing} />
            </div>
          </div>
        </Container>
      </div>
      {isTeacherOrAbove(user) && (
        <Banner
          id="teacher-courses"
          title="Computing events for teachers"
          subtitle="Looking for teacher events?"
          link="https://teachcomputing.org/courses"
          imageSource="/assets/ncce-teachers.png"
          imageDescription="teachers on a course"
          color="secondary"
        >
          <TeacherEventsDescription />
        </Banner>
      )}
    </>
  );
});
