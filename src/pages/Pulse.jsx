import React, { useState } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Activity, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const PULSE_QUESTIONS = [
  {
    id: 1,
    type: "textarea",
    question: "What do you think about the most when you're alone?",
    helper: "Write what loops in your head most days.",
    placeholder: "Describe the thoughts that show up again and again…",
    minChars: 300
  },
  {
    id: 2,
    type: "textarea",
    question: "When you picture your 'best self,' what are they doing?",
    helper: "Describe actions, not titles.",
    placeholder: "Paint the scene of a day in that person's life…",
    minChars: 300
  },
  {
    id: 3,
    type: "textarea",
    question: "What do you worry people don't understand about you?",
    helper: "Share what you wish others would see.",
    placeholder: "If they really knew me, they'd know that…",
    minChars: 300
  },
  {
    id: 4,
    type: "textarea",
    question: "If you could change one habit tomorrow, what would it be?",
    helper: "Pick one. Why that one?",
    placeholder: "The habit I'd change first is… because…",
    minChars: 300
  },
  {
    id: 5,
    type: "textarea",
    question: "What do you want more of in your life right now?",
    helper: "Be specific (time, health, money, focus, peace…).",
    placeholder: "Right now, I want more…",
    minChars: 300
  },
  {
    id: 6,
    type: "textarea",
    question: "What drains you or causes friction?",
    helper: "What drains you or causes friction?",
    placeholder: "I want less…",
    minChars: 300
  },
  {
    id: 7,
    type: "textarea",
    question: "Who or what makes you feel the most alive?",
    helper: "Moments, people, places, work — describe the feeling.",
    placeholder: "I feel most alive when…",
    minChars: 300
  },
  {
    id: 8,
    type: "textarea",
    question: "What do you often say 'yes' to when you wish you'd said 'no'?",
    helper: "Boundaries you want to strengthen.",
    placeholder: "I usually say yes to… but I wish I'd said no because…",
    minChars: 300
  },
  {
    id: 9,
    type: "textarea",
    question: "If life was a game, what level are you on right now — and why?",
    helper: "Use the metaphor to explain progress and obstacles.",
    placeholder: "I'm on level… because…",
    minChars: 300
  },
  {
    id: 10,
    type: "textarea",
    question: "What do you hope AceFlo helps you with most?",
    helper: "If we nailed one thing in 30 days, what would it be?",
    placeholder: "Over the next 30 days, I want AceFlo to help me…",
    minChars: 300
  }
];

