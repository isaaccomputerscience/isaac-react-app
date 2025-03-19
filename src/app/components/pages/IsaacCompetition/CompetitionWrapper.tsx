import React from "react";

const endDate = new Date("2025-03-28T16:00:00"); // 4 PM on Friday, March 28, 2025
const fourWeeksAfterEndDate = new Date(endDate.getTime() + 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks after end date

interface CompetitionWrapperProps {
  children: React.ReactNode;
  afterEndDateChildren?: React.ReactNode;
}

const CompetitionWrapper = ({ children, afterEndDateChildren }: CompetitionWrapperProps) => {
  const currentDate = new Date();

  if (currentDate > endDate && currentDate <= fourWeeksAfterEndDate) {
    return <>{afterEndDateChildren}</>;
  }

  if (currentDate > endDate) {
    return null;
  }

  return <>{children}</>;
};

export default CompetitionWrapper;
