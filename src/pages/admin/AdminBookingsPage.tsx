import React, { useEffect } from "react"; // Removed useCallback as it's not needed here
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, Check, X, RefreshCw, MessageSquare } from "lucide-react"; // Import MessageSquare

const AdminBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({
        title: "تمت الموافقة على الحجز",
        description: "تم إرسال إشعار للطالب",
      });
    } catch (error) {
      toast({
        title: "فشلت العملية",
        variant: "destructive",
      });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "rejected");
      toast({
        title: "تم رفض الحجز",
        description: "تم إرسال إشعار للطالب",
      });
    } catch (error) {
      toast({
        title: "فشلت العملية",
        variant: "destructive",
      });
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
                <div
                  key={booking.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div className="flex items-start p-4">
                    <div className="w-24 h-24 rounded-md overflow-hidden ml-4">
                      <img
                        src={
                          property.images[0] ||
                          "https://via.placeholder.com/100?text=صورة+غير+متوفرة"
                        }
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{property.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {property.location}
                      </p>
                      <div className="inline-block px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        قيد المراجعة
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">اسم الطالب:</span> {booking.fullName}
                        </p>
                        {/* Add Faculty */}
                        <p className="text-sm">
                          <span className="font-semibold">الكلية:</span> {booking.faculty}
                        </p>
                        {/* Add Phone */}
                        <p className="text-sm">
                          <span className="font-semibold">الهاتف:</span> {booking.phone}
                        </p>
                        {/* Add Alternative Phone if exists */}
                        {booking.alternativePhone && (
                          <p className="text-sm">
                            <span className="font-semibold">هاتف بديل:</span> {booking.alternativePhone}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-semibold">تاريخ الطلب:</span>{" "}
                          {new Date(booking.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border p-3 bg-muted/30 flex justify-end gap-2">
                    {/* Add Contact Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => {
                        // Format phone number for WhatsApp (assuming Egyptian numbers)
                        let whatsappNumber = booking.phone;
                        if (whatsappNumber.startsWith('0')) {
                          whatsappNumber = '2' + whatsappNumber; // Replace leading 0 with 20
                        } else if (!whatsappNumber.startsWith('20')) {
                           whatsappNumber = '20' + whatsappNumber; // Add 20 if no prefix
                        }
                        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 ml-1" />
                      مراسلة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleRejectBooking(booking.id)}
                    >
                      <X className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleApproveBooking(booking.id)}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      قبول
                    </Button>
                  </div>
                </div>
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
                <div
                  key={booking.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div className="flex items-start p-4">
                    <div className="w-24 h-24 rounded-md overflow-hidden ml-4">
                      <img
                        src={
                          property.images[0] ||
                          "https://via.placeholder.com/100?text=صورة+غير+متوفرة"
                        }
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{property.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {property.location}
                      </p>
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
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">اسم الطالب:</span> {booking.fullName}
                        </p>
                        <p className="text-sm">
                          تاريخ التحديث:{" "}
                          {new Date(booking.updatedAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
