import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components
// Removed useToast import
import { toast } from "sonner"; // Import sonner toast
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, Check, X, RefreshCw, MessageSquare } from "lucide-react";

const AdminBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  // Removed useToast hook call
  // Update to use refactored useApp
  const { auth, bookings: bookingsContext, properties: propertiesContext } = useApp(); 
  const { currentUser } = auth;
  const { bookingRequests, updateBookingStatus, refreshBookings } = bookingsContext;
  const { properties } = propertiesContext;

  // Check if the user is an admin, if not redirect to home
  useEffect(() => {
    if (currentUser?.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // تحديث طلبات الحجز عند تحميل الصفحة
  useEffect(() => {
    if (currentUser?.role === "admin") {
      refreshBookings();
    }
  }, [currentUser, refreshBookings]);

  if (currentUser?.role !== "admin") {
    return null;
  }

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "approved");
      // Use sonner toast.success
      toast.success("تمت الموافقة على الحجز", {
        description: "تم إرسال إشعار للطالب",
      });
    } catch (error) {
      // Use sonner toast.error
      toast.error("فشلت العملية");
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "rejected");
      // Use sonner toast.success (or maybe info/warning?)
      toast.success("تم رفض الحجز", {
        description: "تم إرسال إشعار للطالب",
      });
    } catch (error) {
      // Use sonner toast.error
      toast.error("فشلت العملية");
    }
  };

  // Group bookings by status
  const pendingBookings = bookingRequests.filter(
    (booking) => booking.status === "pending"
  );
  const processedBookings = bookingRequests.filter(
    (booking) => booking.status !== "pending"
  );

  return (
    <AppLayout hideBottomNav>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background p-4 border-b border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">إدارة طلبات الحجز</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refreshBookings()}
          title="تحديث طلبات الحجز"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-16 mb-4">
        <h2 className="font-bold text-lg mb-4">طلبات قيد الانتظار</h2>
        {pendingBookings.length > 0 ? (
          <div className="space-y-4">
            {pendingBookings.map((booking) => {
              const property = properties.find(
                (p) => p.id === booking.propertyId
              );
              if (!property) return null;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start gap-4 p-4">
                    <img
                      src={
                        property.images[0] ||
                        "https://via.placeholder.com/100?text=صورة+غير+متوفرة"
                      }
                      alt={property.name}
                      className="w-20 h-20 object-cover rounded-md border" // Adjusted size
                    />
                    <div className="flex-1">
                      <CardTitle className="mb-1">{property.name}</CardTitle>
                      <CardDescription className="mb-2">
                        {property.location}
                      </CardDescription>
                      <div className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        قيد المراجعة
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0"> {/* Removed top padding */}
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">اسم الطالب:</span> {booking.fullName}
                      </p>
                      <p>
                        <span className="font-semibold">الكلية:</span> {booking.faculty}
                      </p>
                      <p>
                        <span className="font-semibold">الهاتف:</span> {booking.phone}
                      </p>
                      {booking.alternativePhone && (
                        <p>
                          <span className="font-semibold">هاتف بديل:</span> {booking.alternativePhone}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">تاريخ الطلب:</span>{" "}
                        {new Date(booking.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 bg-muted/30 flex justify-end gap-2">
                    {/* WhatsApp Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => {
                        let whatsappNumber = booking.phone;
                        if (whatsappNumber.startsWith('0')) {
                          whatsappNumber = '2' + whatsappNumber;
                        } else if (!whatsappNumber.startsWith('20')) {
                           whatsappNumber = '20' + whatsappNumber;
                        }
                        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 ml-1" />
                      واتساب
                    </Button>
                    {/* In-App Chat Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => {
                        navigate(`/chat/${booking.userId}`, { state: { property } });
                      }}
                    >
                      <MessageSquare className="h-4 w-4 ml-1" />
                      مراسلة (التطبيق)
                    </Button>
                    {/* Reject Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleRejectBooking(booking.id)}
                    >
                      <X className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                    {/* Approve Button */}
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleApproveBooking(booking.id)}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      قبول
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-border rounded-lg">
            <p className="text-muted-foreground">لا توجد طلبات قيد الانتظار</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-lg mb-4">طلبات تمت معالجتها</h2>
        {processedBookings.length > 0 ? (
          <div className="space-y-4">
            {processedBookings.map((booking) => {
              const property = properties.find(
                (p) => p.id === booking.propertyId
              );
              if (!property) return null;

              return (
                <Card key={booking.id} className="overflow-hidden">
                   <CardHeader className="flex flex-row items-start gap-4 p-4">
                    <img
                      src={
                        property.images[0] ||
                        "https://via.placeholder.com/100?text=صورة+غير+متوفرة"
                      }
                      alt={property.name}
                      className="w-20 h-20 object-cover rounded-md border" // Adjusted size
                    />
                    <div className="flex-1">
                      <CardTitle className="mb-1">{property.name}</CardTitle>
                      <CardDescription className="mb-2">
                        {property.location}
                      </CardDescription>
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          booking.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status === "approved"
                          ? "تمت الموافقة"
                          : "تم الرفض"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0"> {/* Removed top padding */}
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">اسم الطالب:</span> {booking.fullName}
                      </p>
                      <p>
                        <span className="font-semibold">تاريخ التحديث:</span>{" "}
                        {new Date(booking.updatedAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </CardContent>
                  {/* No CardFooter needed for processed bookings */}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-border rounded-lg">
            <p className="text-muted-foreground">لا توجد طلبات تمت معالجتها</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminBookingsPage;
