import React from "react";
import { motion } from "framer-motion";
import { User, Zap, Target, Settings } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message, mode }) {
  const isUser = message.role === "user";

  const getModeIcon = () => {
    const icons = {
      task: Settings,
      coach: Target,
      ace: Zap
    };
    return icons[mode] || Target;
  };

  const ModeIcon = getModeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-3 max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 glassmorphism rounded-xl flex items-center justify-center ${
          isUser ? '' : 'glow'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-primary" />
          ) : (
            <ModeIcon className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Message Content */}
        <div className={`glassmorphism rounded-2xl px-6 py-4 ${
          isUser ? 'rounded-tr-md' : 'rounded-tl-md'
        }`}>
          <div className={`prose prose-invert max-w-none ${isUser ? 'text-right' : ''}`}>
            {isUser ? (
              <p className="text-primary m-0 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-primary [&>p]:m-0 [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2"
                components={{
                  p: ({ children }) => <p className="text-primary mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="text-primary ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="text-primary ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="text-primary mb-1">{children}</li>,
                  h3: ({ children }) => <h3 className="text-primary text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
                  strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-tertiary mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {format(new Date(message.timestamp), 'HH:mm')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}