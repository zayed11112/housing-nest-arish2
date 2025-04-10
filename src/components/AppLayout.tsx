import React, { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
// Import necessary icons
import { 
  Moon, Sun, RotateCw, Search, User, Home, Heart, LayoutGrid, LogOut, 
  Calendar, BookmarkIcon, PlusSquare, List, Users, Settings, Building, MessageCircle
} from 'lucide-react'; 
import Logo from './Logo';
import UserWelcome from './UserWelcome';
import FloatingChatButton from './FloatingChatButton'; // Import the new component
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  hideBottomNav?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  hideBottomNav = false,
}) => {
  const { theme, setTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const getNavLinkClass = (isActive: boolean) => {
    return `flex flex-col items-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
  };

  // حصول على الحروف الأولى من اسم المستخدم لعرضها في الصورة الافتراضية
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-background border-b border-primary/10 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        {/* Logo - izquierda */}
        <div className="flex-none">
          <Logo />
        </div>
        
        {/* Botones y Avatar agrupados */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full hover:bg-primary/5"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh"
            className="rounded-full hover:bg-primary/5"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full h-9 w-9 p-0 ring-2 ring-primary/20" size="icon">
                  <Avatar className="h-full w-full">
                    {currentUser.avatar_url ? (
                      <AvatarImage 
                        src={currentUser.avatar_url} 
                        alt={currentUser.name || 'User avatar'} 
                      />
                    ) : null}
                    <AvatarFallback className="text-xs bg-primary/10">
                      {currentUser.name 
                        ? getInitials(currentUser.name) 
                        : <User className="h-4 w-4" />
                      }
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-72 py-3 ${theme === 'dark' ? 'bg-[#151c2c]' : 'bg-white'}`}>
                <div className="flex flex-col items-center justify-center p-4 pb-3">
                  <Avatar className="h-20 w-20 mb-3 ring-2 ring-primary/30">
                    {currentUser.avatar_url ? (
                      <AvatarImage 
                        src={currentUser.avatar_url} 
                        alt={currentUser.name || 'User avatar'} 
                      />
                    ) : null}
                    <AvatarFallback className={`text-lg ${theme === 'dark' ? 'bg-primary/10' : 'bg-slate-100'}`}>
                      {currentUser.name 
                        ? getInitials(currentUser.name) 
                        : <User className="h-6 w-6" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-base">
                      {currentUser.fullName || currentUser.name || 'مستخدم'} {/* Use fullName as primary */}
                    </span>
                    {/* Removed student_id display as it's not in LocalUser */}
                    {currentUser.role && (
                      <span className={`text-xs mt-1 px-3 py-1 rounded-full ${theme === 'dark' 
                        ? 'bg-indigo-500/20 text-indigo-400' 
                        : 'bg-indigo-100 text-indigo-700'}`}>
                        {currentUser.role === 'admin' ? 'مدير' : 'طالب'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-2 space-y-1">
                  {/* Conditional Rendering based on role */}
                  {currentUser.role === 'admin' && (
                    <>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/admin/properties/add')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-700 ml-3">
                          <PlusSquare className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">إضافة عقار جديد</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/admin/properties')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 ml-3">
                          <Building className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">إدارة العقارات</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/admin/bookings')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 text-yellow-700 ml-3">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">إدارة طلبات الحجز</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/admin/users')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 text-purple-700 ml-3">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">إدارة المستخدمين</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/admin/settings')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-700 ml-3">
                          <Settings className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">الإعدادات</span>
                      </DropdownMenuItem>
                      {/* Chat Link for Admin */}
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/chat')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-cyan-100 text-cyan-700 ml-3">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">💬 الشات</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {currentUser.role !== 'admin' && (
                    <>
                      {/* Regular User Links */}
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/bookings')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 ml-3">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">قسم الحجز</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/favorites')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-red-100 text-red-700 ml-3">
                          <Heart className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">المفضلة</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`}
                        onClick={() => navigate('/profile')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-700 ml-3">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">حسابي</span>
                      </DropdownMenuItem>
                       {/* Chat Link for Regular User */}
                       <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'hover:bg-primary/5' : 'hover:bg-slate-100'}`} 
                        onClick={() => navigate('/chat')}>
                        <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-cyan-100 text-cyan-700 ml-3">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-center font-medium">💬 الشات</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Logout Link (Common) */}
                  <DropdownMenuItem className={`cursor-pointer flex items-center justify-center p-2 transition-colors rounded-md focus:bg-transparent ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                    onClick={handleLogout}>
                    <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-red-100 text-red-700 ml-3">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="flex-grow text-center font-medium">تسجيل الخروج</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      
      {title && (
        <div className="bg-muted/50 p-2 border-b border-border">
          <h1 className="font-medium text-base text-center">{title}</h1>
        </div>
      )}
      
      <UserWelcome />
      <main className="p-4 pb-20">{children}</main>
      {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-md flex items-center justify-around py-3">
          <NavLink to="/" className={({ isActive }) => getNavLinkClass(isActive)}>
            <div className={`rounded-full p-1.5 ${currentUser && location.pathname === '/' ? 'bg-primary/10' : ''}`}>
              <Home className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1 font-medium">الرئيسية</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => getNavLinkClass(isActive)}>
            <div className={`rounded-full p-1.5 ${currentUser && location.pathname === '/search' ? 'bg-primary/10' : ''}`}>
              <Search className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1 font-medium">البحث</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => getNavLinkClass(isActive)}>
            <div className={`rounded-full p-1.5 ${currentUser && location.pathname === '/categories' ? 'bg-primary/10' : ''}`}>
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1 font-medium">الأقسام</span>
          </NavLink>
          <NavLink to="/favorites" className={({ isActive }) => getNavLinkClass(isActive)}>
            <div className={`rounded-full p-1.5 ${currentUser && location.pathname === '/favorites' ? 'bg-primary/10' : ''}`}>
              <Heart className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1 font-medium">المفضلة</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => getNavLinkClass(isActive)}>
            <div className={`rounded-full p-1.5 ${currentUser && location.pathname === '/profile' ? 'bg-primary/10' : ''}`}>
              <User className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1 font-medium">حسابي</span>
          </NavLink>
        </div>
      )}
      {/* Add the floating chat button */}
      <FloatingChatButton /> 
    </div>
  );
};

export default AppLayout;
