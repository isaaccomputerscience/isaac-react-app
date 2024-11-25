import React from "react";
import content from "../content";

const CompetitionTimeline = () => {
  const { title, content: timelineContent } = content.section3.timeline;

  return (
    <div className="competition-timeline">
      <h3 className="competition-timeline-title">{title}</h3>
      <p className="competition-timeline-content">{timelineContent}</p>
    </div>
  );
};

export default CompetitionTimeline;
