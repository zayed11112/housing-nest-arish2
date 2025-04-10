import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

// Define structure for a conversation summary
interface ConversationSummary {
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
  lastMessageText: string | null;
  lastMessageTimestamp: string | null;
  unreadCount: number; // Add unread count
}

const AdminChatsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth } = useApp();
  const { currentUser } = auth;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch conversations for the admin
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      setIsLoading(true);
      try {
        // 1. Get distinct user IDs the admin has chatted with
        const { data: userIdsData, error: userIdsError } = await supabase
          .rpc('get_distinct_chat_partners', { admin_id: currentUser.id });

        if (userIdsError) throw userIdsError;

        if (!userIdsData || userIdsData.length === 0) {
          setConversations([]);
          return;
        }

        const partnerIds = userIdsData.map((row: any) => row.partner_id);

        // 2. Fetch profile info for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', partnerIds);

        if (profilesError) throw profilesError;
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

        // 3. Fetch last message for each conversation (this is less efficient, consider optimizing later)
        const conversationSummaries = await Promise.all(
          partnerIds.map(async (userId: string) => {
            const { data: lastMsgData, error: lastMsgError } = await supabase
              .from('messages')
              .select('message_text, created_at')
              .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // TODO: Implement unread count logic later
            const unreadCount = 0; 
            const profile = profilesMap.get(userId);

            return {
              userId: userId,
              userName: profile?.full_name || 'مستخدم غير معروف',
              avatarUrl: profile?.avatar_url || null,
              lastMessageText: lastMsgError ? null : lastMsgData?.message_text,
              lastMessageTimestamp: lastMsgError ? null : lastMsgData?.created_at,
              unreadCount: unreadCount,
            };
          })
        );

        // Sort conversations by last message timestamp (descending)
        conversationSummaries.sort((a, b) => {
          if (!a.lastMessageTimestamp) return 1;
          if (!b.lastMessageTimestamp) return -1;
          return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
        });


        setConversations(conversationSummaries);

      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("حدث خطأ أثناء جلب المحادثات.");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchConversations();
      // TODO: Add Realtime listener for new messages to update summaries/unread counts
    }
  }, [currentUser]);

  // Helper to get initials
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';
    // Add more sophisticated formatting later (e.g., "Yesterday", "5m ago")
    return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  };


  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideBottomNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">جميع الشاتات</h1>
        <div className="w-9 h-9"></div> {/* Placeholder for spacing */}
      </div>

      {/* Page Content */}
      <div className="mt-16">
        {isLoading ? (
           <div className="space-y-1 p-2">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
           </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10 mt-10">
             <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
             <p className="mt-2 text-muted-foreground">لا توجد محادثات لعرضها.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((convo) => (
              <button
                key={convo.userId}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-right"
                onClick={() => navigate(`/chat?userId=${convo.userId}`)} // Navigate to specific chat
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.avatarUrl || undefined} alt={convo.userName || 'User'} />
                  <AvatarFallback>{getInitials(convo.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate">{convo.userName}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(convo.lastMessageTimestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessageText || '...'}
                    </p>
                    {/* Add unread count badge later */}
                    {/* {convo.unreadCount > 0 && (
                      <Badge className="h-5 px-1.5 text-xs">{convo.unreadCount}</Badge>
                    )} */}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminChatsListPage;
