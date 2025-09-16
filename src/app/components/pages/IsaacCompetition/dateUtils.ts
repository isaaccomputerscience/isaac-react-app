export const COMPETITION_OPEN_DATE = new Date("2025-11-02T16:00:00");
export const END_DATE = new Date("2025-08-30T16:00:00");
export const FOUR_WEEKS_AFTER_END_DATE = new Date(END_DATE.getTime() + 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks after end date

export const isBeforeCompetitionOpenDate = (currentDate: Date) => currentDate <= COMPETITION_OPEN_DATE;
export const isBeforeEndDate = (currentDate: Date) => currentDate <= END_DATE;
export const isWithinFourWeeksAfterEndDate = (currentDate: Date) =>
  currentDate > END_DATE && currentDate <= FOUR_WEEKS_AFTER_END_DATE;
export const isAfterFourWeeksFromEndDate = (currentDate: Date) => currentDate > FOUR_WEEKS_AFTER_END_DATE;
