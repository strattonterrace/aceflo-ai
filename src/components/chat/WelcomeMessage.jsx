import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

export default function WelcomeMessage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="glassmorphism rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-white/20 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-4 bg-white/10 rounded mx-auto animate-pulse" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="glassmorphism rounded-2xl p-8 max-w-md mx-auto">
        <div className="relative mb-4">
          <Bot className="w-12 h-12 text-primary mx-auto opacity-70" />
          <Sparkles className="w-4 h-4 text-secondary absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        {user ? (
          <>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Hey {user.full_name?.split(' ')[0] || user.email.split('@')[0]}.
            </h3>
            <p className="text-secondary mb-4 leading-relaxed">
              I'm here to walk with you — to listen, reflect back what matters, and help you move forward.
            </p>
            <p className="text-sm text-tertiary">
              Drop what's on your mind. Let's find your rhythm.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Welcome to AceFlo
            </h3>
            <p className="text-secondary mb-4 leading-relaxed">
              A hand on your shoulder. A mirror for your mind. A push to act.
            </p>
            <p className="text-sm text-tertiary">
              From reflection to rhythm. From path to progress.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}