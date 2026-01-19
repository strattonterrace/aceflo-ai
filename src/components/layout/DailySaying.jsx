import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACEFLO_SAYINGS = [
  "Clarity begins where honesty starts.",
  "Momentum is built, not found.",
  "Listen deeper than the words.",
  "A small step can reroute a lifetime.",
  "Your truth is worth the journey.",
  "Stillness speaks louder than noise.",
  "Dreams grow when written down.",
  "Courage is action in disguise.",
  "Reflection without movement is a cage.",
  "Every path begins with a choice."
];

export default function DailySaying() {
  const [currentSaying, setCurrentSaying] = useState("");
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Calculate which saying to show based on the current day
    const updateSaying = () => {
      // Get days since epoch (consistent day counter)
      const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const sayingIndex = daysSinceEpoch % ACEFLO_SAYINGS.length;
      
      setCurrentSaying(ACEFLO_SAYINGS[sayingIndex]);
      setKey(prev => prev + 1);
    };

    updateSaying();

    // Check for day change every minute
    const interval = setInterval(() => {
      updateSaying();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glassmorphism rounded-xl p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs text-secondary font-medium italic">
            "{currentSaying}"
          </p>
          <p className="text-xs text-tertiary mt-1">— AceFlo Promise</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}