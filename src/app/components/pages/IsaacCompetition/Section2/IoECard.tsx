import React from "react";
import { Card, CardTitle, CardBody, CardText } from "reactstrap";

interface IoECardProps {
  title: string;
  content: string[];
  isList?: boolean;
}

const IoECard = ({ title, content, isList = false }: IoECardProps) => (
  <Card className="p-4 h-100">
    <CardTitle tag="h3" className="ioe-title">
      {title}
    </CardTitle>
    <CardBody>
      {isList ? (
        <ul>
          {content.map((text, index) => (
            <li key={index} className="ioe-text">
              {text}
            </li>
          ))}
        </ul>
      ) : (
        content.map((text, index) => (
          <CardText key={index} className="ioe-text">
            {text}
          </CardText>
        ))
      )}
    </CardBody>
  </Card>
);

export default IoECard;
