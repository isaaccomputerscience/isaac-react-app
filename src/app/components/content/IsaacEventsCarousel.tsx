import React from "react";
import { Link } from "react-router-dom";
import { EventsCarousel } from "../elements/EventsCarousel";

export const IsaacEventsCarousel = () => {
  return (
    <div className="isaac-events-carousel" data-testid="isaac-events-carousel">
      <EventsCarousel />
      <div className="center-container">
        <Link className="browse-events" to="/events">
          Browse all events
        </Link>
      </div>
    </div>
  );
};
