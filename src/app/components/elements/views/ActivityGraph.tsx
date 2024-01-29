import React, { useEffect, useMemo } from "react";
import bb, { zoom, areaSpline } from "billboard.js";
import { AnsweredQuestionsByDate } from "../../../../IsaacApiTypes";
import { formatISODateOnly } from "../DateString";

const filterAndSortSelectedDates = (answeredQuestionsByDate: AnsweredQuestionsByDate) => {
  const foundDates = answeredQuestionsByDate ? Object.keys(answeredQuestionsByDate) : [];

  if (foundDates?.some((date) => answeredQuestionsByDate[date] > 0)) {
    return foundDates.sort((a, b) => a.localeCompare(b));
  }

  return [];
};

export const ActivityGraph = ({ answeredQuestionsByDate }: { answeredQuestionsByDate: AnsweredQuestionsByDate }) => {
  const selectedDates: string[] = useMemo(
    () => filterAndSortSelectedDates(answeredQuestionsByDate),
    [answeredQuestionsByDate],
  );

  useEffect(() => {
    if (selectedDates.length === 0) {
      return;
    }
    let minDate, maxDate;
    let nTicks = selectedDates.length;
    if (selectedDates.length === 1) {
      // If only one datapoint, Billboard shows a decade of time on the x-axis. Truncate to one month each side:
      const firstDate = new Date(selectedDates[0]);
      minDate = formatISODateOnly(new Date(firstDate.getFullYear(), firstDate.getMonth() - 1, 1));
      maxDate = formatISODateOnly(new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 1));
      nTicks = 3; // For one month, we need 3 labels for symmetry else label ends up in wrong place.
    }
    bb.generate({
      data: {
        x: "x",
        columns: [
          ["x", ...selectedDates],
          [
            "activity",
            ...selectedDates.map((date) => (answeredQuestionsByDate ? answeredQuestionsByDate[date] || 0 : 0)),
          ],
        ],
        types: { activity: areaSpline() },
        colors: { activity: "#ffb53f" },
        xFormat: "%Y-%m-%d",
      },
      axis: {
        x: {
          type: "timeseries",
          tick: { fit: false, format: "%b %Y", count: Math.min(8, nTicks) },
          min: minDate, // If these are undefined, then the values from the data will be used.
          max: maxDate,
        },
      },
      zoom: { enabled: zoom() },
      legend: { show: false },
      spline: { interpolation: { type: "monotone-x" } },
      bindto: "#activityGraph",
      padding: { top: 0, right: 30, bottom: 0, left: 30 }, // Pad sides to avoid tick labels being truncated!
    });
  }, [answeredQuestionsByDate, selectedDates]);

  return selectedDates.length > 0 ? (
    <div id="activityGraph" />
  ) : (
    <div className="text-center-width">
      <strong>No data</strong>
    </div>
  );
};
