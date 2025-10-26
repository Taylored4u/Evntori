'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/messages/conversation-list';
import { MessageThread } from '@/components/messages/message-thread';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Loader as Loader2 } from 'lucide-react';

export default function MessagesPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/auth/login?redirect=/messages');
    }
  }, [profile, loading, router]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setShowThread(true);
    }
  }, [searchParams]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowThread(true);
    router.push(`/messages?conversation=${conversationId}`, { scroll: false });
  };

  const handleBack = () => {
    setShowThread(false);
    router.push('/messages', { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-6">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className={`lg:col-span-1 ${showThread ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full overflow-hidden">
              <CardContent className="p-0 h-full overflow-y-auto">
                <ConversationList
                  userId={profile.id}
                  selectedConversationId={selectedConversationId || undefined}
                  onSelectConversation={handleSelectConversation}
                />
              </CardContent>
            </Card>
          </div>

          <div className={`lg:col-span-2 ${showThread ? 'block' : 'hidden lg:block'}`}>
            {selectedConversationId ? (
              <MessageThread
                conversationId={selectedConversationId}
                userId={profile.id}
                onBack={handleBack}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
