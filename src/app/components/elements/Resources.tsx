import React from "react";
import PropTypes from "prop-types";

interface ResourcesProps {
  children: React.ReactNode;
  className?: string;
}

const Resources = ({ children, className = "" }: ResourcesProps) => {
  return <div className={`resources-background ${className}`}>{children}</div>;
};

Resources.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Resources;
