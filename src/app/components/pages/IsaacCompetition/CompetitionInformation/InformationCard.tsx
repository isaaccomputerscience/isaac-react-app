import React from "react";
import { Card, CardTitle, CardBody, CardText } from "reactstrap";

interface InformationCardProps {
  title: string;
  description?: string;
  content: (string | any)[];
  isList?: boolean;
  className?: string;
}

const InformationCard = ({ title, description, content, isList = false, className = "" }: InformationCardProps) => {
  const renderStepWithLinks = (step: any, index: number) => (
    <CardText key={index} className="competition-information-text">
      {step.text}
      {step.link1 && <a href={step.link1.href}>{step.link1.text}</a>}
      {step.text2}
      {step.link2 && (
        <a href={step.link2.href} style={{ color: "#1D70B8" }}>
          {step.link2.text}
        </a>
      )}
      {step.text3}
      {step.link3 && <a href={step.link3.href}>{step.link3.text}</a>}
      {step.text4}
      {step.text5}
      {step.link5 && <a href={step.link5.href}>{step.link5.text}</a>}
      {step.text6}
    </CardText>
  );

  return (
    <Card className={`h-100 ${className} competition-information-no-border`}>
      <CardTitle tag="h3" className="competition-information-title pt-4 px-4">
        {title}
      </CardTitle>
      <CardBody>
        {description && <CardText className="competition-information-text mb-3">{description}</CardText>}
        {isList ? (
          <ul>
            {content.map((item, index) => (
              <li key={index} className="competition-information-text">
                {typeof item === "string" ? item : renderStepWithLinks(item, index)}
              </li>
            ))}
          </ul>
        ) : (
          content.map((item, index) =>
            typeof item === "string" ? (
              <CardText key={index} className="competition-information-text">
                {item}
              </CardText>
            ) : (
              renderStepWithLinks(item, index)
            ),
          )
        )}
      </CardBody>
    </Card>
  );
};

export default InformationCard;
