
import React from "react";
import { motion } from "framer-motion";
import { X, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function SessionHistory({ sessions, currentSession, onSessionSelect, onClose }) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 glassmorphism border-l border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Session History</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-secondary hover:text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session)}
            className={`w-full text-left glassmorphism rounded-xl p-4 transition-all duration-200 hover:glow ${
              currentSession?.id === session.id ? 'glow ring-1 ring-white/30' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-primary truncate flex-1">
                {session.title}
              </h4>
              <Badge 
                variant="outline" 
                className="text-xs border-white/30 text-secondary ml-2"
              >
                {session.mode}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-tertiary">
              <MessageCircle className="w-3 h-3" />
              <span>{session.messages?.length || 0} messages</span>
              <Calendar className="w-3 h-3 ml-auto" />
              <span>{format(new Date(session.created_date), 'MMM d')}</span>
            </div>
          </button>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-tertiary">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Start a conversation to begin</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
