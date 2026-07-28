import React from "react";
import { Button } from "reactstrap";
import { useHistory, useLocation } from "react-router-dom";
import { persistence, KEY } from "../../../../services";

interface CompetitionButtonProps {
  buttons: { to: string; label: string }[];
}

const CompetitionButton = ({ buttons }: CompetitionButtonProps) => {
  const history = useHistory();
  const location = useLocation();

  const isExternalLink = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:");
  };

  const handleClick = (to: string) => {
    persistence.save(KEY.AFTER_AUTH_PATH, location.pathname);

    if (isExternalLink(to)) {
      // For external links, open in the new tab
      window.open(to, "_blank", "noopener, noreferrer");
    } else {
      // For internal links, use React Router
      history.push(to);
    }
  };

  return (
    <>
      {buttons.map(({ to, label }) => (
        <Button key={to} size="lg" onClick={() => handleClick(to)} className="primary-button text-light">
          {label}
        </Button>
      ))}
    </>
  );
};

export default CompetitionButton;
