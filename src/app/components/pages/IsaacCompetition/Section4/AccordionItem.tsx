import React from "react";
import { Accordion } from "react-bootstrap";

interface AccordionItemProps {
  eventKey: string;
  title: string;
  section: any;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const renderSectionContent = (section: string[]) => {
  return (
    <>
      {section[0]}
      <ul>
        {section.slice(1, -1).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {section[section.length - 1]}
    </>
  );
};

const AccordionItem = ({ eventKey, title, section, isCollapsed, setIsCollapsed }: AccordionItemProps) => (
  <Accordion.Item eventKey={eventKey}>
    <Accordion.Header
      className={`accordion-button p-3 m-0 ${eventKey === "0" ? "rounded-top" : ""} ${
        eventKey === "5" ? "rounded-bottom" : ""
      } ${isCollapsed ? "" : "border-bottom border-dark"}`}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {title}
    </Accordion.Header>
    <Accordion.Body
      className={`p-4 bg-white ${isCollapsed ? "border-bottom border-dark" : ""}`}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {renderSectionContent(section)}
    </Accordion.Body>
  </Accordion.Item>
);

export default AccordionItem;
