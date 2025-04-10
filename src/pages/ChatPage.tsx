import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, RefreshCw, UserCircle, Paperclip, Image as ImageIcon, Loader2, MessageSquare } from 'lucide-react'; // Added icons
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { ProfilesRow, MessagesRow } from '@/types/database';
import { ChatMessage } from '@/contexts/ChatContext';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

const imgbbApiKey = "d4c80caf18ac57a20be196713f4245c2"; // Your ImgBB API Key

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auth, isLoading: isAppLoading } = useApp();
  const { currentUser } = auth;

  const adminChatTargetUserId = searchParams.get('userId');

  const [targetUser, setTargetUser] = useState<ProfilesRow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false); // State for image upload
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // Determine the target user
  useEffect(() => {
    const determineTargetUser = async () => {
      if (!currentUser) return;
      setIsLoadingMessages(true);

      let targetId: string | null = null;

      if (currentUser.role === 'admin' && adminChatTargetUserId) {
        targetId = adminChatTargetUserId;
      } else if (currentUser.role !== 'admin') {
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .single();
          if (adminError && adminError.code !== 'PGRST116') throw adminError;
          targetId = adminData?.id || null;
          if (!targetId) console.warn("No admin user found.");
        } catch (error) { console.error("Error fetching default admin profile:", error); }
      } else {
        navigate('/admin/chats');
        return;
      }

      if (targetId) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetId)
            .single();
          if (profileError) throw profileError;
          setTargetUser(profileData as ProfilesRow);
        } catch (error) {
          console.error("Error fetching target user profile:", error);
          toast.error("لا يمكن تحميل بيانات المستخدم للشات.");
        }
      } else if (currentUser.role !== 'admin') {
         toast.error("لا يوجد مسؤول متاح للشات حالياً.");
         setTargetUser(null);
      }
    };
    determineTargetUser();
  }, [currentUser, adminChatTargetUserId, navigate]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
     if (!currentUser || !targetUser) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }
    console.log(`Fetching messages between ${currentUser.id} and ${targetUser.id}`);
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
      console.log(`Fetched ${data?.length || 0} messages.`);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(`خطأ في جلب الرسائل: ${(error as Error).message}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser, targetUser]);

  useEffect(() => {
    if (targetUser) { fetchMessages(); }
    else { setMessages([]); setIsLoadingMessages(false); }
  }, [targetUser, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
     if (!currentUser || !targetUser) {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      return;
    }

    const userIds = [currentUser.id, targetUser.id].sort();
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
            filter: `or(and(sender_id=eq.${currentUser.id},receiver_id=eq.${targetUser.id}),and(sender_id=eq.${targetUser.id},receiver_id=eq.${currentUser.id}))`
          },
          (payload) => {
            console.log('Realtime message payload:', payload);
            const newMessage = payload.new as ChatMessage;
            if (newMessage && ((newMessage.sender_id === currentUser.id && newMessage.receiver_id === targetUser.id) || (newMessage.sender_id === targetUser.id && newMessage.receiver_id === currentUser.id))) {
                setMessages((prevMessages) => {
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                    return prevMessages;
                }
                console.log('Adding new message via realtime:', newMessage);
                return [...prevMessages, newMessage];
                });
            } else {
                 console.log('Realtime message ignored (not for this specific chat pair):', newMessage);
            }
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
  }, [currentUser, targetUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Message (Text or Image URL)
  const sendMessageInternal = async (text: string | null, imageUrl: string | null = null) => {
    if (!currentUser || !targetUser) return false;
    if (!text && !imageUrl) return false; // Must have text or image

    const newMessageData: MessagesRow['Insert'] = {
      sender_id: currentUser.id,
      receiver_id: targetUser.id,
      message_text: text,
      image_url: imageUrl, // Add image_url
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

  // Text Send Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || isUploadingImage) return;

    const textToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    const success = await sendMessageInternal(textToSend.trim());
    if (!success) {
      setNewMessage(textToSend); // Restore text on failure
    } else {
      // If sending was successful, immediately fetch messages
      fetchMessages();
    }
    setIsSending(false);
  };

  // Image Upload Handler
  const handleImageUpload = async (file: File) => {
    if (!currentUser || !targetUser || isSending || isUploadingImage) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', imgbbApiKey);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`ImgBB upload failed: ${response.statusText}`);

      const data = await response.json();
      if (!data.success || !data.data?.url) {
        throw new Error('ImgBB upload failed: Invalid response data.');
      }

      const imageUrl = data.data.url; // Use the direct URL
      const success = await sendMessageInternal(null, imageUrl); // Send message with image URL

      if (success) {
        toast.success("تم إرسال الصورة بنجاح.");
      } else {
        toast.error("فشل إرسال رسالة الصورة.");
      }
    } catch (error) {
      console.error('Error uploading/sending image:', error);
      toast.error(`خطأ في تحميل الصورة: ${(error as Error).message}`);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // File Input Change Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Add validation if needed (size, type)
      if (!file.type.startsWith('image/')) {
         toast.error("يرجى اختيار ملف صورة فقط.");
         return;
      }
       if (file.size > 5 * 1024 * 1024) { // Example: 5MB limit
         toast.error("حجم الصورة كبير جداً (الحد الأقصى 5MB).");
         return;
      }
      handleImageUpload(file);
    }
  };


  // Helper to get initials
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    try { return format(new Date(timestamp), 'p', { locale: ar }); }
    catch { return ''; }
  };

  // Loading/Error States
   if (isAppLoading || !currentUser) {
    return <AppLayout hideBottomNav><div className="mt-16 p-4 text-center">جاري التحميل...</div></AppLayout>;
  }
  if (currentUser.role !== 'admin' && !targetUser && !isLoadingMessages) {
     return (
       <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center text-red-600">لا يوجد مسؤول متاح للمحادثة حالياً.</div>
       </AppLayout>
     );
  }
   if (currentUser.role === 'admin' && !targetUser && isLoadingMessages) {
     return (
       <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center">جاري تحميل بيانات المستخدم...</div>
       </AppLayout>
     );
   }
    if (currentUser.role === 'admin' && !targetUser && !isLoadingMessages) {
     return (
       <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center text-red-600">المستخدم المحدد غير موجود.</div>
       </AppLayout>
     );
   }


  return (
    <AppLayout hideBottomNav>
      {/* Header with enhanced styling */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm p-4 border-b border-border shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (currentUser?.role === 'admin') {
                navigate('/admin/chats');
              } else {
                navigate(-1);
              }
            }}
            className="hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {targetUser && (
            <div className="flex items-center gap-3 flex-1 justify-center">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={targetUser.avatar_url || undefined} alt={targetUser.full_name || 'User'} />
                <AvatarFallback className="text-lg">{getInitials(targetUser.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-lg">{targetUser.full_name || 'مستخدم'}</span>
                <span className="text-xs text-muted-foreground">
                  {targetUser.role === 'admin' ? 'مسؤول النظام' : 'مستخدم'}
                </span>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchMessages} 
            disabled={isLoadingMessages}
            className="hover:bg-muted/80"
          >
            <RefreshCw className={`h-5 w-5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Messages Area with enhanced styling */}
      <div className="fixed inset-0 top-[73px] bottom-[80px] bg-gradient-to-b from-background to-muted/30 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-4 py-4 px-4">
          {isLoadingMessages && messages.length === 0 && (
            <div className="space-y-6 p-4">
              <Skeleton className="h-12 w-3/4 mr-auto" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-3/4 mr-auto" />
            </div>
          )}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg">ابدأ المحادثة الآن...</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={msg.id || `msg-${index}`}
              className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.sender_id === currentUser?.id ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.sender_id === currentUser?.id
                    ? 'bg-muted rounded-bl-sm'
                    : 'bg-primary text-primary-foreground rounded-br-sm'
                }`}
              >
                {msg.image_url ? (
                  <div className="space-y-2">
                    <img
                      src={msg.image_url}
                      alt="Uploaded content"
                      className="max-w-full rounded-lg shadow-sm hover:brightness-110 transition-all cursor-zoom-in"
                      onClick={() => window.open(msg.image_url, '_blank')}
                    />
                    <p className={`text-sm ${
                      msg.sender_id === currentUser?.id 
                        ? 'text-muted-foreground' 
                        : 'text-primary-foreground/70'
                    }`}>
                      {formatTimestamp(msg.created_at)}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {msg.message_text}
                    </p>
                    <p className={`text-sm mt-1.5 ${
                      msg.sender_id === currentUser?.id 
                        ? 'text-muted-foreground' 
                        : 'text-primary-foreground/70'
                    }`}>
                      {formatTimestamp(msg.created_at)}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area with enhanced styling */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage || isSending || !targetUser}
            className="hover:bg-muted/80"
          >
            {isUploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Input
            type="text"
            placeholder="اكتب رسالتك..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 text-base py-6 px-4"
            disabled={isSending || isUploadingImage || !targetUser}
          />
          <Button 
            type="submit" 
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={!newMessage.trim() || isSending || isUploadingImage || !targetUser}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
