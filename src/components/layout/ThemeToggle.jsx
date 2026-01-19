import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="glassmorphism rounded-lg p-2 hover:glow transition-all duration-200 group"
      title="Switch your rhythm — from Night Flow to Day Flow"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-white group-hover:text-yellow-300 transition-colors" />
        ) : (
          <Moon className="w-5 h-5 text-gray-800 group-hover:text-indigo-600 transition-colors" />
        )}
      </motion.div>
    </button>
  );
}