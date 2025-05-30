import React from "react";
import purpleIcon from "../../assets/icons/Next7DaysIcon-Purple.png";

interface Next7DaysIconProps {
  className?: string;
}

export const Next7DaysIcon: React.FC<Next7DaysIconProps> = ({ className }) => {
  return <img src={purpleIcon} alt="Next 7 Days" className={className} />;
};
