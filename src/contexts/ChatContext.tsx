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
  adminUser: ProfilesRow | null; // Still useful for non-admins
  activeChatPartnerId: string | null; // ID of the user being chatted with
  setActiveChatPartner: (userId: string | null) => void; // Function to set the partner
  sendMessage: (messageText: string | null, imageUrl?: string | null) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [adminUser, setAdminUser] = useState<ProfilesRow | null>(null);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null); // State for active chat partner
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);

  // Function to find the first admin user (still needed for non-admins)
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

  // Function to set the active chat partner
  const setActiveChatPartner = useCallback((userId: string | null) => {
    console.log("Setting active chat partner:", userId);
    setActiveChatPartnerId(userId);
    // Clear messages when partner changes
    setMessages([]);
  }, []);

  // Function to fetch messages between current user and the active partner
  const fetchMessages = useCallback(async () => {
    // Determine the partner ID: if admin, use activeChatPartnerId; if user, use adminUser.id
    const partnerId = currentUser?.role === 'admin' ? activeChatPartnerId : adminUser?.id;

    if (!currentUser || !partnerId) {
      setMessages([]);
      return;
    }

    console.log(`Fetching messages between ${currentUser.id} and ${partnerId}`);
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
      console.log(`Fetched ${data?.length || 0} messages`);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(`خطأ في جلب الرسائل: ${(error as Error).message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser, adminUser, activeChatPartnerId]); // Depend on active partner

  // Fetch messages when the active partner changes (or admin/user loads)
  useEffect(() => {
    // Determine the partner ID based on role
    const partnerId = currentUser?.role === 'admin' ? activeChatPartnerId : adminUser?.id;

    if (currentUser && partnerId) {
      fetchMessages();
    } else {
      setMessages([]); // Clear messages if no user or partner
    }
  }, [currentUser, adminUser, activeChatPartnerId, fetchMessages]);

  // Setup Realtime subscription based on active partner
  useEffect(() => {
    // Determine the partner ID
    const partnerId = currentUser?.role === 'admin' ? activeChatPartnerId : adminUser?.id;

    if (!currentUser || !partnerId) {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      return;
    }

    // Ensure consistent channel naming regardless of who is sender/receiver
    const userIds = [currentUser.id, partnerId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;

    // If channel exists but topic is wrong (partner changed), remove old one
    if (messagesChannelRef.current && messagesChannelRef.current.topic !== channelName) {
       supabase.removeChannel(messagesChannelRef.current).then(() => console.log("Removed previous channel due to partner change"));
       messagesChannelRef.current = null;
    }

    // Subscribe if channel doesn't exist for this pair
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
            // Filter for messages between the two specific participants
            filter: `or(and(sender_id=eq.${currentUser.id},receiver_id=eq.${partnerId}),and(sender_id=eq.${partnerId},receiver_id=eq.${currentUser.id}))`
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

  // Function to send a message (text or image) to the active partner
  const sendMessage = async (messageText: string | null, imageUrl: string | null = null): Promise<boolean> => {
    // Determine the partner ID
    const partnerId = currentUser?.role === 'admin' ? activeChatPartnerId : adminUser?.id;

    if (!currentUser || !partnerId) {
      toast.error("لا يمكن إرسال الرسالة. المستخدم أو الطرف الآخر غير محدد.");
      return false;
    }
    if (!messageText?.trim() && !imageUrl) return false; // Don't send empty messages

    const newMessageData: MessagesRow['Insert'] = {
      sender_id: currentUser.id,
      receiver_id: partnerId, // Send to the active partner
      message_text: messageText ? messageText.trim() : null,
      image_url: imageUrl,
    };

    try {
      const { error } = await supabase.from('messages').insert(newMessageData);
      if (error) throw error;
      return true; // Indicate success
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(`خطأ في إرسال الرسالة: ${(error as Error).message}`);
      return false; // Indicate failure
    }
  };

  const contextValue: ChatContextType = {
    messages,
    isLoadingMessages,
    adminUser,
    activeChatPartnerId, // Expose active partner ID
    setActiveChatPartner, // Expose setter function
    sendMessage,
    refreshMessages: fetchMessages, // Refresh fetches for the active partner
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
