import type { ReactElement } from "react";
import { Greeting } from "../Greeting/Greeting";
import { MotivationalQuote } from "../Greeting/MotivationalQuote";
import { motion, AnimatePresence } from "framer-motion";

// Import animated weather icons
import clearDayIcon from "../../assets/animated-weather-icons/clear-day.svg";
import clearNightIcon from "../../assets/animated-weather-icons/clear-night.svg";
import cloudyIcon from "../../assets/animated-weather-icons/cloudy.svg";
import overcastIcon from "../../assets/animated-weather-icons/overcast.svg";
import partlyCloudyDayIcon from "../../assets/animated-weather-icons/partly-cloudy-day.svg";
import partlyCloudyNightIcon from "../../assets/animated-weather-icons/partly-cloudy-night.svg";
import rainIcon from "../../assets/animated-weather-icons/rain.svg";
import drizzleIcon from "../../assets/animated-weather-icons/drizzle.svg";
import snowIcon from "../../assets/animated-weather-icons/snow.svg";
import sleetIcon from "../../assets/animated-weather-icons/sleet.svg";
import thunderstormDayIcon from "../../assets/animated-weather-icons/thunderstorms-day.svg";
import thunderstormNightIcon from "../../assets/animated-weather-icons/thunderstorms-night.svg";
import thunderstormRainIcon from "../../assets/animated-weather-icons/thunderstorms-rain.svg";
import fogDayIcon from "../../assets/animated-weather-icons/fog-day.svg";
import fogNightIcon from "../../assets/animated-weather-icons/fog-night.svg";
import mistIcon from "../../assets/animated-weather-icons/mist.svg";
import hazeDayIcon from "../../assets/animated-weather-icons/haze-day.svg";
import hazeNightIcon from "../../assets/animated-weather-icons/haze-night.svg";
import smokeIcon from "../../assets/animated-weather-icons/smoke.svg";
import dustDayIcon from "../../assets/animated-weather-icons/dust-day.svg";
import dustNightIcon from "../../assets/animated-weather-icons/dust-night.svg";
import sandIcon from "../../assets/animated-weather-icons/dust-wind.svg";
import ashIcon from "../../assets/animated-weather-icons/smoke-particles.svg";
import squallIcon from "../../assets/animated-weather-icons/wind.svg";
import tornadoIcon from "../../assets/animated-weather-icons/tornado.svg";
import hurricaneIcon from "../../assets/animated-weather-icons/hurricane.svg";
import coldIcon from "../../assets/animated-weather-icons/thermometer-colder.svg";
import hotIcon from "../../assets/animated-weather-icons/thermometer-warmer.svg";
import windIcon from "../../assets/animated-weather-icons/wind.svg";
import notAvailableIcon from "../../assets/animated-weather-icons/not-available.svg";

interface DashboardHeaderProps {
  currentDate: string;
  dayOfWeek: string;
  temperature: number | null;
  weatherCondition: string | null;
  isWeatherLoading?: boolean;
  hasLocationPermission?: boolean;
}

