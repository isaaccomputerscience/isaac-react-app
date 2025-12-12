import { ACTION_TYPE, api } from "../../services";

export const logAction = (eventDetails: object) => {
  api.logger.log(eventDetails).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to log event:", error);
    }
  });

  return { type: ACTION_TYPE.LOG_EVENT, eventDetails };
};
