'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createChatSession(title?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('ogma_chat_sessions')
    .insert({
      user_id: user.id,
      title: title || 'New Conversation',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating chat session:', error);
    throw new Error('Failed to create chat session');
  }

  revalidatePath('/admin/ogma');
  return data.id;
}

export async function getChatSessions(includeArchived: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get sessions with their first message for preview
  let query = supabase
    .from('ogma_chat_sessions')
    .select(`
      *,
      ogma_chat_messages (
        content,
        role,
        created_at
      )
    `)
    .eq('user_id', user.id);

  // Filter by archived status
  if (!includeArchived) {
    query = query.eq('archived', false);
  } else {
    query = query.eq('archived', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }

  // Process to add snippet from first user message
  return data.map((session: any) => {
    const messages = session.ogma_chat_messages || [];
    const firstUserMessage = messages.find((m: any) => m.role === 'user');
    const snippet = firstUserMessage 
      ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      : null;
    
    return {
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      archived: session.archived || false,
      snippet,
    };
  });
}

export async function getChatMessages(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify ownership implicitly via RLS
  const { data, error } = await supabase
    .from('ogma_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data;
}

export async function archiveChatSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('ogma_chat_sessions')
    .update({ archived: true })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error archiving chat session:', error);
    throw new Error('Failed to archive chat session');
  }

  revalidatePath('/admin/ogma');
}

export async function restoreChatSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('ogma_chat_sessions')
    .update({ archived: false })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error restoring chat session:', error);
    throw new Error('Failed to restore chat session');
  }

  revalidatePath('/admin/ogma');
}

export async function deleteChatSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('ogma_chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting chat session:', error);
    throw new Error('Failed to delete chat session');
  }

  revalidatePath('/admin/ogma');
}
