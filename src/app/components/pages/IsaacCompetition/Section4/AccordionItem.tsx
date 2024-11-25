import React, { memo } from "react";
import { Accordion } from "react-bootstrap";

interface AccordionItemProps {
  id: string;
  title: string;
  section: string[];
  open: string | null;
  setOpen: (id?: string) => void;
}

const renderSectionContent = (section: string[]) => (
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

const AccordionItem = memo(({ id, title, section, open, setOpen }: AccordionItemProps) => {
  const toggle = (id: string) => {
    setOpen(open === id ? undefined : id);
  };

  const headerClasses = [
    "accordion-button p-3 m-0",
    id === "0" && "rounded-top",
    id === "5" && "rounded-bottom",
    open !== id && "border-bottom border-dark",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Accordion.Item eventKey={id}>
      <Accordion.Header className={headerClasses} onClick={() => toggle(id)}>
        {title}
      </Accordion.Header>
      <Accordion.Body className="p-4 bg-white">{renderSectionContent(section)}</Accordion.Body>
    </Accordion.Item>
  );
});

AccordionItem.displayName = "AccordionItem";

export default AccordionItem;
