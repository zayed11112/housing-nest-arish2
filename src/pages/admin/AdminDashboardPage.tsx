import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
// Removed useToast import
import { toast } from "sonner"; // Import sonner toast
import { useAuth } from "@/contexts/AuthContext";
import { useProperties } from "@/contexts/PropertiesContext";
import { useBookings } from "@/contexts/BookingsContext";
import {
  Building2,
  Users,
  CalendarCheck2,
  Home,
  Plus,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  // Removed useToast hook call
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { bookingRequests, isLoading: bookingsLoading } = useBookings();

  useEffect(() => {
    document.title = "لوحة التحكم - شركة السهم";
  }, []);

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== "admin")) {
      // Use sonner toast.error
      toast.error("تنبيه الوصول", {
        description: "ليس لديك صلاحيات للوصول إلى هذه الصفحة",
      });
      navigate("/");
    }
  }, [currentUser, navigate, authLoading]); // Removed toast from dependency array

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      // Use sonner toast.error
      toast.error("خطأ في تسجيل الخروج", {
        description: "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  if (authLoading || propertiesLoading || bookingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">جاري التحميل...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  const availableProperties = properties.filter((p) => p.available);
  const pendingBookings = bookingRequests.filter((b) => b.status === "pending");

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground">مرحباً بك في لوحة تحكم المسؤول</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العقارات</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground">
                {availableProperties.length} عقار متاح
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات الحجز</CardTitle>
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingBookings.length} طلب في انتظار المراجعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العقارات المتاحة</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableProperties.length}</div>
              <p className="text-xs text-muted-foreground">
                {properties.length - availableProperties.length} عقار غير متاح
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/properties")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                إدارة العقارات
              </CardTitle>
              <CardDescription>عرض وإدارة جميع العقارات المتاحة</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/properties/add")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                إضافة عقار جديد
              </CardTitle>
              <CardDescription>إضافة عقار جديد إلى القائمة</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/bookings")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5" />
                طلبات الحجز
                {pendingBookings.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingBookings.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>إدارة ومراجعة طلبات الحجز</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إدارة المستخدمين
              </CardTitle>
              <CardDescription>عرض وإدارة حسابات المستخدمين</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/admin/settings")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات
              </CardTitle>
              <CardDescription>تخصيص إعدادات النظام</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboardPage;
