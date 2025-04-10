
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, CalendarClock, MessageSquare } from 'lucide-react'; // Import MessageSquare
import { useApp } from '@/contexts/AppContext';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { auth } = useApp(); // Destructure auth from useApp
  const { currentUser } = auth; // Get currentUser from auth
  
  // استخدام useMemo لمنع إعادة إنشاء المصفوفة في كل مرة تحديث
  const navItems = useMemo(() => [
    {
      path: '/',
      icon: <Home className="h-6 w-6" />,
      label: 'الرئيسية',
    },
    {
      path: '/search',
      icon: <Search className="h-6 w-6" />,
      label: 'البحث',
    },
    {
      path: '/favorites',
      icon: <Heart className="h-6 w-6" />,
      label: 'المفضلة',
    },
    {
      path: '/bookings',
      icon: <CalendarClock className="h-6 w-6" />,
      label: 'الحجوزات',
    },
    {
      path: '/profile',
      icon: <User className="h-6 w-6" />,
      label: 'حسابي',
    },
    {
      path: '/chat', // Link to the main chat page for users
      icon: <MessageSquare className="h-6 w-6" />,
      label: 'المحادثة',
    },
  ], []);

  // Adjust grid columns based on number of items
  const gridColsClass = `grid-cols-${navItems.length}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className={`grid ${gridColsClass} h-16`}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${
              location.pathname === item.path ? 'bottom-nav-active' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
