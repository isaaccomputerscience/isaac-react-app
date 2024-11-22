import React from "react";
import { Card, CardTitle, CardBody, CardText } from "reactstrap";

interface InformationCardProps {
  title: string;
  description?: string;
  content: string[];
  isList?: boolean;
}

const InformationCard = ({ title, description, content, isList = false }: InformationCardProps) => (
  <Card className="h-100">
    <CardTitle tag="h3" className="competition-information-title pt-4 px-4">
      {title}
    </CardTitle>
    <CardBody>
      {description && <CardText className="competition-information-text mb-3">{description}</CardText>}
      {isList ? (
        <ul>
          {content.map((text, index) => (
            <li key={index} className="competition-information-text">
              {text}
            </li>
          ))}
        </ul>
      ) : (
        content.map((text, index) => (
          <CardText key={index} className="competition-information-text">
            {text}
          </CardText>
        ))
      )}
    </CardBody>
  </Card>
);

export default InformationCard;
