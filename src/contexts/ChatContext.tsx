import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { MessagesRow, ProfilesRow } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define the shape of a message with sender info (optional)
export interface ChatMessage extends MessagesRow {
  senderProfile?: Pick<ProfilesRow, 'id' | 'full_name' | 'avatar_url'>; // Include basic sender info
}

// Define the context type
interface ChatContextType {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  adminUser: ProfilesRow | null; // Store the admin user info
  sendMessage: (messageText: string | null, imageUrl?: string | null) => Promise<boolean>; // Modified sendMessage
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [adminUser, setAdminUser] = useState<ProfilesRow | null>(null); // State for admin user
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);

  // Function to find the first admin user
  const findAdmin = useCallback(async (): Promise<ProfilesRow | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single(); // Assuming only one primary admin for now

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn("No admin user found in profiles table.");
          return null;
        }
        throw error;
      }
      return data as ProfilesRow;
    } catch (error) {
      console.error("Error finding admin user:", error);
      toast.error("خطأ في العثور على حساب المسؤول.");
      return null;
    }
  }, []);

  // Fetch admin user on mount
  useEffect(() => {
    findAdmin().then(setAdminUser);
  }, [findAdmin]);

  // Function to fetch messages between current user and admin
  const fetchMessages = useCallback(async () => {
    if (!currentUser || !adminUser) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${adminUser.id}),and(sender_id.eq.${adminUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(`خطأ في جلب الرسائل: ${(error as Error).message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser, adminUser]);

  // Fetch initial messages
  useEffect(() => {
    if (currentUser && adminUser) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentUser, adminUser, fetchMessages]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!currentUser || !adminUser) {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      return;
    }

    const userIds = [currentUser.id, adminUser.id].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;

    if (messagesChannelRef.current && messagesChannelRef.current.topic !== channelName) {
       supabase.removeChannel(messagesChannelRef.current).then(() => console.log("Removed previous channel"));
       messagesChannelRef.current = null;
    }

    if (!messagesChannelRef.current) {
      console.log(`Attempting to subscribe to ${channelName}`);
      const channel = supabase
        .channel(channelName)
        .on<MessagesRow>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            // Reverted Filter: Specific to the two participants
            filter: `or(and(sender_id=eq.${currentUser.id},receiver_id=eq.${adminUser.id}),and(sender_id=eq.${adminUser.id},receiver_id=eq.${currentUser.id}))`
          },
          (payload) => {
            console.log('Realtime message payload:', payload);
            const newMessage = payload.new as ChatMessage;

            // Play notification sound only if the current user is the receiver
            if (newMessage.receiver_id === currentUser?.id) {
              try {
                const audio = new Audio('/notification.mp3'); // Ensure this path is correct
                audio.play().catch(e => console.warn("Audio play failed (likely browser restriction):", e));
              } catch (e) {
                console.error("Failed to create or play notification sound:", e);
              }
            }

            setMessages((prevMessages) => {
              if (prevMessages.some(msg => msg.id === newMessage.id)) {
                return prevMessages; // Avoid duplicates
              }
              console.log('Adding new message via realtime:', newMessage);
              return [...prevMessages, newMessage];
            });
          }
        )
        .subscribe((status, err) => {
           if (status === 'SUBSCRIBED') { console.log(`Realtime subscribed to ${channelName}`); }
           else if (status === 'CHANNEL_ERROR') { console.error(`Realtime channel error on ${channelName}:`, err); toast.error("خطأ في اتصال الشات اللحظي."); }
           else if (status === 'TIMED_OUT') { console.warn(`Realtime channel timed out on ${channelName}`); }
           else { console.log(`Realtime channel status on ${channelName}: ${status}`); }
        });
      messagesChannelRef.current = channel;
    }

    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
        console.log(`Realtime unsubscribed from ${channelName}`);
      }
    };
  }, [currentUser, adminUser]);

  // Function to send a message (text or image)
  const sendMessage = async (messageText: string | null, imageUrl: string | null = null): Promise<boolean> => {
    if (!currentUser || !adminUser) return false;
    if (!messageText?.trim() && !imageUrl) return false;

    const newMessageData: MessagesRow['Insert'] = {
      sender_id: currentUser.id,
      receiver_id: adminUser.id,
      message_text: messageText ? messageText.trim() : null,
      image_url: imageUrl,
    };

    try {
      const { error } = await supabase.from('messages').insert(newMessageData);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(`خطأ في إرسال الرسالة: ${(error as Error).message}`);
      return false;
    }
  };

  const contextValue: ChatContextType = {
    messages,
    isLoadingMessages,
    adminUser,
    sendMessage,
    refreshMessages: fetchMessages,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use ChatContext
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("يجب استخدام useChat داخل ChatProvider");
  }
  return context;
};
