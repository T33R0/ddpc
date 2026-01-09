'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Archive, ArchiveRestore, ChevronDown, ChevronUp } from 'lucide-react';
import { getChatSessions, deleteChatSession, archiveChatSession, restoreChatSession } from '../actions';
import { format } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  snippet?: string | null;
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
  const [archivedSessions, setArchivedSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveExpanded, setArchiveExpanded] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [activeData, archivedData] = await Promise.all([
        getChatSessions(false),
        getChatSessions(true)
      ]);
      setSessions(activeData);
      setArchivedSessions(archivedData);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await archiveChatSession(id);
      await loadSessions();
      if (currentSessionId === id) {
        onSelectSession(null);
      }
    } catch (err) {
      console.error('Failed to archive session', err);
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await restoreChatSession(id);
      await loadSessions();
    } catch (err) {
      console.error('Failed to restore session', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, isArchived: boolean = false) => {
    e.stopPropagation();
    const confirmMessage = isArchived 
      ? 'Are you sure you want to permanently delete this chat? This action cannot be undone.'
      : 'Are you sure you want to delete this chat?';
    
    if (!confirm(confirmMessage)) return;

    try {
      await deleteChatSession(id);
      await loadSessions();
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
        "flex flex-col border-r border-border bg-background transition-all duration-300 relative z-20 h-screen pt-20 shrink-0 overflow-hidden",
        isOpen ? "w-56 md:w-64" : "w-12 md:w-16"
      )}
    >
        {/* Toggle Button - positioned absolutely to be visible even when collapsed */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-24 z-50 p-1 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground"
        >
            {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

      <div className="p-4">
        <Button
          onClick={() => onSelectSession(null)}
          variant="outline"
          className={cn(
            "w-full",
            !isOpen && "px-2"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isOpen && "New Chat"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 min-h-0">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group relative flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-2 md:py-3 text-sm transition-all cursor-pointer border",
                currentSessionId === session.id
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
              )}
            >
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4 shrink-0" />

              {isOpen && (
                <>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="truncate text-[11px] md:text-xs font-medium">
                      {session.title !== 'New Conversation' ? session.title : format(new Date(session.created_at), 'MMM d, h:mm a')}
                    </div>
                    {session.snippet && (
                      <div className="truncate text-[10px] text-muted-foreground mt-0.5">
                        {session.snippet}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => handleArchive(e, session.id)}
                      className="p-1 hover:text-foreground transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {sessions.length === 0 && !loading && isOpen && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No past conversations
            </div>
          )}
        </div>

        {/* Archive Section - Fixed at bottom */}
        {isOpen && archivedSessions.length > 0 && (
          <div className="mt-auto border-t border-border pt-2 pb-2">
            <button
              onClick={() => setArchiveExpanded(!archiveExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3 h-3" />
                <span>Archived ({archivedSessions.length})</span>
              </div>
              {archiveExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {archiveExpanded && (
              <div className="space-y-1 mt-1">
                {archivedSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "group relative flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-2 text-sm transition-all cursor-pointer border border-transparent",
                      currentSessionId === session.id
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="truncate text-[11px] md:text-xs font-medium">
                        {session.title !== 'New Conversation' ? session.title : format(new Date(session.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleRestore(e, session.id)}
                        className="p-1 hover:text-foreground transition-colors"
                        title="Restore"
                      >
                        <ArchiveRestore className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, session.id, true)}
                        className="p-1 hover:text-destructive transition-colors"
                        title="Delete Forever"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
