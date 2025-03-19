import React from "react";

const endDate = new Date("2025-03-28T16:00:00"); // 4 PM on Friday, March 28, 2025

interface CompetitionWrapperProps {
  children: React.ReactNode;
}

const CompetitionWrapper = ({ children }: CompetitionWrapperProps) => {
  const currentDate = new Date();

  if (currentDate > endDate) {
    return null;
  }

  return <>{children}</>;
};

export default CompetitionWrapper;
