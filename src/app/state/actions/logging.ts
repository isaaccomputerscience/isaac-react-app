import { ACTION_TYPE, api } from "../../services";

export const logAction = (eventDetails: object) => {
  console.log("🔍 logAction called with:", eventDetails);
  console.log("🔍 API endpoint:", api.logger);

  // Make sure the API call is actually being executed
  const apiCall = api.logger.log(eventDetails);
  console.log("🔍 API call created:", apiCall);

  apiCall
    .then((response) => {
      console.log("✅ Event logged successfully:", eventDetails, response);
    })
    .catch((error) => {
      console.error("❌ Failed to log video event:", error);
      console.error("❌ Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    });

  return { type: ACTION_TYPE.LOG_EVENT, eventDetails: eventDetails };
};
