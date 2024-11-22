import React from "react";
import { Card, CardTitle, CardBody, CardText } from "reactstrap";

interface InformationCardProps {
  title: string;
  content: string[];
  isList?: boolean;
}

const InformationCard = ({ title, content, isList = false }: InformationCardProps) => (
  <Card className="h-100">
    <CardTitle tag="h3" className="competition-information-title pt-4 px-4">
      {title}
    </CardTitle>
    <CardBody>
      {isList ? (
        <ul>
          {content.map((text, index) => (
            <CardText key={index} tag="li" className="competition-information-text">
              {text}
            </CardText>
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
