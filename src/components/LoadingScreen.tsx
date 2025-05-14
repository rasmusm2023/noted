import { motion } from "framer-motion";

export const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-neu-900 flex items-center justify-center z-50"
    >
      <div className="relative w-full max-w-4xl mx-auto space-y-8 p-8">
        {/* First container animation */}
        <motion.div
          initial={{
            scale: 0.1,
            borderRadius: "12px",
            width: "40px",
            height: "40px",
            x: "calc(50% - 20px)",
          }}
          animate={{
            scale: 1,
            width: "100%",
            height: "200px",
            x: 0,
          }}
          transition={{
            duration: 1.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="bg-neu-600 p-6 shadow-lg"
        />

        {/* Second container animation */}
        <motion.div
          initial={{
            scale: 0.1,
            borderRadius: "12px",
            width: "40px",
            height: "40px",
            x: "calc(50% - 20px)",
          }}
          animate={{
            scale: 1,
            width: "100%",
            height: "400px",
            x: 0,
          }}
          transition={{
            duration: 1.5,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.3,
          }}
          className="bg-neu-600 p-6 shadow-lg"
        />
      </div>
    </motion.div>
  );
};
