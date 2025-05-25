import React from "react";

interface Next7DaysIconProps {
  className?: string;
}

export const Next7DaysIcon: React.FC<Next7DaysIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="4" width="26" height="26" fill="#5E5FBC" />
      <rect x="7" y="7" width="4" height="16" fill="white" />
      <rect x="14" y="7" width="4" height="6" fill="white" />
      <text
        x="16"
        y="22"
        textAnchor="center"
        fill="white"
        fontSize="8"
        fontWeight="bold"
        fontFamily="Inter"
      >
        7
      </text>
    </svg>
  );
};
