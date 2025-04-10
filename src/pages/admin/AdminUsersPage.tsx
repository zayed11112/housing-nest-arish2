import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
// import { useAuth } from '@/contexts/AuthContext'; // No longer needed directly
import { useApp } from '@/contexts/AppContext'; // Import useApp hook
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, UserCog, Trash2, Ban, Download, CheckCircle } from 'lucide-react';
// Define ProfilesRow locally as a workaround for type generation issues
interface ProfilesRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null; // Added status
  student_id: string | null;
  faculty: string | null;
  batch: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}
import { UserRole, UserStatus } from '@/types';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as XLSX from 'xlsx';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  // Use the refactored useApp hook
  const { auth, isLoading: isAppLoading } = useApp(); 
  // Destructure auth functions and state
  const { currentUser, getAllUsers, updateUserRole, updateUserStatus } = auth; 
  const [users, setUsers] = useState<ProfilesRow[]>([]);
  // Use local loading state, potentially combine with isAppLoading if needed
  const [isLoading, setIsLoading] = useState(true); 
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Calculate user counts
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  // Assuming 'user' or 'student' role means student for counting purposes
  const studentCount = users.filter(u => u.role === 'user' || u.role === 'student').length; 

  const fetchUsers = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      const usersWithStatus = fetchedUsers.map(u => ({
        ...u,
        status: u.status || 'active' // Default status if null
      }));
      setUsers(usersWithStatus as ProfilesRow[]);
    } catch (error) {
      console.error("Failed to fetch users for page:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    } else if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast.error("لا يمكنك تغيير دور حسابك الخاص.");
      return;
    }
    setIsUpdatingRole(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    }
    setIsUpdatingRole(null);
  };

  const handleStatusChange = async (user: ProfilesRow) => {
     if (user.id === currentUser?.id) {
      toast.error("لا يمكنك تغيير حالة حسابك الخاص.");
      return;
    }
    const currentStatus = (user.status || 'active') as UserStatus;
    const newStatus: UserStatus = currentStatus === 'active' ? 'banned' : 'active';
    setIsUpdatingStatus(user.id);
    const result = await updateUserStatus(user.id, newStatus);
    if (result.success) {
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
      );
    }
    setIsUpdatingStatus(null);
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleExportExcel = () => {
    if (!users || users.length === 0) {
      toast.warning("لا يوجد مستخدمين لتصديرهم.");
      return;
    }
    const worksheetData = users.map(user => ({
      'الاسم الكامل': user.full_name || '-',
      'البريد الإلكتروني': user.email || '-',
      'معرف الطالب': user.student_id || '-',
      'الكلية': user.faculty || '-',
      'الدفعة': user.batch || '-',
      'الهاتف': user.phone || '-',
      'الدور': user.role === 'admin' ? 'مدير' : 'طالب',
      'الحالة': (user.status || 'active') === 'active' ? 'نشط' : 'محظور',
      'تاريخ الإنشاء': user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '-',
      'تاريخ آخر تحديث': user.updated_at ? new Date(user.updated_at).toLocaleDateString('ar-EG') : '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المستخدمين");
    worksheet['!cols'] = [ { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 } ];
    try {
      XLSX.writeFile(workbook, "قائمة_المستخدمين.xlsx");
      toast.success("تم بدء تصدير قائمة المستخدمين بنجاح.");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("حدث خطأ أثناء تصدير الملف.");
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <AppLayout hideBottomNav>
         <div className="mt-16 p-4 text-center">Loading user data...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideBottomNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg flex-1 text-center">إدارة المستخدمين</h1>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isLoading || users.length === 0}>
           <Download className="h-4 w-4 ml-1" />
           تصدير Excel
        </Button>
        <Button variant="ghost" size="icon" onClick={fetchUsers} disabled={isLoading} title="تحديث قائمة المستخدمين">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Page Content */}
      <div className="mt-20 p-4">
        {/* User Counts Summary */}
        {!isLoading && users.length > 0 && (
           <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{totalUsers}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">عدد الطلاب</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{studentCount}</div>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium">عدد المديرين</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{adminCount}</div>
               </CardContent>
             </Card>
           </div>
        )}

        {/* User Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                <CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
           <p className="text-center text-muted-foreground">لا يوجد مستخدمين لعرضهم.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className={`flex flex-col ${user.status === 'banned' ? 'opacity-60 bg-muted/30' : ''}`}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                   <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                       <CardTitle className="text-lg">{user.full_name || 'مستخدم غير مسمى'}</CardTitle>
                       <CardDescription className="text-xs">{user.email || 'لا يوجد بريد إلكتروني'}</CardDescription>
                    </div>
                     <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                       {user.role === 'admin' ? 'مدير' : (user.role === 'user' ? 'طالب' : (user.role || 'غير معروف'))}
                     </Badge>
                     <Badge variant={(user.status || 'active') === 'active' ? 'default' : 'outline'} className={`text-xs ${(user.status || 'active') === 'banned' ? 'border-yellow-600 text-yellow-600' : ''}`}>
                       {(user.status || 'active') === 'active' ? 'نشط' : 'محظور'}
                     </Badge>
                </CardHeader>
                <CardContent className="text-sm space-y-1 flex-grow">
                  {user.student_id && <p><strong>معرف الطالب:</strong> {user.student_id}</p>}
                  {user.faculty && <p><strong>الكلية:</strong> {user.faculty}</p>}
                  {user.batch && <p><strong>الدفعة:</strong> {user.batch}</p>}
                  {user.phone && <p><strong>الهاتف:</strong> {user.phone}</p>}
                  <p className="text-xs text-muted-foreground pt-1">
                    تاريخ الإنشاء: {user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '-'}
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4 flex flex-col gap-2">
                   <div className="w-full flex items-center gap-2">
                     <span className="text-sm font-medium">الدور:</span>
                     <Select
                       value={(user.role as UserRole) || 'user'}
                       onValueChange={(newRole) => handleRoleChange(user.id, newRole as UserRole)}
                       disabled={isUpdatingRole === user.id || user.id === currentUser?.id || user.status === 'banned'}
                     >
                       <SelectTrigger className="flex-1 h-9" disabled={isUpdatingRole === user.id || user.id === currentUser?.id || user.status === 'banned'}>
                         <SelectValue placeholder="Select role" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="admin">مدير</SelectItem>
                         <SelectItem value="user">طالب</SelectItem>
                         {/* Consider adding 'student' if it's a valid role */}
                       </SelectContent>
                     </Select>
                     {isUpdatingRole === user.id && <RefreshCw className="h-4 w-4 animate-spin" />}
                   </div>
                   <div className="w-full flex justify-end gap-2 mt-2">
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button
                             variant="outline"
                             size="sm"
                             className={(user.status || 'active') === 'active' ? "text-yellow-600 border-yellow-600 hover:bg-yellow-50" : "text-green-600 border-green-600 hover:bg-green-50"}
                             disabled={isUpdatingStatus === user.id || user.id === currentUser?.id}
                           >
                             {isUpdatingStatus === user.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : ((user.status || 'active') === 'active' ? <Ban className="h-4 w-4 ml-1" /> : <CheckCircle className="h-4 w-4 ml-1" />)}
                             {(user.status || 'active') === 'active' ? 'حظر' : 'إلغاء الحظر'}
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>تأكيد تغيير حالة المستخدم</AlertDialogTitle>
                             <AlertDialogDescription>
                               هل أنت متأكد أنك تريد {(user.status || 'active') === 'active' ? 'حظر' : 'إلغاء حظر'} المستخدم "{user.full_name || user.email}"؟
                               {(user.status || 'active') === 'active' && ' لن يتمكن المستخدم المحظور من تسجيل الدخول.'}
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>إلغاء</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handleStatusChange(user)}>
                               تأكيد {(user.status || 'active') === 'active' ? 'الحظر' : 'إلغاء الحظر'}
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>

                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => toast.info(`حذف المستخدم: ${user.full_name} (غير متاح بعد)`)}>
                         <Trash2 className="h-4 w-4 ml-1" /> حذف
                      </Button>
                   </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminUsersPage;
