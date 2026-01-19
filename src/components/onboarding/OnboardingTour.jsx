
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, ArrowRight, Sparkles, MessageCircle, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";

const TOUR_STEPS = [
  {
    id: 1,
    title: "Welcome to AceFlo",
    body: "This space is for you. We listen first, then help you move. From reflection to rhythm. From path to progress.",
    icon: Sparkles,
    highlight: null
  },
  {
    id: 2,
    title: "Three modes, one you",
    bullets: [
      "Coach – find your rhythm, stay accountable",
      "Task – clear steps, fast action",
      "ACE – deep thinking, creative momentum"
    ],
    note: "Auto-selects based on your message, but you can always switch.",
    icon: Sparkles,
    highlight: "mode-selector"
  },
  {
    id: 3,
    title: "Chat: say what's real",
    body: "Drop the mess here. I'll mirror back what matters and help you take the next step. We walk together.",
    icon: MessageCircle,
    highlight: "nav-chat"
  },
  {
    id: 4,
    title: "Goals & Progress: make it visible",
    body: "Clarity becomes action. Track what you do. Small wins build momentum. This is your path forward.",
    icon: Target,
    highlight: "nav-goals"
  },
  {
    id: 5,
    title: "Pulse: help me help you",
    body: "Answer once, and I'll tune to you. The more honest you are, the better I can guide. Let's find your rhythm.",
    icon: Activity,
    highlight: "nav-pulse"
  }
];

export default function OnboardingTour({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    // Focus trap and ESC handler
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [handleSkip]);

  useEffect(() => {
    // Add highlight class to target element
    const step = TOUR_STEPS[currentStep];
    if (step.highlight) {
      const element = document.querySelector(`[data-tour="${step.highlight}"]`);
      if (element) {
        element.classList.add("tour-highlight");
      }
    }

    // Cleanup previous highlights
    return () => {
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        el.classList.remove("tour-highlight");
      });
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await User.updateMyUserData({ has_completed_tour: true });
      onClose();
    } catch (error) {
      console.error("Error completing tour:", error);
      setIsFinishing(false);
    }
  };

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 1001;
          animation: pulse-ring 2s ease-in-out infinite;
        }
        
        @keyframes pulse-ring {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
          }
        }
      `}</style>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 pointer-events-none">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="glassmorphism rounded-2xl p-8 max-w-lg w-full pointer-events-auto glow"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center glow">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <p className="text-xs text-white/60">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-1 bg-white/10" />
          </div>

          {/* Content */}
          <div className="mb-8">
            {step.body && (
              <p className="text-white/90 leading-relaxed">{step.body}</p>
            )}
            
            {step.bullets && (
              <ul className="space-y-2 mb-4">
                {step.bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-2 text-white/90">
                    <span className="text-white/40 mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {step.note && (
              <p className="text-sm text-white/70 italic mt-4">
                {step.note}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="glassmorphism border-white/30 text-white hover:glow"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                Skip
              </Button>
              
              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  disabled={isFinishing}
                  className="glassmorphism border-white/30 text-white hover:glow"
                >
                  {isFinishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Finishing...
                    </>
                  ) : (
                    "Got it"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="glassmorphism border-white/30 text-white hover:glow"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
