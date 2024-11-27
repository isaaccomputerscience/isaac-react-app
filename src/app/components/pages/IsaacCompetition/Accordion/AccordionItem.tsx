import React, { memo } from "react";
import { Card, CardBody, CardHeader, Collapse } from "reactstrap";

interface AccordionItemProps {
  id: string;
  title: string;
  section: string[];
  open: string | null;
  isLast: boolean;
  setOpenState: (id?: string) => void;
}

const renderSectionContent = (section: string[], isList: boolean) => (
  <>
    {section[0]}
    {isList ? (
      <ul>
        {section.slice(1, -1).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      section.slice(1, -1).map((item, index) => <p key={index}>{item}</p>)
    )}
    {section[section.length - 1]}
  </>
);

const AccordionItem = memo(({ id, title, section, open, isLast, setOpenState }: AccordionItemProps) => {
  const toggle = (id: string) => {
    setOpenState(open === id ? undefined : id);
  };

  const headerClasses = [
    "accordion-button p-3 m-0 d-flex justify-content-between",
    id === "0" && "rounded-top",
    isLast && "rounded-bottom border-bottom-0",
    open !== id && "border-bottom border-dark",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card eventKey={id}>
      <CardHeader className={headerClasses} onClick={() => toggle(id)}>
        {title}
        {open === id ? (
          <img src={"/assets/chevron_up.svg"} alt="Up Icon" className="p-2" />
        ) : (
          <img src={"/assets/chevron_down.svg"} alt="Down Icon" className="p-2" />
        )}
      </CardHeader>

      <Collapse isOpen={open === id}>
        <CardBody className="p-3 bg-white border-bottom border-dark">{renderSectionContent(section, true)}</CardBody>
      </Collapse>
    </Card>
  );
});

AccordionItem.displayName = "AccordionItem";

export default AccordionItem;
