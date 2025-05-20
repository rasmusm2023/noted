import { Greeting } from "../Greeting/Greeting";
import { MotivationalQuote } from "../Greeting/MotivationalQuote";
import { TimerButton } from "../Button/TimerButton";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

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
  onTimerClick: () => void;
  isTimerActive: boolean;
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
  onTimerClick,
  isTimerActive,
}: DashboardHeaderProps) => {
  // Abbreviate the day of the week to 3 letters
  const abbreviatedDay = dayOfWeek.substring(0, 3);

  // Split the current date into day and month
  const [month, day] = currentDate.split(" ");

  return (
    <div className="rounded-5xl pl-16 pr-16 pt-8 pb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_16px_48px_-16px_rgba(0,0,0,0.1)] transition-all duration-300 bg-pink-test-500 [background:linear-gradient(90deg,theme(colors.pink-test.500)_0%,theme(colors.orange-test.500)_100%)] [background:-moz-linear-gradient(90deg,theme(colors.pink-test.500)_0%,theme(colors.orange-test.500)_100%)] [background:-webkit-linear-gradient(90deg,theme(colors.pink-test.500)_0%,theme(colors.orange-test.500)_100%)] [filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=#EF709B,endColorstr=#FA9372,GradientType=1)]">
      <div className="flex justify-between items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${dayOfWeek}-${currentDate}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Greeting className="mb-2" />
            <MotivationalQuote className="mb-4" />
            <TimerButton onClick={onTimerClick} isActive={isTimerActive} />
          </motion.div>
        </AnimatePresence>
        <div className="flex flex-col  items-center leading-none">
          <div className="flex flex-col px-4 py-2 bg-neu-whi-100 rounded-5xl items-center leading-none mb-4">
            <h1 className="text-md font-regular font-inter text-neu-gre-800 leading-none">
              {abbreviatedDay}
            </h1>
            <div className="flex flex-col items-center leading-none">
              <span className="text-6xl font-inter font-bold text-neu-gre-700 leading-none">
                {day}
              </span>
              <span className="text-md font-inter font-regular text-neu-gre-800 leading-none">
                {month}
              </span>
            </div>
          </div>
          {temperature !== null && (
            <div className="flex flex-1 items-center gap-2">
              {getWeatherIcon(weatherCondition)}
              <span className="text-xl font-bold font-inter text-neu-gre-100 leading-none">
                {temperature}°C
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
