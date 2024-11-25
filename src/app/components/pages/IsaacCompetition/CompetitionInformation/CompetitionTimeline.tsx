import React from "react";
import { Card, CardBody, CardText, CardTitle } from "reactstrap";

interface TimelineCardProps {
  title: string;
  description?: string;
  content: string[];
  className?: string;
}

const CompetitionTimeline = ({ title, description, content, className = "" }: TimelineCardProps) => {
  return (
    <Card className={`h-100 ${className} competition-information-no-border`}>
      <CardTitle tag="h3" className="competition-timeline-header pt-4 px-4">
        {title}
      </CardTitle>
      <CardBody>
        {description && <CardText className="competition-timeline-text mb-3">{description}</CardText>}
        {content.map((text, index) => (
          <CardText key={index} className="competition-timeline-text">
            {text}
          </CardText>
        ))}
      </CardBody>
    </Card>
  );
};

export default CompetitionTimeline;
