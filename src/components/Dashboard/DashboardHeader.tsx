import { Icon } from "@iconify/react";
import { QuickActions } from "./QuickActions";

// Import weather icons
import sunIcon from "../../assets/weather-icons/sun-svgrepo-com(1).svg";
import cloudIcon from "../../assets/weather-icons/cloud-svgrepo-com.svg";
import cloudySunIcon from "../../assets/weather-icons/cloudy-sun-svgrepo-com.svg";
import rainIcon from "../../assets/weather-icons/rain-water-svgrepo-com.svg";
import snowIcon from "../../assets/weather-icons/snowflake-svgrepo-com.svg";
import thunderIcon from "../../assets/weather-icons/thunder-svgrepo-com.svg";
import windIcon from "../../assets/weather-icons/wind-svgrepo-com.svg";
import moonIcon from "../../assets/weather-icons/crescent-moon-moon-svgrepo-com.svg";

interface DashboardHeaderProps {
  dayOfWeek: string;
  currentDate: string;
  temperature: number | null;
  weatherCondition: string | null;
  onAddTask: (title: string, description: string) => void;
  onAddSection: (title: string, time: string) => void;
}

const getWeatherIcon = (condition: string | null) => {
  if (!condition) return null;

  switch (condition.toLowerCase()) {
    case "clear":
      return <img src={sunIcon} alt="Sunny" className="w-8 h-8" />;
    case "clouds":
      return <img src={cloudIcon} alt="Cloudy" className="w-8 h-8" />;
    case "partly cloudy":
      return (
        <img src={cloudySunIcon} alt="Partly Cloudy" className="w-8 h-8" />
      );
    case "rain":
      return <img src={rainIcon} alt="Rainy" className="w-8 h-8" />;
    case "snow":
      return <img src={snowIcon} alt="Snowy" className="w-8 h-8" />;
    case "thunderstorm":
      return <img src={thunderIcon} alt="Thunderstorm" className="w-8 h-8" />;
    case "wind":
      return <img src={windIcon} alt="Windy" className="w-8 h-8" />;
    case "night":
      return <img src={moonIcon} alt="Night" className="w-8 h-8" />;
    default:
      return <img src={sunIcon} alt="Weather" className="w-8 h-8" />;
  }
};

export const DashboardHeader = ({
  dayOfWeek,
  currentDate,
  temperature,
  weatherCondition,
  onAddTask,
  onAddSection,
}: DashboardHeaderProps) => {
  return (
    <div className="bg-neu-800 rounded-xl pl-16 pr-16 pt-8 pb-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold font-outfit text-neu-100">
            {dayOfWeek}
          </h1>
          <span className="text-2xl font-outfit text-neu-400 uppercase">
            {currentDate}
          </span>
        </div>
        {temperature !== null && (
          <div className="flex items-center gap-2">
            {getWeatherIcon(weatherCondition)}
            <span className="text-2xl font-outfit text-neu-100">
              {temperature}°C
            </span>
          </div>
        )}
      </div>

      <QuickActions onAddTask={onAddTask} onAddSection={onAddSection} />
    </div>
  );
};
