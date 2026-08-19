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
    if (to.startsWith("#")) {
      document.getElementById(to.slice(1))?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (isExternalLink(to)) {
      window.open(to, "_blank", "noopener, noreferrer");
      return;
    }

    persistence.save(KEY.AFTER_AUTH_PATH, location.pathname);
    history.push(to);
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
