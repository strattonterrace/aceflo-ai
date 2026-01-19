import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, Target, Brain, Activity, TrendingUp, Settings, HelpCircle } from "lucide-react";
import { User } from "@/entities/User";
import { AnimatePresence } from "framer-motion";
import AuthButton from "./components/auth/AuthButton";
import OnboardingTour from "./components/onboarding/OnboardingTour";
import DailySaying from "./components/layout/DailySaying";
import ThemeToggle from "./components/layout/ThemeToggle";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Initialize theme
      let initialTheme = currentUser.theme_preference || 'dark';
      
      // First-time user: detect OS preference (cheap check)
      if (!currentUser.theme_preference) {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefersLight) {
          initialTheme = 'light';
          // Save preference silently
          await User.updateMyUserData({ theme_preference: 'light' });
        }
      }
      
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      
      if (!currentUser.has_completed_tour) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      // Not logged in - use default dark theme
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setIsLoadingUser(false);
  };

  const handleTourClose = () => {
    setShowTour(false);
    loadUser();
  };

  const handleRestartTour = () => {
    setShowTour(true);
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Persist to user profile
    if (user) {
      try {
        await User.updateMyUserData({ theme_preference: newTheme });
        
        // Optional analytics (simple console log for now - can be replaced with actual analytics)
        console.log('Theme toggled:', { from: theme, to: newTheme });
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  return (
    <div className="min-h-screen relative overflow-hidden theme-transition">
      <style>{`
        /* 🌌 AceFlo Brand Color System */
        :root {
          /* Check for reduced motion preference */
          --motion-reduce: 0;
        }
        
        @media (prefers-reduced-motion: reduce) {
          :root {
            --motion-reduce: 1;
          }
        }
        
        /* 🌙 Dark Mode - "Night Flow" Palette */
        [data-theme="dark"] {
          /* Base / Stillness */
          --color-base: #0A0F1C;
          --color-base-alt: #121212;
          
          /* Flow / Energy */
          --color-flow-violet: #3A0CA3;
          --color-flow-cyan: #4CC9F0;
          
          /* Pulse / Progress */
          --color-pulse-green: #06D6A0;
          --color-pulse-magenta: #FF4D6D;
          
          /* Text */
          --color-text-primary: #FFFFFF;
          --color-text-secondary: rgba(255, 255, 255, 0.7);
          --color-text-tertiary: rgba(255, 255, 255, 0.5);
          --color-text-inverse: #1A1A1A;
          
          /* Glass */
          --glass-bg: linear-gradient(135deg, rgba(58, 12, 163, 0.1) 0%, rgba(76, 201, 240, 0.05) 100%);
          --glass-border: rgba(255, 255, 255, 0.1);
          --glass-shadow: rgba(0, 0, 0, 0.2);
          --card-opacity: 1;
          
          /* Glow */
          --glow-intensity: 0.3;
          --glow-color: rgba(76, 201, 240, var(--glow-intensity));
          --glow-pulse-color: rgba(6, 214, 160, 0.4);
          
          /* Floating elements */
          --float-opacity: 0.3;
          
          /* Icons */
          --icon-color: #FFFFFF;
          --icon-muted: rgba(255, 255, 255, 0.6);
          
          /* Buttons */
          --btn-primary-bg: rgba(58, 12, 163, 0.8);
          --btn-primary-text: #FFFFFF;
          --btn-outline-border: rgba(255, 255, 255, 0.3);
          --btn-outline-text: #FFFFFF;
          --focus-ring: 0 0 0 3px rgba(76, 201, 240, 0.3);
          
          /* Inputs */
          --input-bg: rgba(255, 255, 255, 0.05);
          --input-border: rgba(255, 255, 255, 0.3);
          --placeholder: rgba(255, 255, 255, 0.5);
          
          /* Brand accent */
          --brand: #4CC9F0;
          --accent-1: #06D6A0;
          --accent-2: #FF4D6D;
          --accent-3: #4CC9F0;
          
          /* Progress */
          --progress-track: rgba(255, 255, 255, 0.1);
          --progress-fill: #4CC9F0;
          
          /* Badges */
          --badge-bg: rgba(76, 201, 240, 0.15);
          --badge-text: #4CC9F0;
          
          /* Sidebar */
          --sidebar-active-bg: rgba(76, 201, 240, 0.15);
        }
        
        /* ☀️ Light Mode - "Day Flow" Palette */
        [data-theme="light"] {
          /* Base / Stillness */
          --color-base: #F5F7FA;
          --color-base-alt: #FFFFFF;
          
          /* Flow / Energy */
          --color-flow-violet: #A3C4F3;
          --color-flow-cyan: #CDE8F9;
          
          /* Pulse / Progress */
          --color-pulse-green: #6DD3A8;
          --color-pulse-magenta: #FF7CA3;
          
          /* Text - HIGH CONTRAST */
          --color-text-primary: #111827;
          --color-text-secondary: rgba(17, 24, 39, 0.7);
          --color-text-tertiary: rgba(17, 24, 39, 0.55);
          --color-text-inverse: #FFFFFF;
          
          /* Glass - HIGHER OPACITY */
          --glass-bg: rgba(255, 255, 255, 0.82);
          --glass-border: rgba(12, 50, 84, 0.10);
          --glass-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
          --card-opacity: 0.82;
          
          /* Glow - SOFTENED */
          --glow-intensity: 0.15;
          --glow-color: rgba(109, 211, 168, var(--glow-intensity));
          --glow-pulse-color: rgba(109, 211, 168, 0.2);
          
          /* Floating elements - DIMMED */
          --float-opacity: 0.12;
          
          /* Icons - MATCH TEXT */
          --icon-color: #111827;
          --icon-muted: rgba(17, 24, 39, 0.6);
          
          /* Buttons */
          --btn-primary-bg: #3A0CA3;
          --btn-primary-text: #FFFFFF;
          --btn-outline-border: rgba(12, 50, 84, 0.28);
          --btn-outline-text: #111827;
          --focus-ring: 0 0 0 3px rgba(58, 12, 163, 0.25);
          
          /* Inputs */
          --input-bg: rgba(255, 255, 255, 0.9);
          --input-border: rgba(12, 50, 84, 0.18);
          --placeholder: rgba(17, 24, 39, 0.45);
          
          /* Brand accent */
          --brand: #3A0CA3;
          --accent-1: #6DD3A8;
          --accent-2: #FF7CA3;
          --accent-3: #2563EB;
          
          /* Progress */
          --progress-track: rgba(17, 24, 39, 0.08);
          --progress-fill: #3A0CA3;
          
          /* Badges */
          --badge-bg: rgba(37, 99, 235, 0.12);
          --badge-text: #1E40AF;
          
          /* Sidebar */
          --sidebar-active-bg: rgba(58, 12, 163, 0.12);
        }
        
        /* Smooth theme transition */
        .theme-transition,
        .theme-transition *,
        .theme-transition *::before,
        .theme-transition *::after {
          transition: background-color 250ms ease-in-out,
                      border-color 250ms ease-in-out,
                      color 250ms ease-in-out,
                      box-shadow 250ms ease-in-out !important;
        }
        
        /* Disable transitions if user prefers reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .theme-transition,
          .theme-transition *,
          .theme-transition *::before,
          .theme-transition *::after {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* Glassmorphism with Flow gradient */
        .glassmorphism {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
        }
        
        .glassmorphism-dark {
          background: rgba(10, 15, 28, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
        }
        
        /* Background gradient */
        .gradient-bg {
          background: linear-gradient(
            135deg, 
            var(--color-base) 0%, 
            var(--color-flow-violet) 50%, 
            var(--color-base-alt) 100%
          );
          background-size: 400% 400%;
        }
        
        /* Only animate if motion is not reduced */
        @media (prefers-reduced-motion: no-preference) {
          .gradient-bg {
            animation: gradient 20s ease infinite;
          }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        /* Flow gradient for CTAs */
        .gradient-flow {
          background: linear-gradient(
            135deg,
            var(--color-flow-violet) 0%,
            var(--color-flow-cyan) 100%
          );
        }
        
        /* Pulse accents */
        .accent-pulse-green {
          color: var(--accent-1);
        }
        
        .accent-pulse-magenta {
          color: var(--accent-2);
        }
        
        .bg-pulse-green {
          background-color: var(--accent-1);
        }
        
        .bg-pulse-magenta {
          background-color: var(--accent-2);
        }
        
        /* Glow effect */
        .glow {
          box-shadow: 0 0 20px var(--glow-color);
        }
        
        .glow-pulse {
          box-shadow: 0 0 20px var(--glow-pulse-color);
        }
        
        /* Floating animation */
        .floating {
          opacity: var(--float-opacity);
        }
        
        @media (prefers-reduced-motion: no-preference) {
          .floating {
            animation: floating 6s ease-in-out infinite;
          }
        }
        
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        /* Sidebar styling */
        .sidebar-glassmorphism {
          background: linear-gradient(
            180deg,
            rgba(10, 15, 28, 0.95) 0%,
            rgba(58, 12, 163, 0.1) 100%
          );
          backdrop-filter: blur(25px);
          border-right: 1px solid var(--glass-border);
        }
        
        [data-theme="light"] .sidebar-glassmorphism {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(163, 196, 243, 0.2) 100%
          );
        }
        
        /* Text colors */
        .text-primary {
          color: var(--color-text-primary);
        }
        
        .text-secondary {
          color: var(--color-text-secondary);
        }
        
        .text-tertiary {
          color: var(--color-text-tertiary);
        }
        
        /* Icon colors */
        svg {
          color: var(--icon-color);
        }
        
        .icon-muted svg {
          color: var(--icon-muted);
        }
        
        /* Link styles */
        a {
          color: var(--accent-3);
          text-decoration: none;
          transition: all 200ms ease;
        }
        
        a:hover {
          color: var(--accent-3);
          text-decoration: underline;
        }
        
        [data-theme="light"] a:hover {
          color: #1D4ED8;
        }
        
        /* Button styles */
        button:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }
        
        .btn-primary {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: 1px solid var(--btn-outline-border);
          transition: all 200ms ease;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: var(--glow-color);
        }
        
        .btn-outline {
          background: transparent;
          color: var(--btn-outline-text);
          border: 1px solid var(--btn-outline-border);
          transition: all 200ms ease;
        }
        
        .btn-outline:hover:not(:disabled) {
          background: rgba(58, 12, 163, 0.07);
        }
        
        [data-theme="light"] .btn-outline:hover:not(:disabled) {
          background: rgba(58, 12, 163, 0.07);
        }
        
        /* Input/Textarea styles */
        input, textarea, select {
          background: var(--input-bg);
          border-color: var(--input-border);
          color: var(--color-text-primary);
        }
        
        input::placeholder, textarea::placeholder {
          color: var(--placeholder);
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          box-shadow: var(--focus-ring);
        }
        
        /* Progress bar */
        [data-progress-root] {
          background: var(--progress-track);
        }
        
        [data-progress-indicator] {
          background: var(--progress-fill);
        }
        
        /* Badge styles */
        .badge-custom {
          background: var(--badge-bg);
          color: var(--badge-text);
        }
        
        /* Sidebar nav active state */
        .nav-item-active {
          background: var(--sidebar-active-bg) !important;
          color: var(--brand) !important;
        }
        
        .nav-item-active svg {
          color: var(--brand) !important;
        }
        
        /* Scrim for text over gradients */
        .text-over-gradient {
          backdrop-filter: blur(8px);
          background: linear-gradient(transparent, rgba(245, 247, 250, 0.55));
        }
        
        [data-theme="dark"] .text-over-gradient {
          background: linear-gradient(transparent, rgba(10, 15, 28, 0.55));
        }
      `}</style>
      
      {/* Animated Background */}
      <div className="fixed inset-0 gradient-bg" />
      
      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="floating absolute top-20 left-20 w-32 h-32 glassmorphism rounded-full" />
        <div className="floating absolute top-60 right-32 w-24 h-24 glassmorphism rounded-full" style={{animationDelay: '2s'}} />
        <div className="floating absolute bottom-40 left-40 w-20 h-20 glassmorphism rounded-full" style={{animationDelay: '4s'}} />
        <div className="floating absolute bottom-20 right-20 w-28 h-28 glassmorphism rounded-full" style={{animationDelay: '1s'}} />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div className="w-72 sidebar-glassmorphism flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-flow rounded-xl flex items-center justify-center glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">AceFlo.ai</h1>
                <p className="text-xs text-tertiary">Clarity. Rhythm. Progress.</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Link
                to={createPageUrl("Dashboard")}
                data-tour="nav-dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Dashboard")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link
                to={createPageUrl("Chat")}
                data-tour="nav-chat"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Chat")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Chat</span>
              </Link>

              <Link
                to={createPageUrl("Goals")}
                data-tour="nav-goals"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Goals")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <Target className="w-5 h-5" />
                <span className="font-medium">Goals</span>
              </Link>

              <Link
                to={createPageUrl("Progress")}
                data-tour="nav-progress"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Progress")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span className="font-medium">Progress</span>
              </Link>

              <Link
                to={createPageUrl("Pulse")}
                data-tour="nav-pulse"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Pulse")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <Brain className="w-5 h-5" />
                <span className="font-medium">Pulse</span>
              </Link>

              <Link
                to={createPageUrl("Settings")}
                data-tour="nav-settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive("Settings")
                    ? 'nav-item-active glow'
                    : 'text-secondary hover:text-primary hover:glassmorphism'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <DailySaying />
            
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1">
                <AuthButton />
              </div>
              <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
            </div>

            {user && !isLoadingUser && (
              <button
                onClick={handleRestartTour}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 glassmorphism rounded-lg text-secondary hover:text-primary hover:glow transition-all duration-200"
                title="Restart onboarding tour"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Need help?</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showTour && (
          <OnboardingTour onClose={handleTourClose} />
        )}
      </AnimatePresence>
    </div>
  );
}