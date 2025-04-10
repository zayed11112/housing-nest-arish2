import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const FloatingChatButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useApp();
  const { currentUser } = auth;
  const [showText, setShowText] = useState(false);

  // إخفاء الزر في صفحة المحادثة
  if (location.pathname === '/chat') {
    return null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setShowText(prev => !prev);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Hide button only for admin users
  if (currentUser?.role === 'admin') {
    return null;
  }

  const handleClick = () => {
    if (currentUser) {
      navigate('/chat');
    } else {
      navigate('/login'); // Redirect to login if not logged in
    }
  };

  return (
    <div className="fixed bottom-20 right-4 flex items-center gap-2 z-40">
      <div 
        className={`
          absolute right-16 bg-primary text-primary-foreground rounded-lg px-3 py-1.5
          transition-all duration-500 text-sm font-medium whitespace-nowrap
          ${showText ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}
      >
        تواصل معنا
      </div>
      <Button
        variant="default"
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg animate-bounce-gentle"
        onClick={handleClick}
        aria-label="Open Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <style>
        {`
          @keyframes bounce-gentle {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 2s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default FloatingChatButton;
