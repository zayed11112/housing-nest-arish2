import React, { useState, useEffect, useRef } from 'react'; // Removed useCallback
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // Added useParams, useLocation, removed useSearchParams
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext'; // Use AuthContext directly
import { useChat, ChatMessage } from '@/contexts/ChatContext'; // Use ChatContext
import { Property } from '@/types'; // Import Property type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, RefreshCw, Paperclip, Image as ImageIcon, Loader2, MessageSquare } from 'lucide-react'; // Removed UserCircle
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { ProfilesRow } from '@/types/database';
import { toast } from 'sonner';

const imgbbApiKey = "d4c80caf18ac57a20be196713f4245c2"; // Your ImgBB API Key

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId: userIdFromUrl } = useParams<{ userId: string }>(); // Get userId from URL path
  const location = useLocation();
  const propertyFromState = location.state?.property as Property | undefined; // Get property from state

  const { currentUser, isLoading: isAuthLoading } = useAuth(); // Use AuthContext
  const {
    messages,
    isLoadingMessages,
    sendMessage,
    setActiveChatPartner,
    refreshMessages,
    adminUser, // Get adminUser for non-admin users
  } = useChat(); // Use ChatContext

  const [targetUserProfile, setTargetUserProfile] = useState<ProfilesRow | null>(null); // State for target user's profile
  const [isLoadingTargetProfile, setIsLoadingTargetProfile] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialMessageSentRef = useRef(false); // Ref to track if initial message was sent

  // Determine the target user ID and set active chat partner
  useEffect(() => {
    let targetId: string | null = null;
    if (currentUser?.role === 'admin' && userIdFromUrl) {
      targetId = userIdFromUrl;
    } else if (currentUser?.role !== 'admin') {
      targetId = adminUser?.id || null; // Non-admin users chat with the admin
    }

    if (targetId) {
      console.log("Setting active partner in ChatPage effect:", targetId);
      setActiveChatPartner(targetId);
    } else if (currentUser && currentUser.role === 'admin' && !userIdFromUrl) {
      // Admin landed on /chat without a specific user, redirect to list
      navigate('/admin/chats');
    } else if (currentUser && currentUser.role !== 'admin' && !adminUser) {
      // User landed on /chat but admin couldn't be found
      console.warn("ChatPage: Admin user not found for non-admin user.");
      // Optionally show an error message or redirect
    }

    // Cleanup function to reset partner when leaving the page
    return () => {
      console.log("ChatPage unmounting, resetting active partner");
      setActiveChatPartner(null);
    };
  }, [currentUser, userIdFromUrl, adminUser, setActiveChatPartner, navigate]);

  // Fetch target user's profile details
  useEffect(() => {
    const fetchTargetProfile = async (id: string) => {
      setIsLoadingTargetProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setTargetUserProfile(data as ProfilesRow);
      } catch (error) {
        console.error("Error fetching target user profile:", error);
        toast.error("لا يمكن تحميل بيانات المستخدم للشات.");
        setTargetUserProfile(null); // Reset on error
      } finally {
        setIsLoadingTargetProfile(false);
      }
    };

    // Determine the target ID again (could be simplified)
    let targetId: string | null = null;
    if (currentUser?.role === 'admin' && userIdFromUrl) {
      targetId = userIdFromUrl;
    } else if (currentUser?.role !== 'admin') {
      targetId = adminUser?.id || null;
    }

    if (targetId) {
      fetchTargetProfile(targetId);
    } else {
      setTargetUserProfile(null); // No target ID, no profile
      setIsLoadingTargetProfile(false);
    }
  }, [userIdFromUrl, adminUser, currentUser]); // Re-fetch if target changes

  // Send initial message about the property if navigated from admin bookings
  useEffect(() => {
    if (
      currentUser?.role === 'admin' &&
      propertyFromState &&
      targetUserProfile && // Ensure target user profile is loaded
      !isLoadingMessages && // Ensure messages aren't currently loading
      messages.length === 0 && // Only send if chat is empty
      !initialMessageSentRef.current // Only send once
    ) {
      const initialMessage = `مرحباً ${targetUserProfile.full_name || '،'} بخصوص حجز العقار: ${propertyFromState.name} (${propertyFromState.location})`;
      initialMessageSentRef.current = true; // Mark as sent
      sendMessage(initialMessage, null).then(success => {
        if (success) {
          console.log("Initial property message sent.");
          // Optionally refresh messages after sending, though realtime should handle it
          // refreshMessages();
        } else {
          console.error("Failed to send initial property message.");
          initialMessageSentRef.current = false; // Allow retry if failed?
        }
      });
    }
  }, [
      currentUser,
      propertyFromState,
      targetUserProfile,
      isLoadingMessages,
      messages,
      sendMessage,
      // refreshMessages // Add if refresh is needed after send
  ]);


  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Text Send Handler (uses sendMessage from context)
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || isUploadingImage) return;

    const textToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    const success = await sendMessage(textToSend.trim(), null); // Use context's sendMessage
    if (!success) {
      setNewMessage(textToSend); // Restore text on failure
    }
    // No need to manually fetch, realtime/context handles updates
    setIsSending(false);
  };

  // Image Upload Handler
  const handleImageUpload = async (file: File) => {
    // Use displayTargetUser which holds the profile of the active partner
    if (!currentUser || !displayTargetUser || isSending || isUploadingImage) return; 

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
      // Use sendMessage from context instead of the removed sendMessageInternal
      const success = await sendMessage(null, imageUrl); 

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
  if (isAuthLoading || !currentUser) {
    return <AppLayout hideBottomNav><div className="mt-16 p-4 text-center">جاري تحميل المستخدم...</div></AppLayout>;
  }
  // Determine the effective target user for display/logic
  const displayTargetUser = currentUser.role === 'admin' ? targetUserProfile : adminUser;

  if (!displayTargetUser && (isLoadingTargetProfile || (currentUser.role !== 'admin' && !adminUser))) {
     return <AppLayout hideBottomNav><div className="mt-16 p-4 text-center">جاري تحميل بيانات الشات...</div></AppLayout>;
  }

  if (!displayTargetUser) {
     const errorMsg = currentUser.role === 'admin'
       ? "المستخدم المحدد غير موجود أو لا يمكن تحميله."
       : "لا يوجد مسؤول متاح للمحادثة حالياً.";
     return (
       <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center text-red-600">{errorMsg}</div>
       </AppLayout>
     );
   }

  return (
    <AppLayout hideBottomNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm p-4 border-b border-border shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate back appropriately
              if (currentUser?.role === 'admin') {
                 navigate(location.state?.fromAdminBookings ? '/admin/bookings' : '/admin/chats');
              } else {
                navigate(-1); // Go back for regular users
              }
            }}
            className="hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {/* Display Target User Info */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={displayTargetUser.avatar_url || undefined} alt={displayTargetUser.full_name || 'User'} />
              <AvatarFallback className="text-lg">{getInitials(displayTargetUser.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-lg">{displayTargetUser.full_name || 'مستخدم'}</span>
              <span className="text-xs text-muted-foreground">
                {displayTargetUser.role === 'admin' ? 'مسؤول النظام' : 'مستخدم'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshMessages} // Use refresh from context
            disabled={isLoadingMessages}
            className="hover:bg-muted/80"
          >
            <RefreshCw className={`h-5 w-5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      {/* Adjust top padding to account for potential property info */}
      <div className={`fixed inset-0 bottom-[80px] bg-gradient-to-b from-background to-muted/30 overflow-hidden ${propertyFromState ? 'top-[145px]' : 'top-[73px]'}`}>
        {/* Property Info Card (if available) */}
        {propertyFromState && (
          <div className="fixed top-[73px] left-0 right-0 z-40 bg-background/80 backdrop-blur-sm p-3 border-b border-border shadow-sm">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <img
                src={propertyFromState.images?.[0] || 'https://via.placeholder.com/60?text=N/A'}
                alt={propertyFromState.name}
                className="w-12 h-12 rounded-md object-cover border border-border"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  محادثة بخصوص: {propertyFromState.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {propertyFromState.location}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="h-full overflow-y-auto space-y-4 py-4 px-4">
          {/* Loading/Empty States */}
          {isLoadingMessages && messages.length === 0 && (
            <div className="space-y-6 p-4">
              <Skeleton className="h-12 w-3/4 mr-auto" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-3/4 mr-auto" />
            </div>
          )}
          {!isLoadingMessages && messages.length === 0 && !propertyFromState && ( // Show only if no property context either
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg">ابدأ المحادثة الآن...</p>
            </div>
          )}

          {/* Render Messages from Context */}
          {messages.map((msg, index) => (
             <div
              key={msg.id || `msg-${index}`} // Use message ID from context
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

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage || isSending || !displayTargetUser} // Disable if no target
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
            disabled={isSending || isUploadingImage || !displayTargetUser} // Disable if no target
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled={!newMessage.trim() || isSending || isUploadingImage || !displayTargetUser} // Disable if no target
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
