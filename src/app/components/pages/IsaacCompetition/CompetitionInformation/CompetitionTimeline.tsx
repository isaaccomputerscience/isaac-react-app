import React from "react";
import { Card, CardBody, CardText, CardTitle } from "reactstrap";

interface TimelineCardProps {
  title: string;
  content: string[];
  className?: string;
}

const CompetitionTimeline = ({ title, content, className = "" }: TimelineCardProps) => {
  return (
    <Card className={`h-100 ${className} competition-information-no-border`}>
      <CardTitle tag="h3" className="competition-timeline-header pt-4 px-4">
        {title}
      </CardTitle>
      <CardBody>
        {content.map((text, index) => (
          <CardText key={index} tag="h3" className="competition-timeline-date">
            {text}
          </CardText>
        ))}
      </CardBody>
    </Card>
  );
};

export default CompetitionTimeline;
