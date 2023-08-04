import React, { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearError } from "../../state"

interface ErrorClearingRouterProps {
    children: ReactNode;
  }

// This component clears the error state when the location changes (i.e. when the user navigates to a new page)

const ErrorClearingRouter: React.FC<ErrorClearingRouterProps> = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  useEffect(() => {
    if (previousLocation !== location.pathname) {
    clearError();
    setPreviousLocation(location.pathname);
    }
  }, [dispatch, location, previousLocation]);

  return <>{children}</>;
};

export default ErrorClearingRouter;