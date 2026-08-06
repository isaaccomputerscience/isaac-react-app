import React from "react";
import AccordionItem from "./AccordionItem";

interface AccordionProps {
  title?: string;
  sections: {
    id: string;
    title: string;
    section: (string | (string | (string | string[])[])[])[];
  }[];
  open: string | null;
  setOpenState: (id: string | undefined) => void;
}

const Accordion = ({ title, sections, open, setOpenState }: AccordionProps) => {
  return (
    <>
      {title && <h3 className="accordion-title pt-3 pb-4">{title}</h3>}
      <div className="accordion accordion-body">
        {sections.map(({ id, title, section }, index) => (
          <AccordionItem
            key={id}
            id={id}
            title={title}
            section={section}
            open={open}
            isLast={index === sections.length - 1}
            setOpenState={setOpenState}
          />
        ))}
      </div>
    </>
  );
};

export default Accordion;
