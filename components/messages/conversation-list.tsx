'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, MessageSquare } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  userId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationList({
  userId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, [userId]);

  const fetchConversations = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:profiles!conversations_participant_1_id_fkey(id, full_name, email),
          participant_2:profiles!conversations_participant_2_id_fkey(id, full_name, email),
          listing:listings(id, title),
          booking:bookings(id, start_date, end_date)
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (data) {
        const conversationsWithUnread = await Promise.all(
          data.map(async (conv: any) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId)
              .is('read_at', null);

            return { ...conv, unread_count: count || 0 };
          })
        );

        setConversations(conversationsWithUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1_id=eq.${userId},participant_2_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participant_1_id === userId
      ? conversation.participant_2
      : conversation.participant_1;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = conversation.id === selectedConversationId;

        return (
          <Card
            key={conversation.id}
            className={cn(
              'cursor-pointer transition-colors hover:bg-accent',
              isSelected && 'bg-accent border-primary'
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(otherParticipant.full_name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium truncate">{otherParticipant.full_name}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {conversation.listing && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Re: {conversation.listing.title}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message_content || 'No messages yet'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="ml-2 shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
