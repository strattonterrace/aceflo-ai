import React, { useState, useEffect, useRef } from "react";
import { Session } from "@/entities/Session";
import { User } from "@/entities/User";
import { ProgressEntity } from "@/entities/ProgressEntity"; // Added ProgressEntity import
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, CheckCircle2, X } from "lucide-react"; // Added X import
import { AnimatePresence, motion } from "framer-motion";

import ChatMessage from "../components/chat/ChatMessage";
import ModeSelector from "../components/chat/ModeSelector";
import SessionHistory from "../components/chat/SessionHistory";
import WelcomeMessage from "../components/chat/WelcomeMessage";
import GoalActionCard from "../components/chat/GoalActionCard";

// Helper function to create page URLs. In a real application, this would likely be part of a routing library.
// For this context, we'll provide a basic implementation.
const createPageUrl = (page, params) => {
  let url = `/${page.toLowerCase()}`;
  if (params) {
    const query = new URLSearchParams(params).toString();
    url += `?${query}`;
  }
  return url;
};

// Placeholder Link component. In a real application, this would be from 'next/link' or 'react-router-dom'.
// For this context, we'll provide a basic implementation.
const Link = ({ to, className, onClick, children }) => (
  <a href={to} className={className} onClick={onClick}>
    {children}
  </a>
);

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("coach");
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [contextBanner, setContextBanner] = useState(null); // Added contextBanner state
  const [suppressNextGoalCard, setSuppressNextGoalCard] = useState(false); // New suppression flag
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  useEffect(() => {
    loadSessions();
    loadUserPreferences();
    handleDeepLink();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 glassmorphism rounded-lg px-6 py-3 z-50 ${
      type === "error" ? "border-2 border-red-400/30" : "border-2 border-green-400/30"
    }`;
    toast.innerHTML = `<p class="text-primary text-sm">${message}</p>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleDeepLink = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const messageId = urlParams.get('messageId');
    const goalId = urlParams.get('goalId'); // Capture goalId for analytics

    if (sessionId) {
      try {
        const allSessions = await Session.list();
        const targetSession = allSessions.find(s => s.id === sessionId);

        if (targetSession) {
          setCurrentSession(targetSession);
          setMessages(targetSession.messages || []);
          setMode(targetSession.mode);

          // If we came from a goal, load that goal's info for the banner
          if (goalId) {
            try {
              const goals = await ProgressEntity.filter({ id: goalId });
              if (goals.length > 0) {
                setContextBanner({
                  goalId: goalId,
                  goalTitle: goals[0].goal
                });
              }
            } catch (error) {
              console.error("Error loading goal for banner:", error);
            }
          }

          // If messageId provided, scroll to it after render
          if (messageId) {
            setTimeout(() => {
              const element = messageRefs.current[messageId];
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Highlight for 1.2s
                setHighlightedMessageId(messageId);
                setTimeout(() => setHighlightedMessageId(null), 1200);

                // Analytics
                console.log('Analytics: deep_link_view_chat', {
                  goalId: goalId,
                  sessionId,
                  messageId
                });
              } else {
                showToast("Message not found in conversation", "error");
              }
            }, 300);
          }
        } else {
          showToast("Chat context not available", "error");
        }
      } catch (error) {
        console.error("Error loading deep link session:", error);
        showToast("Chat context not available", "error");
      }

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };


  const loadSessions = async () => {
    const data = await Session.list("-created_date");
    setSessions(data);
  };

  const loadUserPreferences = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const defaultMode = currentUser.mode_override || "auto";
      if (defaultMode !== "auto") {
        setMode(defaultMode);
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };

  const determineMode = (message, userModeOverride) => {
    // If user has set a specific mode preference, use it
    if (userModeOverride && userModeOverride !== "auto") {
      return userModeOverride;
    }

    // Auto mode: determine based on message content
    const lowerMessage = message.toLowerCase();

    // Task mode indicators
    const taskKeywords = ['create', 'build', 'make', 'plan', 'checklist', 'steps', 'how to', 'template', 'schedule'];
    if (taskKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'task';
    }

    // ACE mode indicators
    const aceKeywords = ['stuck', 'confused', 'motivation', 'push me', 'challenge', 'honest feedback'];
    if (aceKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'ace';
    }

    // Default to coach mode for general conversation
    return 'coach';
  };

  const startNewSession = async () => {
    // When starting a new session explicitly, use the current UI mode state
    const newSession = await Session.create({
      title: "New Conversation",
      mode: mode,
      messages: [],
      status: "active"
    });
    setCurrentSession(newSession);
    setMessages([]);
    setShowHistory(false);
  };

  const loadSession = async (session) => {
    setCurrentSession(session);
    setMessages(session.messages || []);
    setMode(session.mode); // Set the UI mode to the loaded session's mode
    setShowHistory(false);
  };

  const getSystemPrompt = (selectedMode) => {
    const basePrompt = `You are AceFlo — a companion built to help people turn confusion into clarity, and clarity into action.

Your voice is personal, grounded, and useful. You walk WITH the user, not talk AT them.

Core principles:
- Listen first, answer second
- Mirror back what matters
- Balance truth with encouragement
- Be direct when it matters, but always human
- A hand on the shoulder (support) + mirror for the mind (reflection) + push to act (momentum)

Remember: You're not about having all the answers. You're about helping them find their rhythm, map their path, and move with purpose.`;

    const modePrompts = {
      task: `${basePrompt}

TASK MODE (Clarity):
You deliver drop-in-ready assets — clear steps, focused action.
Protocol: Intent → Plan (≤5 bullets) → Deliverable → Next Move
Voice: Crisp, technical clarity. Get them moving.`,

      coach: `${basePrompt}

COACH MODE (Rhythm):
You help them find their rhythm — reframe chaos, define next moves.
Protocol: Mirror what you hear → Decision frame → 90-min action block → Micro-commitment
Voice: Steady, grounded, human. A conversation, not a lecture.`,

      ace: `${basePrompt}

ACE MODE (Progress):
You bring wit, edge, and momentum while staying useful.
Protocol: Read the situation → Make the move → Explain why it wins
Voice: Candid, motivational, playful yet focused. Push them forward.`
    };

    return modePrompts[selectedMode];
  };

  // Semantic similarity check: returns the most similar existing goal or null
  const findSimilarExistingGoal = async (detectedGoalText) => {
    if (!detectedGoalText || detectedGoalText.length < 3) return null;
    try {
      const existingGoals = await ProgressEntity.filter({ status: ["planning", "active", "blocked"] });
      if (!existingGoals.length) return null;

      const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      const detectedWords = new Set(normalize(detectedGoalText));

      let bestMatch = null;
      let bestScore = 0;

      for (const goal of existingGoals) {
        const goalWords = new Set(normalize(goal.goal));
        const intersection = [...detectedWords].filter(w => goalWords.has(w)).length;
        const union = new Set([...detectedWords, ...goalWords]).size;
        const score = union > 0 ? intersection / union : 0;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = goal;
        }
      }

      // Threshold: 0.3 Jaccard similarity = meaningful overlap
      return bestScore >= 0.3 ? bestMatch : null;
    } catch (e) {
      console.error("Error in findSimilarExistingGoal:", e);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Determine the mode to use for this message based on user preference and message content
    const userModeOverride = user?.mode_override;
    const messageMode = determineMode(inputMessage, userModeOverride);

    // Create session if none exists
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      try {
        sessionToUse = await Session.create({
          title: inputMessage.substring(0, 50) + "...",
          mode: messageMode,
          messages: [],
          status: "active"
        });
        setCurrentSession(sessionToUse);
        setMode(messageMode);
      } catch (error) {
        console.error("Error creating session:", error);
        showToast("Failed to create session. Please try again.", "error");
        return;
      }
    }

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build personalized context from user profile
      let userContext = "";
      if (user?.pulse_summary) {
        userContext += `\n\nUser Profile (from Pulse):\n${user.pulse_summary}`;

        if (user.tone_preference) {
          userContext += `\nPreferred tone: ${user.tone_preference}`;
        }

        if (user.motivators && user.motivators.length > 0) {
          userContext += `\nMotivators: ${user.motivators.join(", ")}`;
        }

        if (user.blockers && user.blockers.length > 0) {
          userContext += `\nBlockers: ${user.blockers.join(", ")}`;
        }

        userContext += `\n\nUse this profile to personalize your response. Speak to their motivators, acknowledge their blockers, and match their preferred tone.`;
      }

      // Get AI response using the determined mode
      const prompt = `${getSystemPrompt(messageMode)}${userContext}

Previous conversation:
${updatedMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

User's latest message: "${userMessage.content}"

Respond as ACE.IO in ${messageMode.toUpperCase()} mode.

IMPORTANT: Also analyze if the user is expressing a goal or intention they want to achieve. If they are, include detection metadata in your response.`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            assistant_text: { type: "string" },
            goal_detected: { type: "boolean" },
            suggested_goal: { type: "string" },
            category: {
              type: "string",
              enum: ["health", "career", "learning", "financial", "relationships", "habit", "wellbeing", "personal", "creative", "other"]
            },
            cadence: {
              type: "object",
              properties: {
                times_per_week: { type: "number" },
                notes: { type: "string" }
              }
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            confidence: { type: "number" },
            suggestion_reason: { type: "string" }
          },
          required: ["assistant_text", "goal_detected"]
        }
      });

      let messageContent = response.assistant_text;

      // Check if we should suppress the GoalActionCard for this assistant message
      const shouldShowGoalCard = response.goal_detected && !suppressNextGoalCard;

      // Analytics: Log if suppression happened
      if (response.goal_detected && suppressNextGoalCard) {
        console.log('Analytics: goal_card_suppressed', {
          sessionId: sessionToUse?.id,
          messageId: (Date.now() + 1).toString(),
          reason: 'one_turn_suppression_after_action'
        });
      }

      // Clear suppression flag after this assistant message (one-turn suppression)
      if (suppressNextGoalCard) {
        setSuppressNextGoalCard(false);
      }

      // If goal detected and not suppressed, append the offer line
      if (shouldShowGoalCard && response.suggested_goal) {
        messageContent += "\n\nThat sounds like a goal. Want me to track it for you?";
      }

      const assistantMessage = {
        role: "assistant",
        content: messageContent,
        timestamp: new Date().toISOString(),
        id: (Date.now() + 1).toString(),
        goalData: shouldShowGoalCard ? response : null,
        showGoalCard: shouldShowGoalCard
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update session with the final messages and the actual mode used
      try {
        await Session.update(sessionToUse.id, {
          messages: finalMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          })), // Strip extra UI-specific fields before saving to session
          mode: messageMode, // Store the determined mode for this specific session
          title: finalMessages[0]?.content.substring(0, 50) + "..." || "Conversation"
        });
        loadSessions();
      } catch (error) {
        console.error("Error updating session:", error);
        // Don't block user experience for session update failures
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Failed to get response. Please try again.", "error");
      
      // Remove the user message if we failed
      setMessages(messages);
    }

    setIsLoading(false);
  };

  const handleGoalCreated = (messageId, goalId) => {
    // Log analytics event
    console.log('Analytics: Goal created from chat', { messageId, goalId, sessionId: currentSession?.id });

    // Remove the goal action card by clearing goalData from the message
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, goalData: null, showGoalCard: false, createdGoalId: goalId } : msg
      )
    );

    // Enable one-turn suppression to prevent duplicate cards
    setSuppressNextGoalCard(true);
  };

  const handleGoalDismissed = (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, showGoalCard: false } : msg
      )
    );

    // Enable one-turn suppression to prevent duplicate cards
    setSuppressNextGoalCard(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="glassmorphism border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">
                {currentSession?.title || "Start New Conversation"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <ModeSelector mode={mode} onModeChange={setMode} />
                {currentSession && (
                  <Badge variant="outline" className="text-secondary border-white/30">
                    {messages.length} messages
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                History
              </Button>
              <Button
                onClick={startNewSession}
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Context Banner (when jumping from Goal) */}
        <AnimatePresence>
          {contextBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glassmorphism border-b border-white/10 px-6 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">
                  Jumped to message linked with{" "}
                  <a
                    href={`/Goals?goalId=${contextBanner.goalId}`}
                    className="text-primary font-medium hover:underline"
                    onClick={() => console.log('Analytics: banner_link_to_goal', { goalId: contextBanner.goalId })}
                  >
                    {contextBanner.goalTitle}
                  </a>
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setContextBanner(null)}
                  className="text-secondary hover:text-primary h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.length === 0 && !currentSession && (
              <WelcomeMessage />
            )}

            {messages.map((message, index) => {
              const isHighlighted = highlightedMessageId === message.id;

              return (
                <div
                  key={message.id || index}
                  ref={el => { if (message.id) messageRefs.current[message.id] = el; }}
                  className={`transition-all duration-300 ${
                    isHighlighted ? 'ring-2 ring-white/50 rounded-2xl p-2 glow' : ''
                  }`}
                >
                  <ChatMessage
                    message={message}
                    mode={mode}
                  />
                  {message.goalData && message.showGoalCard !== false && (
                    <GoalActionCard
                      goalData={message.goalData}
                      messageId={message.id}
                      sessionId={currentSession?.id}
                      onDismiss={() => handleGoalDismissed(message.id)}
                      onCreated={(goalId) => handleGoalCreated(message.id, goalId)}
                    />
                  )}
                  {message.createdGoalId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glassmorphism rounded-xl p-4 mt-2 border-2 border-green-400/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-primary font-medium">Goal created successfully!</p>
                        </div>
                        <a
                          href={`/Goals?goalId=${message.createdGoalId}`}
                          className="text-sm text-primary hover:text-secondary underline flex items-center gap-1"
                          onClick={() => console.log('Analytics: deep_link_view_goal', { goalId: message.createdGoalId, from: 'chat' })}
                        >
                          View Goal →
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 glassmorphism rounded-xl p-4"
            >
              <Bot className="w-5 h-5 text-primary" />
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{backgroundColor: 'var(--color-text-primary)'}} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s', backgroundColor: 'var(--color-text-primary)'}} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s', backgroundColor: 'var(--color-text-primary)'}} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="glassmorphism border-t border-white/10 p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="glassmorphism border-white/30 text-primary placeholder:text-tertiary min-h-[80px] resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="glassmorphism border-white/30 text-primary hover:glow px-6 py-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Session History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <SessionHistory
            sessions={sessions}
            currentSession={currentSession}
            onSessionSelect={loadSession}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}