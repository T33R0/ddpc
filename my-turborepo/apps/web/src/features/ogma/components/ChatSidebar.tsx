'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChatSessions, deleteChatSession } from '../actions';
import { format } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  refreshTrigger: number; // Used to force reload list
}

export function ChatSidebar({ currentSessionId, onSelectSession, isOpen, setIsOpen, refreshTrigger }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      await deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        onSelectSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r border-white/10 bg-[#0a0a0a] transition-all duration-300 relative z-20 h-screen pt-20", // Added pt-20 to account for fixed header
        isOpen ? "w-64" : "w-16"
      )}
    >
        {/* Toggle Button - positioned absolutely to be visible even when collapsed */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-24 z-50 p-1 rounded-full bg-neutral-800 border border-neutral-700 text-white/70 hover:text-white"
        >
            {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

      <div className="p-4">
        <Button
          onClick={() => onSelectSession(null)}
          variant="outline"
          className={cn(
            "w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all text-white/70",
            !isOpen && "px-2"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isOpen && "New Chat"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all cursor-pointer",
                currentSessionId === session.id
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />

              {isOpen && (
                <>
                  <div className="flex-1 truncate text-xs font-medium">
                    {session.title !== 'New Conversation' ? session.title : format(new Date(session.created_at), 'MMM d, h:mm a')}
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}

          {sessions.length === 0 && !loading && isOpen && (
            <div className="px-4 py-8 text-center text-xs text-neutral-500">
              No past conversations
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
