import { Greeting } from "../Greeting/Greeting";
import { MotivationalQuote } from "../Greeting/MotivationalQuote";
import { TimerButton } from "../Buttons/TimerButton";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimeInterval } from "../Pomodoro/PomodoroTimer";

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
  getWeatherIcon: (condition: string | null) => JSX.Element | null;
  isTimerVisible: boolean;
  setIsTimerVisible: (visible: boolean) => void;
  timeLeft: number;
  isTimerRunning: boolean;
  selectedInterval: TimeInterval;
  onTimerStart: (interval: TimeInterval) => void;
  onTimerPauseResume: () => void;
  onTimerCancel: () => void;
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
  getWeatherIcon,
  isTimerVisible,
  setIsTimerVisible,
  timeLeft,
  isTimerRunning,
  selectedInterval,
  onTimerStart,
  onTimerPauseResume,
  onTimerCancel,
  weatherCondition,
}: DashboardHeaderProps) => {
  // Abbreviate the day of the week to 3 letters
  const abbreviatedDay = dayOfWeek.substring(0, 3);

  // Split the current date into day and month
  const [month, day] = currentDate.split(" ");

  return (
    <div className="rounded-3xl lg:rounded-5xl pl-4 sm:pl-8 lg:pl-16 pr-4 sm:pr-8 lg:pr-16 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2),0_8px_32px_-8px_rgba(0,0,0,0.16)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.24),0_16px_48px_-16px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 rounded-3xl lg:rounded-5xl bg-gradient-rose-peach-75 dark:bg-gradient-highlighted-task opacity-100"></div>
      <div className="flex flex-col sm:flex-row justify-between items-start relative h-full z-10 gap-4 sm:gap-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${dayOfWeek}-${currentDate}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-row items-center gap-4 sm:gap-8 h-full w-full"
          >
            <div className="w-[70%] lg:w-auto flex flex-col justify-center space-y-4 lg:space-y-0">
              <div className="text-lg sm:text-xl lg:text-2xl">
                <Greeting className="text-lg sm:text-xl lg:text-3xl" />
              </div>
              <div className="text-base sm:text-lg lg:text-lg">
                <MotivationalQuote className="text-base sm:text-lg lg:text-lg mb-4 sm:mb-8" />
              </div>
              <div className="hidden lg:block mt-4">
                <TimerButton
                  onClick={() => onTimerStart(selectedInterval)}
                  isActive={isTimerVisible}
                  timeLeft={timeLeft}
                  isRunning={isTimerRunning}
                  onPauseResume={onTimerPauseResume}
                  onCancel={onTimerCancel}
                  className="text-xs sm:text-sm lg:text-base"
                />
              </div>
            </div>
            <div className="flex lg:hidden w-[30%]">
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`flex flex-col bg-neu-whi-100/90 dark:bg-neu-gre-900/90 backdrop-blur-sm items-center leading-none ${
                    temperature === null ? "rounded-2xl" : "rounded-t-2xl"
                  }`}
                >
                  <motion.h1
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="text-sm sm:text-base font-regular font-inter text-neu-gre-700 dark:text-neu-gre-100 leading-none px-2 sm:px-4 pt-3 sm:pt-4"
                  >
                    {abbreviatedDay}
                  </motion.h1>
                  <div className="flex flex-col items-center leading-none px-2 sm:px-4 pb-3 sm:pb-4">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-inter font-semibold text-neu-gre-800 dark:text-neu-gre-100 leading-none"
                    >
                      {day}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="text-sm sm:text-base font-inter font-regular text-neu-gre-700 dark:text-neu-gre-200 leading-none"
                    >
                      {month}
                    </motion.span>
                  </div>
                </motion.div>
                {temperature !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex items-center justify-center bg-neu-whi-100/25 dark:bg-neu-gre-900/40 backdrop-blur-sm rounded-b-2xl px-2 sm:px-4 py-3 sm:py-4 w-full"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                      className="w-4 h-4 sm:w-6 sm:h-6 -mt-4 sm:-mt-3.5 lg:mt-0"
                    >
                      {getWeatherIcon(weatherCondition)}
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                      className="text-base sm:text-lg font-medium font-inter text-neu-gre-100 dark:text-neu-gre-100 leading-none ml-1 sm:ml-2"
                    >
                      {temperature}°C
                    </motion.span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="hidden lg:flex flex-col items-center justify-center leading-none w-full sm:w-auto">
          <div className="w-[120px] sm:w-[140px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`flex flex-col bg-neu-whi-100/90 dark:bg-neu-gre-900/90 backdrop-blur-sm items-center leading-none ${
                temperature === null ? "rounded-5xl" : "rounded-t-5xl"
              }`}
            >
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="text-sm sm:text-md font-regular font-inter text-neu-gre-700 dark:text-neu-gre-100 leading-none px-4 sm:px-8 pt-2"
              >
                {abbreviatedDay}
              </motion.h1>
              <div className="flex flex-col items-center leading-none px-4 sm:px-8 pb-2">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-inter font-semibold text-neu-gre-800 dark:text-neu-gre-100 leading-none"
                >
                  {day}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="text-sm sm:text-md font-inter font-regular text-neu-gre-700 dark:text-neu-gre-200 leading-none"
                >
                  {month}
                </motion.span>
              </div>
            </motion.div>
            {temperature !== null && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex items-center justify-center bg-neu-whi-100/25 dark:bg-neu-gre-900/40 backdrop-blur-sm rounded-b-5xl px-4 sm:px-8 py-2 w-[120px] sm:w-[140px]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                  className="w-6 h-6 sm:w-8 sm:h-8"
                >
                  {getWeatherIcon(weatherCondition)}
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.9 }}
                  className="text-base sm:text-lg font-medium font-inter text-neu-gre-100 dark:text-neu-gre-100 leading-none ml-2"
                >
                  {temperature}°C
                </motion.span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