export const DashboardHeader = ({
  currentDate,
  dayOfWeek,
  temperature,
  weatherCondition,
  isWeatherLoading = false,
  hasLocationPermission = false,
}: DashboardHeaderProps) => {
  // Abbreviate the day of the week to 3 letters
  const abbreviatedDay = dayOfWeek.substring(0, 3);

  // Split the current date into day and month
  const [month, day] = currentDate.split(" ");

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string | null): ReactElement | null => {
    if (!condition) return null;

    // Determine if it's day or night based on current time
    const currentHour = new Date().getHours();
    const isDay = currentHour >= 6 && currentHour < 18;

    const iconMap: { [key: string]: string } = {
      // Clear conditions
      Clear: isDay ? clearDayIcon : clearNightIcon,

      // Cloud conditions
      Clouds: cloudyIcon,
      Overcast: overcastIcon,

      // Partly cloudy conditions
      "Partly Cloudy": isDay ? partlyCloudyDayIcon : partlyCloudyNightIcon,

      // Precipitation
      Rain: rainIcon,
      Drizzle: drizzleIcon,
      Snow: snowIcon,
      Sleet: sleetIcon,

      // Thunderstorms
      Thunderstorm: isDay ? thunderstormDayIcon : thunderstormNightIcon,
      "Thunderstorm with Rain": thunderstormRainIcon,

      // Atmospheric conditions
      Fog: isDay ? fogDayIcon : fogNightIcon,
      Mist: mistIcon,
      Haze: isDay ? hazeDayIcon : hazeNightIcon,
      Smoke: smokeIcon,
      Dust: isDay ? dustDayIcon : dustNightIcon,
      Sand: sandIcon,
      Ash: ashIcon,

      // Wind conditions
      Squall: squallIcon,
      Wind: windIcon,

      // Extreme weather
      Tornado: tornadoIcon,
      Hurricane: hurricaneIcon,

      // Temperature extremes
      Cold: coldIcon,
      Hot: hotIcon,

      // Fallback
      Unknown: notAvailableIcon,
    };

    // Handle OpenWeather API specific conditions
    const getOpenWeatherIcon = (mainCondition: string): string => {
      switch (mainCondition) {
        case "Clear":
          return isDay ? clearDayIcon : clearNightIcon;
        case "Clouds":
          return cloudyIcon;
        case "Rain":
          return rainIcon;
        case "Drizzle":
          return drizzleIcon;
        case "Snow":
          return snowIcon;
        case "Thunderstorm":
          return isDay ? thunderstormDayIcon : thunderstormNightIcon;
        case "Mist":
          return mistIcon;
        case "Smoke":
          return smokeIcon;
        case "Haze":
          return isDay ? hazeDayIcon : hazeNightIcon;
        case "Dust":
          return isDay ? dustDayIcon : dustNightIcon;
        case "Fog":
          return isDay ? fogDayIcon : fogNightIcon;
        case "Sand":
          return sandIcon;
        case "Ash":
          return ashIcon;
        case "Squall":
          return squallIcon;
        case "Tornado":
          return tornadoIcon;
        default:
          return notAvailableIcon;
      }
    };

    const iconSrc = iconMap[condition] || getOpenWeatherIcon(condition);

    return (
      <img
        src={iconSrc}
        alt={`${condition} weather condition icon`}
        className="h-10 w-10"
      />
    );
  };

  return (
    <div className="rounded-3xl lg:rounded-5xl pl-4 sm:pl-8 lg:pl-16 pr-4 sm:pr-8 lg:pr-16 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2),0_8px_32px_-8px_rgba(0,0,0,0.16)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.24),0_16px_48px_-16px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 rounded-3xl lg:rounded-5xl bg-gradient-warm dark:bg-gradient-highlighted-task opacity-100"></div>
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
                {hasLocationPermission &&
                  (temperature !== null || isWeatherLoading) && (
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
                        className="w-6 h-6 sm:w-8 sm:h-8 -mt-4 sm:-mt-3.5 lg:mt-0"
                      >
                        {isWeatherLoading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-2 border-neu-gre-100 dark:border-neu-gre-100 border-t-transparent"></div>
                          </div>
                        ) : (
                          getWeatherIcon(weatherCondition)
                        )}
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                        className="text-base sm:text-lg font-medium font-inter text-neu-gre-100 dark:text-neu-gre-100 leading-none ml-1 sm:ml-2"
                      >
                        {isWeatherLoading
                          ? "Getting weather..."
                          : `${temperature}°C`}
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
            {hasLocationPermission &&
              (temperature !== null || isWeatherLoading) && (
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
                    className="w-8 h-8 sm:w-10 sm:h-10"
                  >
                    {isWeatherLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-neu-gre-100 dark:border-neu-gre-100 border-t-transparent"></div>
                      </div>
                    ) : (
                      getWeatherIcon(weatherCondition)
                    )}
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                    className="text-base sm:text-lg font-medium font-inter text-neu-gre-100 dark:text-neu-gre-100 leading-none ml-2"
                  >
                    {isWeatherLoading
                      ? "Getting weather..."
                      : `${temperature}°C`}
                  </motion.span>
                </motion.div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
