import React from "react";
import { Accordion } from "react-bootstrap";

interface AccordionItemProps {
  id: string;
  title: string;
  section: string[];
  open: string | null;
  setOpen: (id?: string) => void;
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

const AccordionItem = ({ id, title, section, open, setOpen }: AccordionItemProps) => {
  const toggle = (id: string) => {
    if (open === id) {
      setOpen();
    } else {
      setOpen(id);
    }
  };

  return (
    <Accordion.Item eventKey={id}>
      <Accordion.Header
        className={`accordion-button p-3 m-0 ${id === "0" ? "rounded-top" : ""} ${id === "5" ? "rounded-bottom" : ""} ${
          open === id ? "" : "border-bottom border-dark"
        }`}
        onClick={() => toggle(id)}
      >
        {title}
      </Accordion.Header>
      <Accordion.Body className="p-4 bg-white">{renderSectionContent(section)}</Accordion.Body>
    </Accordion.Item>
  );
};

export default AccordionItem;