export default function PulsePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < PULSE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const startPulse = () => {
    setShowIntro(false);
  };

  const generateAnalysis = async () => {
    setIsGenerating(true);
    
    const answersText = PULSE_QUESTIONS.map((q) => 
      `${q.question}\nAnswer: ${answers[q.id] || 'Not answered'}`
    ).join('\n\n');

    const prompt = `You are ACE.IO analyzing a user's Pulse responses. These are deep, reflective questions designed to help you understand the person at their core.

User Responses:
${answersText}

Based on these deeply personal responses, provide:

1. **WHAT I SEE** (3-4 sentences)
Mirror back their inner world clearly and compassionately

2. **THE DEEPER PATTERN**
What's really going on beneath the surface

3. **YOUR STRENGTHS**
The capabilities and qualities I see in their answers

4. **WHAT NEEDS ATTENTION**
The areas where growth or change would serve them most

5. **FIRST MOVE**
One specific, actionable step they can take this week

6. **MODE RECOMMENDATION**
Which ACE.IO mode (Task/Coach/ACE) would serve them best right now and why

Additionally, extract structured profile data:
- tone_preference: How they want to be spoken to (direct, gentle, motivational, etc.)
- motivators: 3-5 key things that drive them
- blockers: 3-5 key things that hold them back
- pulse_summary: A 2-sentence synthesis of who they are and what they need

Keep it useful, not performative. Write as ACE.IO - direct, grounded, deeply attentive. Show them you truly listened.`;

    try {
      const response = await InvokeLLM({ 
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            analysis_text: { type: "string" },
            tone_preference: { type: "string" },
            motivators: {
              type: "array",
              items: { type: "string" }
            },
            blockers: {
              type: "array",
              items: { type: "string" }
            },
            pulse_summary: { type: "string" }
          },
          required: ["analysis_text", "tone_preference", "motivators", "blockers", "pulse_summary"]
        }
      });

      setAnalysis(response.analysis_text);
      
      // Save profile insights to User
      try {
        await User.updateMyUserData({
          tone_preference: response.tone_preference,
          motivators: response.motivators,
          blockers: response.blockers,
          pulse_summary: response.pulse_summary,
          pulse_completed_date: new Date().toISOString()
        });
        setProfileUpdated(true);
      } catch (error) {
        console.error("Error updating user profile:", error);
      }

      setShowResults(true);
    } catch (error) {
      console.error("Error generating analysis:", error);
    }
    
    setIsGenerating(false);
  };

  const resetPulse = () => {
    setShowIntro(true);
    setCurrentQuestion(0);
    setAnswers({});
    setAnalysis(null);
    setShowResults(false);
    setProfileUpdated(false);
  };

  // Intro Screen
  if (showIntro) {
    return (
      <div className="h-screen overflow-y-auto">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-2xl p-8 max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center glow">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Pulse</h1>
                <p className="text-sm text-secondary">Reflection. Clarity. Rhythm.</p>
              </div>
            </div>

            <div className="text-secondary mb-8 space-y-4 leading-relaxed">
              <p>
                To walk with you, I need to understand you. These aren't quick questions — they're a mirror for your mind.
              </p>
              <p>
                Take your time. Be honest. The more you share, the better I can listen, reflect, and guide you forward.
              </p>
              <p className="text-sm text-tertiary">
                Takes ~8–12 minutes. Your answers are private and help me tune to your rhythm.
              </p>
            </div>

            <Button
              onClick={startPulse}
              className="glassmorphism border-white/30 text-primary hover:glow w-full"
            >
              Begin Pulse
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / PULSE_QUESTIONS.length) * 100;
  const question = PULSE_QUESTIONS[currentQuestion];
  const currentAnswer = answers[question.id] || "";
  const meetsMinChars = currentAnswer.length >= (question.minChars || 0);
  const canProceed = currentAnswer.trim() !== "" && meetsMinChars;

  // Results Screen
  if (showResults) {
    return (
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-2xl p-8 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center glow">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">I see you.</h1>
                <p className="text-secondary">
                  From here on, I walk with you — tuned to what matters most.
                </p>
              </div>
            </div>

            {profileUpdated && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphism rounded-xl p-4 mb-6 border-2 border-green-400/30"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-primary font-medium">Profile Updated</p>
                    <p className="text-sm text-secondary">
                      Ace now knows you better. Every conversation will be more personal.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="glassmorphism rounded-xl p-6 mb-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-primary whitespace-pre-wrap">{analysis}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={resetPulse}
                variant="outline"
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                Take Again
              </Button>
              <Button
                onClick={() => window.location.href = "/Chat"}
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                Let's Move Forward
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Questions Flow
  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center glow">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Pulse</h1>
              <p className="text-secondary">Understanding you at your core</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-tertiary">
              <span>Question {currentQuestion + 1} of {PULSE_QUESTIONS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="glassmorphism rounded-2xl p-8 max-w-2xl mx-auto mb-6"
        >
          <h2 className="text-xl font-semibold text-primary mb-2">
            {question.question}
          </h2>
          
          {question.helper && (
            <p className="text-sm text-tertiary mb-6">{question.helper}</p>
          )}

          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="glassmorphism border-white/30 text-primary placeholder:text-tertiary min-h-[200px]"
          />
          
          {question.minChars && (
            <div className="mt-2 text-sm text-tertiary">
              {currentAnswer.length}/{question.minChars} characters minimum
              {!meetsMinChars && currentAnswer.length > 0 && (
                <span className="text-orange-400 ml-2">
                  (Keep going - share more detail)
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            variant="outline"
            className="glassmorphism border-white/30 text-primary hover:glow disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestion === PULSE_QUESTIONS.length - 1 ? (
            <Button
              onClick={generateAnalysis}
              disabled={!canProceed || isGenerating}
              className="glassmorphism border-white/30 text-primary hover:glow"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  Complete Pulse
                  <Activity className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="glassmorphism border-white/30 text-primary hover:glow disabled:opacity-50"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}