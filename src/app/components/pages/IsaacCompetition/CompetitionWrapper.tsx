import React from "react";
import {
  isBeforeCompetitionOpenDate,
  isAfterCompetitionEndDateAndBeforeEntriesClosedBannerEndDate,
  ENTRIES_CLOSED_BANNER_END_DATE,
} from "./dateUtils";
import { selectors, useAppSelector } from "../../../state";
import { isAdmin } from "../../../services";

interface CompetitionWrapperProps {
  children: React.ReactNode;
  beforeCompetitionOpenContent?: React.ReactNode;
  closedCompetitionContent?: React.ReactNode;
  currentDate?: Date;
}

const CompetitionWrapper = ({
  children,
  beforeCompetitionOpenContent,
  closedCompetitionContent,
  currentDate = new Date(), // Use provided date or current date
}: CompetitionWrapperProps) => {
  const user = useAppSelector(selectors.user.orNull);

  // ADMIN users always see the Competition form
  if (isAdmin(user)) {
    return <>{children}</>;
  }

  // For non-admin users, apply the date restrictions
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