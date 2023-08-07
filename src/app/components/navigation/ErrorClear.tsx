import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { clearError } from "../../state";

// This component clears the error state when the location changes (i.e. when the user navigates to a new page)

const ErrorClear = () => {
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  useEffect(() => {
    if (previousLocation !== location.pathname) {
      clearError();
      setPreviousLocation(location.pathname);
    }
  }, [location, previousLocation]);

  return null;

};

export default ErrorClear;
