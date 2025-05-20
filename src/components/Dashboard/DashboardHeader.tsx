import { Greeting } from "../Greeting/Greeting";
import { MotivationalQuote } from "../Greeting/MotivationalQuote";

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
}: DashboardHeaderProps) => {
  return (
    <div className="rounded-5xl pl-16 pr-16 pt-8 pb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300 [background:hsla(173,72%,93%,1)] [background:linear-gradient(135deg,hsla(173,72%,93%,1)_0%,hsla(0,0%,100%,1)_100%)] [background:-moz-linear-gradient(135deg,hsla(173,72%,93%,1)_0%,hsla(0,0%,100%,1)_100%)] [background:-webkit-linear-gradient(135deg,hsla(173,72%,93%,1)_0%,hsla(0,0%,100%,1)_100%)] [filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#E0FAF7,endColorstr=#FFFFFF,GradientType=1)]">
      <Greeting className="mb-2" />
      <MotivationalQuote className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold font-inter text-pri-tea-900">
            {dayOfWeek}
          </h1>
          <span className="text-2xl font-inter text-pri-tea-700 uppercase">
            {currentDate}
          </span>
        </div>
        {temperature !== null && (
          <div className="flex items-center gap-2">
            {getWeatherIcon(weatherCondition)}
            <span className="text-2xl font-inter text-pri-tea-900">
              {temperature} °C
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
