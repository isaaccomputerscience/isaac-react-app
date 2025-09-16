import React from "react";
import {
  isBeforeCompetitionOpenDate,
  isAfterCompetitionEndDateAndBeforeEntriesClosedBannerEndDate,
  ENTRIES_CLOSED_BANNER_END_DATE,
} from "./dateUtils";

interface CompetitionWrapperProps {
  children: React.ReactNode;
  beforeCompetitionOpenContent?: React.ReactNode;
  closedCompetitionContent?: React.ReactNode;
}

const CompetitionWrapper = ({
  children,
  beforeCompetitionOpenContent,
  closedCompetitionContent,
}: CompetitionWrapperProps) => {
  const currentDate = new Date();

  // Hide entry form before competition opens (before Nov 2 midnight)
  if (isBeforeCompetitionOpenDate(currentDate)) {
    return <>{beforeCompetitionOpenContent}</>;
  }

  // Show closed content from Feb 1 to Mar 13, 2026
  if (isAfterCompetitionEndDateAndBeforeEntriesClosedBannerEndDate(currentDate)) {
    return <>{closedCompetitionContent}</>;
  }

  // Hide everything after Mar 13, 2026
  if (currentDate > ENTRIES_CLOSED_BANNER_END_DATE) {
    return null;
  }

  // Show normal content during competition period
  return <>{children}</>;
};

export default CompetitionWrapper;
